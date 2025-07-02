import type { UnifiedTTSAudioChunk, UnifiedTTSAudio } from '../../types/unified';
import type { ElevenLabs } from '@elevenlabs/elevenlabs-js';
import { BaseResponseAdapter } from '../base/responseAdapter';
import { generateId } from '../../core/idGenerator';
import { uint8ArrayToBase64 } from '../../helpers/audio';
import type { WSReceivedMessageAudio } from '../../clients/elevenlabs/elevenlabsTypes';

export class ElevenLabsResponseAdapter extends BaseResponseAdapter<
  ElevenLabs.AudioWithTimestampsResponse,
  UnifiedTTSAudio
> {
  transform(response: ElevenLabs.AudioWithTimestampsResponse): UnifiedTTSAudio {
    const result: UnifiedTTSAudio = {
      id: generateId(),
      data: response.audioBase64 || '',
      final: true, // 非流式响应总是最终的
      object: 'tts.audio',
      metadata: {
        alignment: response.alignment,
        normalizedAlignment: response.normalizedAlignment,
      },
      originalResponse: response,
    };

    return result;
  }
}

export class ElevenLabsStreamResponseAdapter extends BaseResponseAdapter<
  Uint8Array<ArrayBufferLike>,
  UnifiedTTSAudio
> {
  transform(response: Uint8Array<ArrayBufferLike>): UnifiedTTSAudio {
    const base64Data = uint8ArrayToBase64(response);

    const result: UnifiedTTSAudio = {
      id: generateId(),
      data: base64Data,
      final: true,
      object: 'tts.audio',
      metadata: {
        // 不带 timestamps 的响应没有对齐信息
      },
      originalResponse: response,
    };

    return result;
  }
}

// 带 timestamps 的流式响应适配器
export class ElevenLabsChunkAdapter extends BaseResponseAdapter<
  ElevenLabs.StreamingAudioChunkWithTimestampsResponse,
  UnifiedTTSAudioChunk
> {
  transform(response: ElevenLabs.StreamingAudioChunkWithTimestampsResponse): UnifiedTTSAudioChunk {
    const result: UnifiedTTSAudioChunk = {
      id: generateId(),
      data: response.audioBase64 || '',
      final: false,
      object: 'tts.audio.chunk',
      metadata: {
        alignment: response.alignment,
        normalizedAlignment: response.normalizedAlignment,
      },
      originalResponse: response,
    };

    return result;
  }
}

// 不带 timestamps 的流式响应适配器（处理 Uint8Array）
export class ElevenLabsRawChunkAdapter extends BaseResponseAdapter<Uint8Array, UnifiedTTSAudioChunk> {
  transform(response: Uint8Array): UnifiedTTSAudioChunk {
    // 转换为 base64 (兼容 Node.js 和浏览器)
    const base64Data =
      typeof btoa !== 'undefined' ?
        btoa(String.fromCharCode(...response))
      : Buffer.from(response).toString('base64');

    const result: UnifiedTTSAudioChunk = {
      id: generateId(),
      data: base64Data,
      final: false, // 原始块通常不是最终的，需要外部确定
      object: 'tts.audio.chunk',
      metadata: {
        // 不带 timestamps 的响应没有对齐信息
      },
      originalResponse: response,
    };

    return result;
  }
}

export class ElevenLabsWSChunkAdapter extends BaseResponseAdapter<
  WSReceivedMessageAudio,
  UnifiedTTSAudioChunk
> {
  transform(response: WSReceivedMessageAudio): UnifiedTTSAudioChunk {
    const result: UnifiedTTSAudioChunk = {
      id: generateId(),
      data: response.audio,
      final: response.isFinal,
      object: 'tts.audio.chunk',
      metadata: {
        alignment: response.alignment,
        normalizedAlignment: response.normalizedAlignment,
      },
      originalResponse: response,
    };

    return result;
  }
}

// 统一的响应适配器，根据响应类型自动选择合适的适配器
export class ElevenLabsUnifiedResponseAdapter {
  private timestampAdapter = new ElevenLabsResponseAdapter();
  private streamAdapter = new ElevenLabsStreamResponseAdapter();
  private chunkAdapter = new ElevenLabsChunkAdapter();
  private rawChunkAdapter = new ElevenLabsRawChunkAdapter();
  private wsChunkAdapter = new ElevenLabsWSChunkAdapter();

  async transformSynthesizeResponse(
    response: ElevenLabs.AudioWithTimestampsResponse | Uint8Array<ArrayBufferLike>,
  ): Promise<UnifiedTTSAudio> {
    if ('audioBase64' in response) {
      // 带 timestamps 的响应
      return this.timestampAdapter.transform(response);
    } else {
      // 不带 timestamps 的流响应
      return this.streamAdapter.transform(response);
    }
  }

  transformStreamChunk(
    chunk: ElevenLabs.StreamingAudioChunkWithTimestampsResponse | Uint8Array | WSReceivedMessageAudio,
  ): UnifiedTTSAudioChunk {
    if (chunk instanceof Uint8Array) {
      // 原始音频数据
      return this.rawChunkAdapter.transform(chunk);
    } else if (this.isWSReceivedMessageAudio(chunk)) {
      // WebSocket 响应
      return this.wsChunkAdapter.transform(chunk);
    } else {
      // 带 timestamps 的响应
      return this.chunkAdapter.transform(chunk);
    }
  }

  private isWSReceivedMessageAudio(chunk: any): chunk is WSReceivedMessageAudio {
    return (
      typeof chunk === 'object' &&
      chunk !== null &&
      typeof chunk.audio === 'string' &&
      typeof chunk.isFinal === 'boolean'
    );
  }
}
