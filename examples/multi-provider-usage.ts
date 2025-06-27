import { TTSRelay } from '../src/ttsRelay';
import { MinimaxProviderAdapter } from '../src/adapters/minimax/providerAdapter';
import { LoggingMiddleware } from '../src/middleware/logging';

async function multiProviderUsageExample() {
  // 创建TTS中继实例
  const ttsRelay = new TTSRelay();

  // 注册多个Provider适配器
  const minimaxAdapter = new MinimaxProviderAdapter('your-minimax-api-key', 'your-group-id');
  ttsRelay.registerAdapter('minimax', minimaxAdapter);

  // 注意：这些是示例，实际使用时需要实现对应的适配器
  // const openaiAdapter = new OpenAIProviderAdapter('your-openai-api-key');
  // ttsRelay.registerAdapter('openai', openaiAdapter);

  // const anthropicAdapter = new AnthropicProviderAdapter('your-anthropic-api-key');
  // ttsRelay.registerAdapter('anthropic', anthropicAdapter);

  // 添加中间件
  ttsRelay.use(new LoggingMiddleware());

  // 查看已注册的providers
  console.log('已注册的TTS提供商:', ttsRelay.listProviders());

  const testText = '这是一个多提供商TTS测试示例。';

  // 测试不同的providers
  for (const provider of ttsRelay.listProviders()) {
    try {
      console.log(`\n正在测试 ${provider} 提供商...`);

      const result = await ttsRelay.synthesize(provider, {
        text: testText,
        voice: getVoiceForProvider(provider),
        model: getModelForProvider(provider),
        format: 'mp3',
      });

      console.log(`${provider} 合成成功:`, {
        id: result.id,
        dataLength: result.data.length,
        final: result.final,
      });
    } catch (error) {
      console.error(`${provider} 合成失败:`, error);
    }
  }
}

// 根据provider返回适当的voice设置
function getVoiceForProvider(provider: string): string {
  switch (provider) {
    case 'minimax':
      return 'female-tianmei';
    case 'openai':
      return 'alloy';
    case 'anthropic':
      return 'default';
    default:
      return 'default';
  }
}

// 根据provider返回适当的model设置
function getModelForProvider(provider: string): string {
  switch (provider) {
    case 'minimax':
      return 'speech-02-hd';
    case 'openai':
      return 'tts-1';
    case 'anthropic':
      return 'claude-3-sonnet';
    default:
      return 'default';
  }
}

// 运行示例
if (require.main === module) {
  multiProviderUsageExample();
}
