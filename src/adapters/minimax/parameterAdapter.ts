import { BaseParameterAdapter } from '../base/parameterAdapter';
import type { UnifiedTTSParams } from '../../types/unified';
import type { MinimaxTTSParams, MinimaxVoiceId } from '../../clients/minimax/minimaxTypes';

export class MinimaxParameterAdapter extends BaseParameterAdapter<
  UnifiedTTSParams<'minimax'>,
  MinimaxTTSParams
> {
  transform(params: UnifiedTTSParams<'minimax'>): MinimaxTTSParams {
    // 基础参数映射
    const baseParams: Partial<MinimaxTTSParams> = {
      text: params.text,
      model: (params.model as MinimaxTTSParams['model']) || 'speech-02-hd',
    };

    // 处理 voice_setting
    const voiceSettings: NonNullable<MinimaxTTSParams['voice_setting']> = {};
    if (params.voice !== undefined) {
      voiceSettings.voice_id = params.voice as MinimaxVoiceId;
    }
    if (params.rate !== undefined) {
      voiceSettings.speed = params.rate;
    }
    if (params.volume !== undefined) {
      voiceSettings.vol = params.volume;
    }
    if (params.pitch !== undefined) {
      voiceSettings.pitch = params.pitch;
    }
    if (params.emotion !== undefined) {
      voiceSettings.emotion = params.emotion as NonNullable<MinimaxTTSParams['voice_setting']>['emotion'];
    }
    if (Object.keys(voiceSettings).length > 0) {
      baseParams.voice_setting = voiceSettings;
    }

    // 处理 audio_setting
    const audioSettings: NonNullable<MinimaxTTSParams['audio_setting']> = {};
    if (params.format !== undefined) {
      // 只允许 Minimax 支持的格式
      const supportedFormats: Array<NonNullable<MinimaxTTSParams['audio_setting']>['format']> = [
        'mp3',
        'wav',
        'pcm',
        'flac',
      ];
      if (supportedFormats.includes(params.format as any)) {
        audioSettings.format = params.format as NonNullable<MinimaxTTSParams['audio_setting']>['format'];
      }
    }
    if (params.sampleRate !== undefined) {
      // 只允许 Minimax 支持的采样率
      const supportedSampleRates: Array<NonNullable<MinimaxTTSParams['audio_setting']>['sample_rate']> = [
        8000, 16000, 22050, 24000, 32000, 44100,
      ];
      if (supportedSampleRates.includes(params.sampleRate as any)) {
        audioSettings.sample_rate = params.sampleRate as NonNullable<
          MinimaxTTSParams['audio_setting']
        >['sample_rate'];
      }
    }
    if (Object.keys(audioSettings).length > 0) {
      baseParams.audio_setting = audioSettings;
    }

    // 处理流式参数
    if (params.stream !== undefined) {
      baseParams.stream = params.stream;
    }

    // 合并额外参数
    const extraParams = params.extra || {};

    // 合并参数，extra参数优先级更高
    const mergedParams = this.mergeParams(baseParams, extraParams);

    return this.removeUndefinedFields(mergedParams as MinimaxTTSParams);
  }

  /**
   * 合并基础参数和额外参数
   * 额外参数会覆盖基础参数中的同名字段
   */
  private mergeParams(
    baseParams: Partial<MinimaxTTSParams>,
    extraParams: Record<string, any>,
  ): Partial<MinimaxTTSParams> {
    const merged = { ...baseParams };

    // 处理顶级参数
    for (const [key, value] of Object.entries(extraParams)) {
      if (key === 'voice_setting' && merged.voice_setting && typeof value === 'object') {
        // 特殊处理voice_setting，进行深度合并
        merged.voice_setting = {
          ...merged.voice_setting,
          ...value,
        };
      } else if (key === 'audio_setting' && merged.audio_setting && typeof value === 'object') {
        // 特殊处理audio_setting，进行深度合并
        merged.audio_setting = {
          ...merged.audio_setting,
          ...value,
        };
      } else {
        // 其他参数直接覆盖
        (merged as any)[key] = value;
      }
    }

    return merged;
  }
}
