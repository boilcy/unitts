// warper for elevenlabs client
import { ElevenLabs, ElevenLabsClient as ElevenLabsClientOriginal } from '@elevenlabs/elevenlabs-js';
import type { IRawTTSClient } from '../../types/clients';
import type { UnifiedTTSOptions } from '../../types/unified';
import { isBrowser } from '../../helpers/environment';
import {
  WSMessageClose,
  WSMessageInit,
  WSReceivedMessageAudio,
  TextToSpeechRequestExtended,
  StreamTextToSpeechRequestExtended,
  TextToSpeechRequestUnion,
  TextToSpeechRequestWithTimestamps,
  TextToSpeechRequestWithoutTimestamps,
  StreamTextToSpeechRequestWithTimestamps,
  StreamTextToSpeechRequestWithoutTimestamps,
  TTSResponse,
  TTSStreamResponse,
} from './elevenlabsTypes';

export class ElevenLabsClient
  implements
    IRawTTSClient<
      TextToSpeechRequestUnion,
      ElevenLabs.AudioWithTimestampsResponse | Uint8Array<ArrayBufferLike>,
      | ElevenLabs.StreamingAudioChunkWithTimestampsResponse
      | Uint8Array<ArrayBufferLike>
      | WSReceivedMessageAudio
    >
{
  private _client: ElevenLabsClientOriginal;

  constructor(private apiKey: string) {
    this._client = new ElevenLabsClientOriginal({ apiKey: this.apiKey });
  }

  getProviderName(): string {
    return 'elevenlabs';
  }

  async synthesize(
    params: TextToSpeechRequestWithTimestamps,
    options?: UnifiedTTSOptions,
  ): Promise<ElevenLabs.AudioWithTimestampsResponse>;

  async synthesize(
    params: TextToSpeechRequestWithoutTimestamps,
    options?: UnifiedTTSOptions,
  ): Promise<Uint8Array<ArrayBufferLike>>;

  // 实际实现
  async synthesize<T extends TextToSpeechRequestExtended>(
    params: T,
    options?: UnifiedTTSOptions,
  ): Promise<TTSResponse<T>> {
    const requestOptions = {
      timeoutInSeconds: options?.timeout ? options.timeout / 1000 : undefined,
      maxRetries: options?.maxRetries,
      abortSignal: options?.signal,
      headers: options?.headers,
    };

    if (params.withTimestamps === true) {
      return this._client.textToSpeech.convertWithTimestamps(
        params.voiceId,
        params,
        requestOptions,
      ) as unknown as Promise<TTSResponse<T>>;
    } else {
      return this._client.textToSpeech.convert(params.voiceId, params, requestOptions) as unknown as Promise<
        TTSResponse<T>
      >;
    }
  }

  synthesizeStream(
    params: StreamTextToSpeechRequestWithTimestamps,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<ElevenLabs.StreamingAudioChunkWithTimestampsResponse>;

  synthesizeStream(
    params: StreamTextToSpeechRequestWithoutTimestamps,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<Uint8Array<ArrayBufferLike>>;

  async *synthesizeStream<T extends StreamTextToSpeechRequestExtended>(
    params: T,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<TTSStreamResponse<T>> {
    const requestOptions = {
      timeoutInSeconds: options?.timeout ? options.timeout / 1000 : undefined,
      maxRetries: options?.maxRetries,
      abortSignal: options?.signal,
      headers: options?.headers,
    };

    if (params.withTimestamps === true) {
      yield* (await this._client.textToSpeech.streamWithTimestamps(
        params.voiceId,
        params,
        requestOptions,
      )) as unknown as AsyncGenerator<TTSStreamResponse<T>>;
    } else {
      const stream = await this._client.textToSpeech.stream(params.voiceId, params, requestOptions);

      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield value as unknown as TTSStreamResponse<T>;
        }
      } finally {
        reader.releaseLock();
      }
    }
  }

  async *synthesizeIncremental(
    textStream: AsyncIterable<string>,
    params: { voiceId: string } & ElevenLabs.TextToSpeechRequest,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<WSReceivedMessageAudio> {
    // elevenlabs allow send the authorization token in the first message
    // so we can do synthesizeIncremental in both browser and node
    if (isBrowser()) {
      yield* this.synthesizeIncrementalBrowser(textStream, params, options);
    } else {
      yield* this.synthesizeIncrementalNode(textStream, params, options);
    }
  }

  private async *synthesizeIncrementalBrowser(
    textStream: AsyncIterable<string>,
    params: { voiceId: string } & ElevenLabs.TextToSpeechRequest,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<WSReceivedMessageAudio> {
    const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${params.voiceId}/stream-input`;
    const ws = new WebSocket(wsUrl);

    const audioQueue: WSReceivedMessageAudio[] = [];
    let resolveNextChunk: ((value: IteratorResult<WSReceivedMessageAudio, undefined>) => void) | null = null;
    let isComplete = false;
    let hasError = false;
    let error: Error | null = null;

    // Promise for connection established
    let resolveConnected: () => void;
    let rejectConnected: (reason?: any) => void;
    const wsConnected = new Promise<void>((resolve, reject) => {
      resolveConnected = resolve;
      rejectConnected = reject;
    });

    const initMessage: WSMessageInit = {
      text: ' ',
      voiceSettings: params.voiceSettings,
      'xi-api-key': this.apiKey,
    };

    const finishMessage: WSMessageClose = {
      text: '',
    };

    // Setup WebSocket event handlers
    ws.onopen = () => {
      ws.send(JSON.stringify(initMessage));
      resolveConnected();
    };

    ws.onmessage = (event) => {
      try {
        const messageStr = event.data.toString();
        const message = JSON.parse(messageStr) as WSReceivedMessageAudio;

        audioQueue.push(message);
        if (resolveNextChunk) {
          const resolve = resolveNextChunk;
          resolveNextChunk = null;
          const chunk = audioQueue.shift();
          if (chunk) {
            resolve({ value: chunk, done: false });
          }
        }

        if (message.isFinal) {
          isComplete = true;
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        }
      } catch (err) {
        hasError = true;
        error = new Error(`Failed to parse WebSocket message: ${err}`);
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      }
    };

    ws.onclose = (event) => {
      isComplete = true;
      if (resolveNextChunk) {
        const resolve = resolveNextChunk;
        resolveNextChunk = null;
        resolve({ value: undefined, done: true });
      }
    };

    ws.onerror = (err) => {
      hasError = true;
      error = new Error(`WebSocket error: ${err.target?.toString()}`);
      rejectConnected(error);
      if (resolveNextChunk) {
        const resolve = resolveNextChunk;
        resolveNextChunk = null;
        resolve({ value: undefined, done: true });
      }
    };

    try {
      // Wait for WebSocket to be ready
      await wsConnected;

      // Start processing text stream
      const processTextStream = async () => {
        try {
          let firstText = true;
          let pendingText = '';
          for await (const text of textStream) {
            if (text && text.trim().length > 0) {
              pendingText += text;

              // Check if we have a complete sentence or significant chunk
              if (pendingText.match(/[.!?。！？]\s*$/) || pendingText.length > 50) {
                // Send accumulated text chunk for synthesis
                const continueMessage = {
                  text: pendingText,
                  tryTriggerGeneration: firstText,
                };
                ws.send(JSON.stringify(continueMessage));
                pendingText = '';
              }
            }
          }

          // Send finish message to indicate end of text stream
          ws.send(JSON.stringify(finishMessage));
        } catch (err) {
          error = new Error(`Error processing text stream: ${err}`);
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        }
      };

      // Start processing text stream in background
      processTextStream();

      // Yield audio chunks as they become available
      while (true) {
        if (audioQueue.length > 0) {
          const chunk = audioQueue.shift()!;
          yield chunk;
        } else if (isComplete) {
          break;
        } else if (hasError) {
          throw error;
        } else {
          const result = await new Promise<IteratorResult<WSReceivedMessageAudio, undefined>>((resolve) => {
            resolveNextChunk = resolve;
          });

          if (!result.done && result.value) {
            yield result.value;
          }
        }
      }
    } finally {
      // Clean up WebSocket connection
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
  }

  private async *synthesizeIncrementalNode(
    textStream: AsyncIterable<string>,
    params: { voiceId: string } & ElevenLabs.TextToSpeechRequest,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<WSReceivedMessageAudio> {
    // Import ws library for Node.js environment
    let WebSocketNode: any;
    try {
      const { WebSocket } = await import('ws');
      WebSocketNode = WebSocket;
    } catch (error) {
      throw new Error('ws库未安装。请在Node.js环境中运行: npm install ws');
    }

    const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${params.voiceId}/stream-input`;

    // Create WebSocket with authorization header for Node.js
    const ws = new WebSocketNode(wsUrl, {
      headers: {
        'xi-api-key': this.apiKey,
      },
      handshakeTimeout: options?.timeout ? options.timeout / 1000 : undefined,
    });

    const audioQueue: WSReceivedMessageAudio[] = [];
    let resolveNextChunk: ((value: IteratorResult<WSReceivedMessageAudio, undefined>) => void) | null = null;
    let isComplete = false;
    let hasError = false;
    let error: Error | null = null;

    // Promise for connection established
    let resolveConnected: () => void;
    let rejectConnected: (reason?: any) => void;
    const wsConnected = new Promise<void>((resolve, reject) => {
      resolveConnected = resolve;
      rejectConnected = reject;
    });

    const initMessage: WSMessageInit = {
      text: ' ',
      voiceSettings: params.voiceSettings,
      // No need for xi-api-key in Node.js as we use Authorization header
    };

    const finishMessage: WSMessageClose = {
      text: '',
    };

    // Setup WebSocket event handlers
    ws.on('open', () => {
      ws.send(JSON.stringify(initMessage));
      resolveConnected();
    });

    ws.on('message', (data: Buffer | string) => {
      try {
        const messageStr = data.toString();
        const message = JSON.parse(messageStr) as WSReceivedMessageAudio;

        audioQueue.push(message);
        if (resolveNextChunk) {
          const resolve = resolveNextChunk;
          resolveNextChunk = null;
          const chunk = audioQueue.shift();
          if (chunk) {
            resolve({ value: chunk, done: false });
          }
        }

        if (message.isFinal) {
          isComplete = true;
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        }
      } catch (err) {
        hasError = true;
        error = new Error(`Failed to parse WebSocket message: ${err}`);
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      isComplete = true;
      if (resolveNextChunk) {
        const resolve = resolveNextChunk;
        resolveNextChunk = null;
        resolve({ value: undefined, done: true });
      }
    });

    ws.on('error', (err: Error) => {
      hasError = true;
      error = new Error(`WebSocket error: ${err.message}`);
      rejectConnected(error);
      if (resolveNextChunk) {
        const resolve = resolveNextChunk;
        resolveNextChunk = null;
        resolve({ value: undefined, done: true });
      }
    });

    try {
      // Wait for WebSocket to be ready
      await wsConnected;

      // Start processing text stream
      const processTextStream = async () => {
        try {
          let firstText = true;
          let pendingText = '';
          for await (const text of textStream) {
            if (text && text.trim().length > 0) {
              pendingText += text;

              // Check if we have a complete sentence or significant chunk
              if (pendingText.match(/[.!?。！？]\s*$/) || pendingText.length > 50) {
                // Send accumulated text chunk for synthesis
                const continueMessage = {
                  text: pendingText,
                  tryTriggerGeneration: firstText,
                };
                ws.send(JSON.stringify(continueMessage));
                pendingText = '';
              }
            }
          }

          // Send finish message to indicate end of text stream
          ws.send(JSON.stringify(finishMessage));
        } catch (err) {
          error = new Error(`Error processing text stream: ${err}`);
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        }
      };

      // Start processing text stream in background
      processTextStream();

      // Yield audio chunks as they become available
      while (true) {
        if (audioQueue.length > 0) {
          const chunk = audioQueue.shift()!;
          yield chunk;
        } else if (isComplete) {
          break;
        } else if (hasError) {
          throw error;
        } else {
          const result = await new Promise<IteratorResult<WSReceivedMessageAudio, undefined>>((resolve) => {
            resolveNextChunk = resolve;
          });

          if (!result.done && result.value) {
            yield result.value;
          }
        }
      }
    } finally {
      // Clean up WebSocket connection
      if (ws.readyState === WebSocketNode.OPEN) {
        ws.close();
      }
    }
  }
}
