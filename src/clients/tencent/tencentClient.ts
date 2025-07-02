import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import type { IRawTTSClient } from '../../types/clients';
import type { UnifiedTTSOptions } from '../../types/unified';
import type {
  TencentAuth,
  TencentTTSParams,
  TencentTTSResponse,
  TencentTTSChunk,
  TencentWSMessage,
  TencentTTSStreamResponse,
  TencentTTSIncrementalResponse,
} from './tencentTypes';
import { blobToBase64 } from '../../helpers/audio';
import { isBrowser } from '../../helpers/environment';

export class TencentClient implements IRawTTSClient<TencentTTSParams, TencentTTSResponse, TencentTTSChunk> {
  constructor(private auth: TencentAuth) {}

  getProviderName(): string {
    return 'tencent';
  }

  /**
   * 生成会话 ID
   */
  private generateSessionId(): string {
    const id = uuidv4();
    return id.replace(/-/g, '');
  }

  /**
   * 为腾讯云 TTS HTTP 请求生成签名
   */
  private generateHttpSignature(params: Record<string, string | number | boolean>): string {
    const sortedKeys = Object.keys(params).sort();
    let signStr = 'POST' + 'tts.cloud.tencent.com' + '/stream' + '?';

    for (const key of sortedKeys) {
      signStr += `${key}=${params[key]}&`;
    }
    signStr = signStr.slice(0, -1); // 移除最后一个 &

    const hmac = crypto.createHmac('sha1', this.auth.secret_key);
    hmac.update(signStr);
    return hmac.digest('base64');
  }

  /**
   * 为腾讯云 TTS WebSocket 生成签名
   */
  private generateWebSocketSignature(
    params: Record<string, string | number | boolean>,
    endpoint: string = '/stream_ws',
  ): string {
    const sortedKeys = Object.keys(params).sort();
    let signStr = 'GET' + 'tts.cloud.tencent.com' + endpoint + '?';

    for (const key of sortedKeys) {
      signStr += `${key}=${params[key]}&`;
    }
    signStr = signStr.slice(0, -1); // 移除最后一个 &

    const hmac = crypto.createHmac('sha1', this.auth.secret_key);
    hmac.update(signStr);
    return hmac.digest('base64');
  }

  /**
   * 创建 WebSocket URL
   */
  private createWebSocketUrl(
    params: Record<string, string | number | boolean>,
    signature: string,
    endpoint: string = '/stream_ws',
  ): string {
    let url = `wss://tts.cloud.tencent.com${endpoint}?`;

    const sortedParams = Object.entries(params).sort((a, b) => a[0].localeCompare(b[0]));

    for (const [key, value] of sortedParams) {
      if (key === 'Text') {
        url += `${key}=${encodeURIComponent(value)}&`;
      } else {
        url += `${key}=${value}&`;
      }
    }

    url += `Signature=${encodeURIComponent(signature)}`;
    return url;
  }

