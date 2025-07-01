import { BaseParameterAdapter } from '../base/parameterAdapter';
import type { UnifiedTTSParams } from '../../types/unified';
import type { TencentTTSParams } from '../../clients/tencent/tencentTypes';

export class TencentParameterAdapter extends BaseParameterAdapter<
  UnifiedTTSParams<'tencent'>,
  TencentTTSParams
> {
  transform(params: UnifiedTTSParams<'tencent'>): TencentTTSParams {
    // 基础参数映射
    const baseParams: Partial<TencentTTSParams> = {
      Action: 'TextToVoice', // 默认action，会在具体方法中覆盖
      Version: '2019-08-23',
      Text: params.text,
    };

    // 处理语音类型
    if (params.voice !== undefined) {
      // 如果是数字字符串，转换为数字
      if (typeof params.voice === 'string' && /^\d+$/.test(params.voice)) {
        baseParams.VoiceType = parseInt(params.voice, 10);
      } else if (typeof params.voice === 'number') {
        baseParams.VoiceType = params.voice;
      } else {
        // 默认使用智瑜，情感女声
        baseParams.VoiceType = 101001;
      }
    } else {
      baseParams.VoiceType = 101001; // 默认智瑜，情感女声
    }

    // 处理音量
    if (params.volume !== undefined) {
      // 腾讯云音量范围：-10 到 10
      baseParams.Volume = Math.max(-10, Math.min(10, params.volume));
    }

    // 处理语速
    if (params.rate !== undefined) {
      // 腾讯云语速范围：-10 到 10
      baseParams.Speed = Math.max(-10, Math.min(10, params.rate));
    }

    // 处理音频格式
    if (params.format !== undefined) {
      // 只允许腾讯云支持的格式
      const supportedFormats: Array<TencentTTSParams['Codec']> = ['mp3', 'pcm', 'opus'];
      if (supportedFormats.includes(params.format as any)) {
        baseParams.Codec = params.format as TencentTTSParams['Codec'];
      }
    }

    // 处理采样率
    if (params.sampleRate !== undefined) {
      // 只允许腾讯云支持的采样率
      const supportedSampleRates: Array<TencentTTSParams['SampleRate']> = [8000, 16000, 24000];
      if (supportedSampleRates.includes(params.sampleRate as any)) {
        baseParams.SampleRate = params.sampleRate as TencentTTSParams['SampleRate'];
      }
    }

    // 处理情感类别和强度
    if (params.emotion !== undefined) {
      // 映射情感参数
      const emotionMap: Record<string, TencentTTSParams['EmotionCategory']> = {
        neutral: 'neutral',
        sad: 'sad',
        happy: 'happy',
        angry: 'angry',
        fear: 'fear',
        news: 'news',
        story: 'story',
        radio: 'radio',
        poetry: 'poetry',
        call: 'call',
      };

      if (emotionMap[params.emotion]) {
        baseParams.EmotionCategory = emotionMap[params.emotion];
      }
    }

    // 合并额外参数
    const extraParams = params.extra || {};

    // 合并参数，extra参数优先级更高
    const mergedParams = this.mergeParams(baseParams, extraParams);

    return this.removeUndefinedFields(mergedParams as TencentTTSParams);
  }

  /**
   * 合并基础参数和额外参数
   * 额外参数会覆盖基础参数中的同名字段
   */
  private mergeParams(
    baseParams: Partial<TencentTTSParams>,
    extraParams: Record<string, any>,
  ): Partial<TencentTTSParams> {
    const merged = { ...baseParams };

    // 处理顶级参数
    for (const [key, value] of Object.entries(extraParams)) {
      // 直接覆盖参数
      (merged as any)[key] = value;
    }

    return merged;
  }
}
