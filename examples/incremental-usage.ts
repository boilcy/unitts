import { TTSRelay } from '../src/ttsRelay';
import { MinimaxProviderAdapter } from '../src/adapters/minimax/providerAdapter';

// 模拟文本流生成器
async function* createTextStream(texts: string[]): AsyncGenerator<string> {
  for (const text of texts) {
    console.log(`发送文本片段: "${text}"`);
    yield text;
    // 模拟延迟
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function incrementalUsageExample() {
  // 创建TTS中继实例
  const ttsRelay = new TTSRelay();

  // 注册Minimax适配器
  const minimaxAdapter = new MinimaxProviderAdapter('your-api-key', 'your-group-id');
  ttsRelay.registerAdapter('minimax', minimaxAdapter);

  try {
    console.log('开始增量TTS合成...');

    // 创建文本流
    const textChunks = ['今天天气真不错，', '阳光明媚，', '微风轻拂，', '是出门游玩的好日子。'];
    const textStream = createTextStream(textChunks);

    // 增量文本合成
    const audioStream = ttsRelay.synthesizeIncremental('minimax', textStream, {
      voice: 'female-yujie',
      model: 'speech-02-hd',
      format: 'wav',
    });

    let chunkCount = 0;
    for await (const chunk of audioStream) {
      chunkCount++;
      console.log(`接收到增量音频片段 ${chunkCount}:`, {
        id: chunk.id,
        dataLength: chunk.data.length,
        final: chunk.final,
      });

      if (chunk.final) {
        console.log('增量合成完成!');
        break;
      }
    }
  } catch (error) {
    console.error('增量TTS合成失败:', error);
  }
}

// 运行示例
if (require.main === module) {
  incrementalUsageExample();
}
