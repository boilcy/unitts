import type { UnifiedTTSAudioChunk, UnifiedTTSAudio } from '../../types/unified';
import type { MinimaxTTSChunk, MinimaxTTSResponse } from '../../clients/minimax/minimaxTypes';
import { BaseResponseAdapter } from '../base/responseAdapter';

export class MinimaxResponseAdapter extends BaseResponseAdapter<MinimaxTTSResponse, UnifiedTTSAudio> {
  transform(response: MinimaxTTSResponse): UnifiedTTSAudio {
    const result: UnifiedTTSAudio = {
      id: response.trace_id,
      data: response.data?.audio ?? '',
      final: response.data?.status === 2,
      object: 'tts.audio',
    };

    return result;
  }
}

export class MinimaxChunkAdapter extends BaseResponseAdapter<MinimaxTTSChunk, UnifiedTTSAudioChunk> {
  transform(response: MinimaxTTSChunk): UnifiedTTSAudioChunk {
    const result: UnifiedTTSAudioChunk = {
      id: response.trace_id,
      data: response.data?.audio ?? '',
      final: response.data?.status === 2,
      object: 'tts.audio.chunk',
    };

    return result;
  }
}
