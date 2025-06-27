import { TTSRelay } from '../src/ttsRelay';
import { MinimaxProviderAdapter } from '../src/adapters/minimax/providerAdapter';

async function providerSpecificParamsExample() {
  // 创建TTS中继实例
  const ttsRelay = new TTSRelay();

  // 注册Minimax适配器
  const minimaxAdapter = new MinimaxProviderAdapter('your-api-key', 'your-group-id');
  ttsRelay.registerAdapter('minimax', minimaxAdapter);

  try {
    console.log('演示Provider特定参数的使用...\n');

    // 示例1: 使用基础统一参数
    console.log('1. 使用基础统一参数:');
    const basicResult = await ttsRelay.synthesize('minimax', {
      text: '这是使用基础参数的合成示例。',
      voice: 'female-tianmei',
      model: 'speech-02-hd',
      format: 'mp3',
    });
    console.log('基础参数合成成功，音频ID:', basicResult.id);

    // 示例2: 使用Minimax特定的extra参数
    console.log('\n2. 使用Minimax特定参数:');
    const minimaxSpecificResult = await ttsRelay.synthesize('minimax', {
      text: '这是使用Minimax特定参数的合成示例，包含音色权重和语言增强。',
      voice: 'female-tianmei',
      model: 'speech-02-hd',
      format: 'mp3',
      extra: {
        // Minimax特有的音色权重功能
        timber_weights: [
          { voice_id: 'female-tianmei', weight: 0.7 },
          { voice_id: 'female-yujie', weight: 0.3 },
        ],
        // 语言增强
        language_boost: 'Chinese',
        // 字幕功能
        subtitle_enable: true,
        // 输出格式
        output_format: 'hex',
        // 发音字典
        pronunciation_dict: {
          tone: ['轻声', '一声', '二声', '三声', '四声'],
        },
        // voice_setting 的特定参数
        voice_setting: {
          latex_read: true,
          english_normalization: true,
        },
        // audio_setting 的特定参数
        audio_setting: {
          bit_rate: 128000,
          channel: 2,
        },
      },
    });
    console.log('Minimax特定参数合成成功，音频ID:', minimaxSpecificResult.id);

    // 示例3: extra参数覆盖基础参数
    console.log('\n3. extra参数覆盖基础参数:');
    const overrideResult = await ttsRelay.synthesize('minimax', {
      text: '这个示例演示extra参数如何覆盖基础参数。',
      voice: 'female-tianmei', // 基础参数
      model: 'speech-02-hd',
      rate: 1.0, // 基础参数
      extra: {
        // 覆盖基础voice参数
        voice_setting: {
          voice_id: 'male-qn-qingse', // 这会覆盖上面的voice参数
          speed: 1.5, // 这会覆盖上面的rate参数
          emotion: 'happy',
        },
      },
    });
    console.log('参数覆盖合成成功，音频ID:', overrideResult.id);
  } catch (error) {
    console.error('Provider特定参数示例失败:', error);
  }
}

// 演示如何为不同provider构建特定参数的辅助函数
export function createMinimaxParams(
  text: string,
  baseParams: Partial<Omit<any, 'text' | 'extra'>> = {},
  minimaxSpecific: {
    timberWeights?: Array<{ voice_id: string; weight: number }>;
    languageBoost?: string;
    subtitleEnable?: boolean;
    outputFormat?: 'hex' | 'url';
    pronunciationDict?: { tone: string[] };
    voiceSettings?: Record<string, any>;
    audioSettings?: Record<string, any>;
  } = {},
) {
  return {
    text,
    ...baseParams,
    extra: {
      ...(minimaxSpecific.timberWeights && { timber_weights: minimaxSpecific.timberWeights }),
      ...(minimaxSpecific.languageBoost && { language_boost: minimaxSpecific.languageBoost }),
      ...(minimaxSpecific.subtitleEnable !== undefined && {
        subtitle_enable: minimaxSpecific.subtitleEnable,
      }),
      ...(minimaxSpecific.outputFormat && { output_format: minimaxSpecific.outputFormat }),
      ...(minimaxSpecific.pronunciationDict && { pronunciation_dict: minimaxSpecific.pronunciationDict }),
      ...(minimaxSpecific.voiceSettings && { voice_setting: minimaxSpecific.voiceSettings }),
      ...(minimaxSpecific.audioSettings && { audio_setting: minimaxSpecific.audioSettings }),
    },
  };
}

// 使用辅助函数的示例
async function helperFunctionExample() {
  const ttsRelay = new TTSRelay();
  const minimaxAdapter = new MinimaxProviderAdapter('your-api-key', 'your-group-id');
  ttsRelay.registerAdapter('minimax', minimaxAdapter);

  console.log('\n4. 使用辅助函数构建参数:');

  const params = createMinimaxParams(
    '使用辅助函数构建的Minimax特定参数示例。',
    {
      voice: 'female-tianmei',
      model: 'speech-02-hd',
      format: 'wav',
    },
    {
      timberWeights: [
        { voice_id: 'female-tianmei', weight: 0.8 },
        { voice_id: 'female-yujie', weight: 0.2 },
      ],
      languageBoost: 'Chinese',
      subtitleEnable: true,
      voiceSettings: {
        latex_read: true,
        english_normalization: true,
      },
      audioSettings: {
        bit_rate: 256000,
        channel: 1,
      },
    },
  );

  try {
    const result = await ttsRelay.synthesize('minimax', params);
    console.log('辅助函数参数合成成功，音频ID:', result.id);
  } catch (error) {
    console.error('辅助函数示例失败:', error);
  }
}

// 运行示例
if (require.main === module) {
  providerSpecificParamsExample().then(() => {
    return helperFunctionExample();
  });
}
