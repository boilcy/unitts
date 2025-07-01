import { TencentProviderAdapter } from '../src/adapters/tencent';
import type { TencentAuth } from '../src/clients/tencent/tencentTypes';
import type { UnifiedTTSParams } from '../src/types/unified';
import { blobToBase64, mergeAudioBlobs } from '../src/helpers/audio';

// 腾讯云认证信息（请替换为您的实际配置）
const tencentAuth: TencentAuth = {
  app_id: 'your_app_id',
  secret_id: 'your_secret_id',
  secret_key: 'your_secret_key',
};

async function basicTencentTTSExample() {
  console.log('=== 基础腾讯云 TTS 示例 ===');

  const adapter = new TencentProviderAdapter(tencentAuth);

  const params: UnifiedTTSParams<'tencent'> = {
    text: '你好，这是腾讯云语音合成的测试。',
    voice: '101001', // 智瑜，情感女声
    volume: 0,
    rate: 0,
    format: 'mp3',
    sampleRate: 16000,
  };

  try {
    console.log('发送TTS请求...');
    const result = await adapter.synthesize(params);
    console.log('合成成功！');
    console.log('音频ID:', result.id);
    console.log('是否完成:', result.final);
    console.log('音频数据大小:', result.data.length, 'characters (base64)');
    console.log('元数据:', result.metadata);
  } catch (error) {
    console.error('TTS 合成失败:', error);
  }
}

async function streamingTencentTTSExample() {
  console.log('\n=== 流式腾讯云 TTS 示例 ===');

  const adapter = new TencentProviderAdapter(tencentAuth);

  const params: UnifiedTTSParams<'tencent'> = {
    text: '这是一个流式语音合成的示例，文本将被分段合成并实时返回音频数据。',
    voice: '101002', // 智聆，通用女声
    volume: 2,
    rate: -1,
    format: 'pcm',
    sampleRate: 16000,
    extra: {
      EnableSubtitle: true, // 启用字幕
    },
  };

  try {
    console.log('开始流式TTS合成...');
    const audioChunks: Blob[] = [];

    for await (const chunk of adapter.synthesizeStream(params)) {
      console.log('收到音频块:', {
        id: chunk.id,
        final: chunk.final,
        hasAudioData: !!chunk.metadata?.['blob'],
        hasSubtitles: !!chunk.metadata?.['subtitles'],
      });

      // 收集音频数据
      if (chunk.metadata?.['blob']) {
        audioChunks.push(chunk.metadata['blob']);
      }

      // 显示字幕信息
      if (chunk.metadata?.['subtitles']) {
        console.log('字幕信息:', chunk.metadata['subtitles']);
      }

      if (chunk.final) {
        console.log('流式合成完成！');
        break;
      }
    }

    // 合并所有音频块
    if (audioChunks.length > 0) {
      const fullAudio = mergeAudioBlobs(audioChunks, 'audio/pcm');
      console.log('总音频大小:', fullAudio.size, 'bytes');

      // 转换为base64以便存储或传输
      const fullAudioBase64 = await blobToBase64(fullAudio);
      console.log('总音频base64大小:', fullAudioBase64.length, 'characters');
    }
  } catch (error) {
    console.error('流式TTS合成失败:', error);
  }
}

async function incrementalTencentTTSExample() {
  console.log('\n=== 增量腾讯云 TTS 示例 ===');

  const adapter = new TencentProviderAdapter(tencentAuth);

  // 模拟文本流
  async function* generateTextStream() {
    const textChunks = ['欢迎使用', '腾讯云', '语音合成服务。', '这是一个', '增量合成', '的示例。'];

    for (const chunk of textChunks) {
      console.log('发送文本块:', chunk);
      yield chunk;
      // 模拟延迟
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  const params: UnifiedTTSParams<'tencent'> = {
    text: '', // 增量模式下不需要设置text
    voice: '101003', // 智美，客服女声
    volume: 1,
    rate: 1,
    format: 'pcm',
    sampleRate: 16000,
    extra: {
      EnableSubtitle: false,
    },
  };

  try {
    console.log('开始增量TTS合成...');
    const audioChunks: Blob[] = [];

    for await (const chunk of adapter.synthesizeIncremental(generateTextStream(), params)) {
      console.log('收到增量音频块:', {
        id: chunk.id,
        final: chunk.final,
        hasAudioData: !!chunk.metadata?.['blob'],
      });

      // 收集音频数据
      if (chunk.metadata?.['blob']) {
        audioChunks.push(chunk.metadata['blob']);
      }

      if (chunk.final) {
        console.log('增量合成完成！');
        break;
      }
    }

    // 合并所有音频块
    if (audioChunks.length > 0) {
      const fullAudio = mergeAudioBlobs(audioChunks, 'audio/pcm');
      console.log('总音频大小:', fullAudio.size, 'bytes');

      // 转换为base64以便存储或传输
      const fullAudioBase64 = await blobToBase64(fullAudio);
      console.log('总音频base64大小:', fullAudioBase64.length, 'characters');
    }
  } catch (error) {
    console.error('增量TTS合成失败:', error);
  }
}

async function voiceAndEmotionExample() {
  console.log('\n=== 不同语音和情感示例 ===');

  const adapter = new TencentProviderAdapter(tencentAuth);

  const examples = [
    {
      name: '智瑜-情感女声',
      params: {
        text: '今天天气真好！',
        voice: '101001',
        extra: { EmotionCategory: 'happy' as const, EmotionIntensity: 150 },
      },
    },
    {
      name: '智云-通用男声',
      params: {
        text: '欢迎收听新闻播报。',
        voice: '101004',
        extra: { EmotionCategory: 'news' as const },
      },
    },
    {
      name: '智燕-新闻女声',
      params: {
        text: '这是一则重要新闻。',
        voice: '101011',
        extra: { EmotionCategory: 'news' as const, Speed: -2 },
      },
    },
  ];

  for (const example of examples) {
    try {
      console.log(`\n测试 ${example.name}...`);
      const result = await adapter.synthesize({
        format: 'mp3',
        sampleRate: 16000,
        ...example.params,
      } as UnifiedTTSParams<'tencent'>);

      console.log('合成成功，音频ID:', result.id);
    } catch (error) {
      console.error(`${example.name} 合成失败:`, error);
    }
  }
}

// 运行所有示例
async function runAllExamples() {
  console.log('腾讯云 TTS 集成示例');
  console.log('注意：请确保设置了正确的腾讯云认证信息');

  try {
    await basicTencentTTSExample();
    await streamingTencentTTSExample();
    await incrementalTencentTTSExample();
    await voiceAndEmotionExample();
  } catch (error) {
    console.error('示例运行失败:', error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples();
}

export {
  basicTencentTTSExample,
  streamingTencentTTSExample,
  incrementalTencentTTSExample,
  voiceAndEmotionExample,
};