  /**
   * 批量合成文本为音频 - 使用HTTP POST
   */
  async synthesize(params: TencentTTSParams, options?: UnifiedTTSOptions): Promise<TencentTTSResponse> {
    const sessionId = this.generateSessionId();
    const timestamp = Math.floor(Date.now() / 1000);

    // 构建请求参数
    const requestParams = {
      Action: 'TextToStreamAudio',
      AppId: Number.parseInt(this.auth.app_id, 10),
      SecretId: this.auth.secret_id,
      ModelType: params.ModelType ?? 1,
      VoiceType: params.VoiceType ?? 0,
      Codec: params.Codec ?? 'mp3',
      SampleRate: params.SampleRate ?? 16000,
      Speed: params.Speed ?? 0,
      Volume: params.Volume ?? 0,
      SessionId: sessionId,
      Text: params.Text,
      Timestamp: timestamp,
      Expired: timestamp + 24 * 60 * 60,
    };

    // 生成签名
    const signature = this.generateHttpSignature(requestParams);

    // 发送HTTP请求
    const response = await fetch('https://tts.cloud.tencent.com/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: signature,
        ...options?.headers,
      },
      body: JSON.stringify(requestParams),
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(`腾讯云 TTS HTTP 错误: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('响应体为空');
    }

    // 处理流式响应
    const reader = response.body.getReader();
    const audioChunks: Uint8Array[] = [];
    let data: Uint8Array | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (data === null) {
        // 第一个chunk，检查是否为错误响应
        let isAudioData = false;
        let errorResponse: any = null;

        try {
          const textDecoder = new TextDecoder();
          const text = textDecoder.decode(value);
          errorResponse = JSON.parse(text);
        } catch (parseError) {
          // JSON解析失败，说明是音频数据
          isAudioData = true;
        }

        if (isAudioData) {
          // 是音频数据，继续处理
          data = value;
          audioChunks.push(value);
          continue;
        } else if (errorResponse?.Response?.Error) {
          console.log(errorResponse);
          throw new Error(
            `腾讯云 TTS 错误: ${errorResponse.Response.Error.Code} - ${errorResponse.Response.Error.Message}`,
          );
        } else {
          // 是其他JSON数据（可能是状态消息），跳过这个chunk
          continue;
        }
      } else {
        // 后续chunk，直接添加到音频数据
        const combined: Uint8Array = new Uint8Array(data.length + value.length);
        combined.set(data);
        combined.set(value, data.length);
        data = combined;
        audioChunks.push(value);
      }
    }

    if (!data || audioChunks.length === 0) {
      throw new Error('未收到音频数据');
    }

    // 创建音频Blob
    const audioBlob = new Blob(audioChunks, { type: `audio/${requestParams.Codec}` });
    // 转换为base64
    const audioBase64 = await blobToBase64(audioBlob);

    return {
      code: 0,
      message: '合成成功',
      session_id: sessionId,
      request_id: sessionId,
      message_id: this.generateSessionId(),
      audio_data: audioBase64,
      audio_blob: audioBlob,
      final: 1,
    };
  }

  /**
   * 流式合成文本为音频 - 使用WebSocket
   */
  async *synthesizeStream(
    params: TencentTTSParams,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<TencentTTSChunk> {
    const sessionId = this.generateSessionId();
    const timestamp = Math.floor(Date.now() / 1000);

    // 准备 WebSocket 连接参数
    const wsParams = {
      Action: 'TextToStreamAudioWS',
      AppId: Number.parseInt(this.auth.app_id, 10),
      SecretId: this.auth.secret_id,
      ModelType: params.ModelType ?? 1,
      VoiceType: params.VoiceType ?? 0,
      Codec: params.Codec ?? 'pcm',
      SampleRate: params.SampleRate ?? 16000,
      Speed: params.Speed ?? 0,
      Volume: params.Volume ?? 0,
      SessionId: sessionId,
      Text: params.Text,
      EnableSubtitle: params.EnableSubtitle ?? true,
      Timestamp: timestamp,
      Expired: timestamp + 24 * 60 * 60,
    };

    // 添加FastVoiceType（如果提供）
    if (params.FastVoiceType) {
      (wsParams as any).FastVoiceType = params.FastVoiceType;
    }

    // 生成签名
    const signature = this.generateWebSocketSignature(wsParams);

    // 创建 WebSocket URL
    const wsUrl = this.createWebSocketUrl(wsParams, signature);

    // 连接 WebSocket
    let ws: WebSocket;
    if (isBrowser()) {
      ws = new WebSocket(wsUrl);
    } else {
      const WebSocket = require('ws');
      ws = new WebSocket(wsUrl, {
        signal: options?.signal,
      });
    }

    // 使用简化的队列和等待系统
    const chunkQueue: TencentTTSChunk[] = [];
    let resolveWaiting: (() => void) | null = null;
    let isComplete = false;
    let hasError = false;
    let error: Error | null = null;

    // 通知等待中的生成器有新数据到达
    const notifyDataAvailable = () => {
      if (resolveWaiting) {
        const resolve = resolveWaiting;
        resolveWaiting = null;
        resolve();
      }
    };

    ws.onmessage = (event) => {
      const data = event.data;

      if (typeof data === 'string') {
        // 处理文本消息（状态更新）
        try {
          const response = JSON.parse(data) as TencentTTSStreamResponse;

          if (response.code !== 0) {
            hasError = true;
            error = new Error(`腾讯云 TTS 错误: ${response.message || '未知错误'}`);
            notifyDataAvailable();
            return;
          }

          // 检查是否完成
          if (response.final === 1) {
            isComplete = true;
            // 主动关闭连接
            ws.close();
          }

          // 处理字幕结果 - 总是创建chunk，即使没有字幕
          const chunk: TencentTTSChunk = {
            code: response.code,
            message: response.message,
            session_id: response.session_id,
            request_id: response.request_id,
            message_id: response.message_id,
            final: response.final,
            result: response.result,
          };
          chunkQueue.push(chunk);
          notifyDataAvailable();
        } catch (err) {
          hasError = true;
          error = new Error('解析 WebSocket 消息时出错');
          notifyDataAvailable();
        }
      } else if (data instanceof Buffer || data instanceof ArrayBuffer) {
        // 处理二进制消息（音频块）
        const audioBlob = new Blob([data], { type: `audio/${wsParams.Codec}` });
        const chunk: TencentTTSChunk = {
          code: 0,
          message: '成功',
          session_id: sessionId,
          request_id: sessionId,
          message_id: this.generateSessionId(),
          audio_data: audioBlob,
          final: 0, // 音频块不标记为final，等待后续的JSON状态消息
        };
        chunkQueue.push(chunk);
        notifyDataAvailable();
      }
    };

    ws.onclose = (event) => {
      isComplete = true;
      notifyDataAvailable();
    };

    ws.onerror = (err) => {
      hasError = true;
      error = new Error('TTS 流中的 WebSocket 错误');
      notifyDataAvailable();
    };

    try {
      // 等待连接建立
      await new Promise((resolve, reject) => {
        const originalOnOpen = ws.onopen;
        const originalOnError = ws.onerror;

        ws.onopen = (event) => {
          if (originalOnOpen) originalOnOpen.call(ws, event);
          resolve(void 0);
        };

        ws.onerror = (event) => {
          if (originalOnError) originalOnError.call(ws, event);
          reject(new Error('WebSocket连接失败'));
        };
      });

      // 主生成器循环 - 简化逻辑
      while (true) {
        // 处理队列中的所有chunk
        while (chunkQueue.length > 0) {
          const chunk = chunkQueue.shift()!;
          yield chunk;
        }

        // 检查是否应该结束
        if (isComplete) {
          break;
        }

        if (hasError && error) {
          throw error;
        }

        // 等待更多数据到达
        await new Promise<void>((resolve) => {
          resolveWaiting = resolve;
        });
      }
    } finally {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }
  }

  /**
   * 增量文本流合成为流式音频 - 使用 WebSocket v2
   * 维护单个 WebSocket 连接处理整个文本流
   */
  async *synthesizeIncremental(
    textStream: AsyncIterable<string>,
    params: Omit<TencentTTSParams, 'Text'>,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<TencentTTSChunk> {
    const sessionId = this.generateSessionId();
    const timestamp = Math.floor(Date.now() / 1000);

    // 准备 WebSocket 连接参数
    const wsParams = {
      Action: 'TextToStreamAudioWSv2',
      AppId: Number.parseInt(this.auth.app_id, 10),
      SecretId: this.auth.secret_id,
      ModelType: params.ModelType ?? 1,
      VoiceType: params.VoiceType ?? 0,
      Codec: params.Codec ?? 'pcm',
      SampleRate: params.SampleRate ?? 16000,
      Speed: params.Speed ?? 0,
      Volume: params.Volume ?? 0,
      SessionId: sessionId,
      EnableSubtitle: params.EnableSubtitle ?? false,
      Timestamp: timestamp,
      Expired: timestamp + 24 * 60 * 60,
    };

    // 生成签名
    const signature = this.generateWebSocketSignature(wsParams, '/stream_wsv2');

    // 创建 WebSocket URL
    const wsUrl = this.createWebSocketUrl(wsParams, signature, '/stream_wsv2');

    // 连接 WebSocket
    let ws: WebSocket;
    if (isBrowser()) {
      ws = new WebSocket(wsUrl);
    } else {
      const WebSocket = require('ws');
      ws = new WebSocket(wsUrl, {
        signal: options?.signal,
      });
    }

    // 状态管理
    const chunkQueue: TencentTTSChunk[] = [];
    let resolveNextChunk: ((value: IteratorResult<TencentTTSChunk, undefined>) => void) | null = null;
    let resolveReady: () => void;
    let rejectReady: (reason?: any) => void;
    let resolveConnected: () => void;
    let rejectConnected: (reason?: any) => void;

    const serverReady = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });

    const wsConnected = new Promise<void>((resolve, reject) => {
      resolveConnected = resolve;
      rejectConnected = reject;
    });

    let isComplete = false;
    let hasError = false;
    let error: Error | null = null;
    let serverReadyResolved = false;

    ws.onopen = () => {
      resolveConnected();
    };

    ws.onmessage = (event) => {
      const data = event.data;

      if (typeof data === 'string') {
        try {
          const response = JSON.parse(data) as TencentTTSIncrementalResponse;

          if (response.code !== 0) {
            hasError = true;
            error = new Error(`腾讯云 TTS 错误: ${response.message || '未知错误'}`);
            // 拒绝 serverReady promise，以防止客户端永远等待
            if (!serverReadyResolved) {
              serverReadyResolved = true;
              rejectReady(error);
            }
            ws.close();
            return;
          }

          // 检查 READY 信号
          if (response.ready === 1) {
            if (!serverReadyResolved) {
              serverReadyResolved = true;
              resolveReady();
            }
          }

          // 忽略心跳消息
          if (response.heartbeat === 1) {
            return;
          }

          if (response.final === 1) {
            isComplete = true;
            ws.close();
          }

          // 处理字幕结果
          if (response.result?.subtitles) {
            const chunk: TencentTTSChunk = {
              code: response.code,
              message: response.message,
              session_id: response.session_id,
              request_id: response.request_id,
              message_id: response.message_id,
              final: response.final,
              result: response.result,
            };
            chunkQueue.push(chunk);

            if (resolveNextChunk) {
              const resolve = resolveNextChunk;
              resolveNextChunk = null;
              const nextChunk = chunkQueue.shift();
              if (nextChunk) {
                resolve({ value: nextChunk, done: false });
              }
            }
          }
        } catch (err) {
          hasError = true;
          error = new Error('解析 WebSocket 消息时出错');
          // 拒绝 serverReady promise，以防止客户端永远等待
          if (!serverReadyResolved) {
            serverReadyResolved = true;
            rejectReady(error);
          }
          ws.close();
        }
      } else if (data instanceof Buffer || data instanceof ArrayBuffer) {
        // 处理二进制消息（音频块）
        const audioBlob = new Blob([data], { type: `audio/${wsParams.Codec}` });
        const chunk: TencentTTSChunk = {
          code: 0,
          message: '成功',
          session_id: sessionId,
          request_id: sessionId,
          message_id: this.generateSessionId(),
          audio_data: audioBlob,
          final: isComplete ? 1 : 0,
        };
        chunkQueue.push(chunk);

        if (resolveNextChunk) {
          const resolve = resolveNextChunk;
          resolveNextChunk = null;
          const nextChunk = chunkQueue.shift();
          if (nextChunk) {
            resolve({ value: nextChunk, done: false });
          }
        }
      }
    };

    ws.onclose = (event) => {
      isComplete = true;
      // 如果 WebSocket 意外关闭且 serverReady 尚未解决，则拒绝它
      if (!hasError && !serverReadyResolved) {
        serverReadyResolved = true;
        rejectReady(new Error('WebSocket 连接意外关闭'));
      }
      if (resolveNextChunk) {
        const resolve = resolveNextChunk;
        resolveNextChunk = null;
        resolve({ value: undefined, done: true });
      }
    };

    ws.onerror = (err) => {
      hasError = true;
      error = new Error('腾讯云 TTS 增量流中的 WebSocket 错误');
      rejectConnected(error);
      // 拒绝 serverReady promise，以防止客户端永远等待
      if (!serverReadyResolved) {
        serverReadyResolved = true;
        rejectReady(error);
      }
      if (resolveNextChunk) {
        const resolve = resolveNextChunk;
        resolveNextChunk = null;
        resolve({ value: undefined, done: true });
      }
    };

    try {
      // 1. 等待 WebSocket 连接打开
      await wsConnected;

      // 2. 等待服务器发送 READY 信号
      await serverReady;

      // 3. 异步处理输入文本流
      const processTextPromise = (async () => {
        let textSent = false;
        for await (const textChunk of textStream) {
          if (textChunk && textChunk.trim().length > 0) {
            const synthesisMessage: TencentWSMessage = {
              session_id: sessionId,
              message_id: this.generateSessionId(),
              action: 'ACTION_SYNTHESIS',
              data: textChunk,
            };
            ws.send(JSON.stringify(synthesisMessage));
            textSent = true;
          }
        }

        // 4. 发送完成信号
        if (textSent) {
          const completeMessage: TencentWSMessage = {
            session_id: sessionId,
            message_id: this.generateSessionId(),
            action: 'ACTION_COMPLETE',
            data: '',
          };
          ws.send(JSON.stringify(completeMessage));
        } else {
          const completeMessage: TencentWSMessage = {
            session_id: sessionId,
            message_id: this.generateSessionId(),
            action: 'ACTION_COMPLETE',
            data: '',
          };
          ws.send(JSON.stringify(completeMessage));
        }
      })();

      // 处理文本处理期间的错误
      processTextPromise.catch((err) => {
        hasError = true;
        error = err instanceof Error ? err : new Error('处理文本流失败');
        ws.close();
        if (resolveNextChunk) {
          const resolve = resolveNextChunk;
          resolveNextChunk = null;
          resolve({ value: undefined, done: true });
        }
      });

      // 5. 主循环，按音频块到达时生成它们
      while (true) {
        if (chunkQueue.length > 0) {
          const chunk = chunkQueue.shift()!;
          yield chunk;
        } else if (isComplete) {
          break;
        } else if (hasError) {
          throw error;
        } else {
          const result = await new Promise<IteratorResult<TencentTTSChunk, undefined>>((resolve) => {
            resolveNextChunk = resolve;
          });

          if (!result.done && result.value) {
            yield result.value;
          } else if (result.done) {
            continue;
          }
        }
      }
    } catch (err) {
      throw err;
    } finally {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }
  }
}
