import { TTSRelay } from '../src/ttsRelay';
import { MinimaxProviderAdapter } from '../src/adapters/minimax/providerAdapter';
import { LoggingMiddleware } from '../src/middleware/logging';

async function basicUsageExample() {
  // 创建TTS中继实例
  const ttsRelay = new TTSRelay();

  // 注册Minimax适配器
  const minimaxAdapter = new MinimaxProviderAdapter('your-api-key', 'your-group-id');
  ttsRelay.registerAdapter('minimax', minimaxAdapter);

  // 注册日志中间件
  const loggingMiddleware = new LoggingMiddleware();
  ttsRelay.use(loggingMiddleware);

  try {
    // 基本文本合成
    const result = await ttsRelay.synthesize('minimax', {
      text: '你好，欢迎使用统一TTS服务！',
      voice: 'female-tianmei',
      model: 'speech-02-hd',
      format: 'mp3',
    });

    console.log('合成成功，音频ID:', result.id);
    console.log('音频数据长度:', result.data.length);
  } catch (error) {
    console.error('TTS合成失败:', error);
  }
}

// 运行示例
if (require.main === module) {
  basicUsageExample();
}
