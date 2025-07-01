import type { UnifiedTTSAudioChunk, UnifiedTTSAudio } from '../../types/unified';
import type { TencentTTSChunk, TencentTTSResponse } from '../../clients/tencent/tencentTypes';
import { BaseResponseAdapter } from '../base/responseAdapter';

export class TencentResponseAdapter extends BaseResponseAdapter<TencentTTSResponse, UnifiedTTSAudio> {
  transform(response: TencentTTSResponse): UnifiedTTSAudio {
    const result: UnifiedTTSAudio = {
      id: response.session_id || response.request_id,
      data: response.audio_data || '',
      final: response.final === 1,
      object: 'tts.audio',
      metadata: {
        message: response.message,
        code: response.code,
        session_id: response.session_id,
        request_id: response.request_id,
        message_id: response.message_id,
        blob: response.audio_blob, // 保留原始blob以备需要
        subtitles: response.result?.subtitles,
      },
      originalResponse: response,
    };

    return result;
  }
}

export class TencentChunkAdapter extends BaseResponseAdapter<TencentTTSChunk, UnifiedTTSAudioChunk> {
  /**
   * 将Blob转换为base64字符串（同步版本，用于chunk处理）
   */
  private blobToBase64Sync(blob: Blob): string {
    // 对于chunk数据，我们先返回标识符，实际转换在需要时进行
    return '[Blob data - use metadata.blob for actual data]';
  }

  transform(response: TencentTTSChunk): UnifiedTTSAudioChunk {
    let audioData = '';

    // 处理 Blob 音频数据
    if (response.audio_data instanceof Blob) {
      // 对于 Blob，我们在 metadata 中保留原始 Blob，用户可以根据需要自行转换
      audioData = this.blobToBase64Sync(response.audio_data);
    } else if (typeof response.audio_data === 'string') {
      audioData = response.audio_data;
    }

    const result: UnifiedTTSAudioChunk = {
      id: response.session_id || response.request_id,
      data: audioData,
      final: response.final === 1,
      object: 'tts.audio.chunk',
      metadata: {
        message: response.message,
        code: response.code,
        session_id: response.session_id,
        request_id: response.request_id,
        message_id: response.message_id,
        blob: response.audio_data instanceof Blob ? response.audio_data : undefined,
        subtitles: response.result?.subtitles,
      },
      originalResponse: response,
    };

    return result;
  }
}
