import { BaseParameterAdapter } from '../base/parameterAdapter';
import type { UnifiedTTSParams } from '../../types/unified';
import type { ElevenLabs } from '@elevenlabs/elevenlabs-js';
import type { TextToSpeechRequestExtended } from '../../clients/elevenlabs/elevenlabsTypes';

export class ElevenLabsParameterAdapter extends BaseParameterAdapter<
  UnifiedTTSParams<'elevenlabs'>,
  TextToSpeechRequestExtended
> {
  transform(params: UnifiedTTSParams<'elevenlabs'>): TextToSpeechRequestExtended {
    // 基础参数映射
    const baseParams: Partial<TextToSpeechRequestExtended> = {
      text: params.text,
      voiceId: params.voice || '',
    };

    // 处理模型参数
    if (params.model) {
      baseParams.modelId = params.model;
    }

    // 处理语音设置
    const voiceSettings: Partial<ElevenLabs.VoiceSettings> = {};

    if (params.rate !== undefined) {
      // ElevenLabs 的 speed 范围通常是 0.25-4.0
      voiceSettings.speed = Math.max(0.25, Math.min(4.0, params.rate));
    }

    // 处理情感参数（如果支持）
    if (params.emotion !== undefined) {
      // ElevenLabs 通过 voice settings 的 emotion 参数控制情感
      (voiceSettings as any).emotion = params.emotion;
    }

    if (Object.keys(voiceSettings).length > 0) {
      baseParams.voiceSettings = voiceSettings as ElevenLabs.VoiceSettings;
    }

    // 处理音频格式
    if (params.format) {
      // 映射统一格式到 ElevenLabs 支持的格式
      const formatMapping: Record<string, ElevenLabs.TextToSpeechStreamRequestOutputFormat> = {
        mp3: 'mp3_44100_128',
        pcm: 'pcm_16000',
        opus: 'opus_48000_32',
        // ElevenLabs 还支持其他格式
      };

      if (formatMapping[params.format]) {
        baseParams.outputFormat = formatMapping[params.format];
      }
    }

    // 处理采样率（如果格式支持）
    if (params.sampleRate && params.format) {
      const sampleRateMapping: Record<
        string,
        Record<number, ElevenLabs.TextToSpeechStreamRequestOutputFormat>
      > = {
        mp3: {
          22050: 'mp3_22050_32',
          44100: 'mp3_44100_64',
        },
        pcm: {
          16000: 'pcm_16000',
          22050: 'pcm_22050',
          24000: 'pcm_24000',
          44100: 'pcm_44100',
        },
        opus: {
          48000: 'opus_48000_32',
        },
      };

      const formatSampleRates = sampleRateMapping[params.format];
      if (formatSampleRates && formatSampleRates[params.sampleRate]) {
        baseParams.outputFormat = formatSampleRates[params.sampleRate];
      }
    }

    // 处理时间戳参数
    if (params.withTimestamps !== undefined) {
      // ElevenLabs 通过不同的 API 端点支持时间戳
      // 这个信息会在适配器中使用，决定调用哪个方法
      (baseParams as any).withTimestamps = params.withTimestamps;
    }

    // 合并额外参数
    const extraParams = params.extra || {};

    // 合并参数，extra参数优先级更高
    const mergedParams = this.mergeParams(baseParams, extraParams);

    return this.removeUndefinedFields(mergedParams as TextToSpeechRequestExtended);
  }

  private mergeParams(
    baseParams: Partial<TextToSpeechRequestExtended>,
    extraParams: Record<string, any>,
  ): Partial<TextToSpeechRequestExtended> {
    const merged = { ...baseParams };

    // 处理顶级参数
    for (const [key, value] of Object.entries(extraParams)) {
      if (key === 'voiceSettings' && merged.voiceSettings && typeof value === 'object') {
        // 特殊处理voiceSettings，进行深度合并
        merged.voiceSettings = {
          ...merged.voiceSettings,
          ...value,
        };
      } else {
        (merged as any)[key] = value;
      }
    }

    return merged;
  }
}
