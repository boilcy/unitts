import { TTSRelay } from '../src/ttsRelay';
import { MinimaxProviderAdapter } from '../src/adapters/minimax/providerAdapter';

async function streamingUsageExample() {
  // 创建TTS中继实例
  const ttsRelay = new TTSRelay();

  // 注册Minimax适配器
  const minimaxAdapter = new MinimaxProviderAdapter('your-api-key', 'your-group-id');
  ttsRelay.registerAdapter('minimax', minimaxAdapter);

  try {
    console.log('开始流式TTS合成...');

    // 流式文本合成
    const stream = ttsRelay.synthesizeStream('minimax', {
      text: '这是一个流式TTS合成的示例。我们将文本转换为音频，并通过流的方式实时接收音频片段。',
      voice: 'male-qn-qingse',
      model: 'speech-02-hd',
      format: 'mp3',
      stream: true,
    });

    let chunkCount = 0;
    for await (const chunk of stream) {
      chunkCount++;
      console.log(`接收到音频片段 ${chunkCount}:`, {
        id: chunk.id,
        dataLength: chunk.data.length,
        final: chunk.final,
      });

      if (chunk.final) {
        console.log('流式合成完成!');
        break;
      }
    }
  } catch (error) {
    console.error('流式TTS合成失败:', error);
  }
}

// 运行示例
if (require.main === module) {
  streamingUsageExample();
}
