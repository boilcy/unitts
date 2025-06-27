import { describe, it, expect, beforeEach } from 'vitest';
import { TTSRelay } from '../../src/ttsRelay';
import { MinimaxProviderAdapter } from '../../src/adapters/minimax/providerAdapter';
import { LoggingMiddleware } from '../../src/middleware/logging';
import { testConfig } from '../setup';
import { ProviderName } from 'unitts/types';

describe('Full Workflow Integration Tests', () => {
  let ttsRelay: TTSRelay;
  let minimaxAdapter: MinimaxProviderAdapter;

  beforeEach(() => {
    ttsRelay = new TTSRelay();

    if (testConfig.MINIMAX_API_KEY && testConfig.MINIMAX_GROUP_ID) {
      minimaxAdapter = new MinimaxProviderAdapter(testConfig.MINIMAX_API_KEY, testConfig.MINIMAX_GROUP_ID);
      ttsRelay.registerAdapter('minimax', minimaxAdapter);
    }
  });

  describe('Basic Synthesis Workflow', () => {
    it('应该完成完整的文本合成流程', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过完整工作流测试 - 缺少API密钥');
        return;
      }

      const loggingMiddleware = new LoggingMiddleware({
        logParams: true,
        logResponse: true,
        logTiming: true,
      });

      ttsRelay.use(loggingMiddleware);

      const result = await ttsRelay.synthesize('minimax', {
        text: '这是一个完整的TTS工作流测试。我们测试从文本输入到音频输出的整个过程。',
        voice: 'female-tianmei',
        model: 'speech-02-hd',
        format: 'mp3',
        rate: 1.0,
        volume: 1.0,
        pitch: 0,
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('data');
      expect(result.object).toBe('tts.audio');
      expect(result.final).toBe(true);
      expect(typeof result.data).toBe('string');
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('应该支持不同的音频格式', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过音频格式测试 - 缺少API密钥');
        return;
      }

      const formats = ['mp3', 'wav', 'pcm'] as const;

      for (const format of formats) {
        const result = await ttsRelay.synthesize('minimax', {
          text: `测试${format}格式`,
          voice: 'female-tianmei',
          model: 'speech-02-hd',
          format,
        });

        expect(result).toHaveProperty('data');
        expect(typeof result.data).toBe('string');
      }
    });

    it('应该支持不同的语音选项', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过语音选项测试 - 缺少API密钥');
        return;
      }

      const voices = ['female-tianmei', 'female-yujie', 'male-qn-qingse'] as const;

      for (const voice of voices) {
        const result = await ttsRelay.synthesize('minimax', {
          text: `你好，我正在使用${voice}语音`,
          voice,
          model: 'speech-02-hd',
          format: 'mp3',
        });

        expect(result).toHaveProperty('data');
        expect(typeof result.data).toBe('string');
      }
    });
  });

  describe('Streaming Workflow', () => {
    it('应该完成完整的流式合成流程', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过流式工作流测试 - 缺少API密钥');
        return;
      }

      const loggingMiddleware = new LoggingMiddleware();
      ttsRelay.use(loggingMiddleware);

      const chunks = [];
      const stream = ttsRelay.synthesizeStream('minimax', {
        text: '这是一个流式合成测试。文本内容较长，以便产生多个音频块。流式合成可以让我们更快地获得音频响应，而不需要等待整个音频生成完成。',
        voice: 'female-tianmei',
        model: 'speech-02-hd',
        format: 'mp3',
      });

      for await (const chunk of stream) {
        chunks.push(chunk);
        expect(chunk).toHaveProperty('id');
        expect(chunk).toHaveProperty('data');
        expect(chunk.object).toBe('tts.audio.chunk');
        expect(typeof chunk.data).toBe('string');
      }

      expect(chunks.length).toBeGreaterThan(0);

      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk?.final).toBe(true);
    });
  });

  describe('Incremental Workflow', () => {
    it('应该完成完整的增量合成流程', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过增量工作流测试 - 缺少API密钥');
        return;
      }

      async function* generateText() {
        const textParts = [
          '大家好，',
          '我是人工智能助手。',
          '今天天气不错，',
          '适合出门散步。',
          '希望大家都有美好的一天！',
        ];

        for (const part of textParts) {
          yield part;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      const chunks = [];
      const stream = ttsRelay.synthesizeIncremental('minimax', generateText(), {
        voice: 'female-tianmei',
        model: 'speech-02-hd',
        format: 'mp3',
        rate: 1.0,
        volume: 1.0,
      });

      for await (const chunk of stream) {
        chunks.push(chunk);
        expect(chunk).toHaveProperty('id');
        expect(chunk).toHaveProperty('data');
        expect(chunk.object).toBe('tts.audio.chunk');
      }

      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Providers Workflow', () => {
    it('应该支持多个提供商同时工作', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过多提供商测试 - 缺少API密钥');
        return;
      }

      const providers = ttsRelay.listProviders();
      expect(providers).toContain('minimax');

      for (const provider of providers) {
        const result = await ttsRelay.synthesize(provider, {
          text: `这是使用${provider}提供商的测试`,
          voice: 'female-tianmei',
          model: 'speech-02-hd',
          format: 'mp3',
        });

        expect(result).toHaveProperty('data');
        expect(typeof result.data).toBe('string');
      }
    });
  });

  describe('Error Recovery Workflow', () => {
    it('应该正确处理网络错误', async () => {
      const invalidAdapter = new MinimaxProviderAdapter('invalid-key', 'invalid-group');
      ttsRelay.registerAdapter('invalid' as ProviderName, invalidAdapter);

      await expect(
        ttsRelay.synthesize('invalid' as ProviderName, {
          text: '测试网络错误处理',
          voice: 'female-tianmei',
          model: 'speech-02-hd',
          format: 'mp3',
        }),
      ).rejects.toThrow();
    });

    it('应该正确处理参数验证错误', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过参数验证测试 - 缺少API密钥');
        return;
      }

      await expect(
        ttsRelay.synthesize('minimax', {
          text: '',
          voice: 'invalid-voice' as any,
          model: 'invalid-model' as any,
          format: 'mp3',
        }),
      ).rejects.toThrow();
    });
  });

  describe('Performance and Timeout', () => {
    it('应该在合理时间内完成合成', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过性能测试 - 缺少API密钥');
        return;
      }

      const startTime = Date.now();

      await ttsRelay.synthesize('minimax', {
        text: '这是一个性能测试',
        voice: 'female-tianmei',
        model: 'speech-02-hd',
        format: 'mp3',
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // 30秒内完成
    });

    it('应该支持请求超时', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过超时测试 - 缺少API密钥');
        return;
      }

      const abortController = new AbortController();
      setTimeout(() => abortController.abort(), 1); // 1ms后取消

      await expect(
        ttsRelay.synthesize(
          'minimax',
          {
            text: '这是一个超时测试',
            voice: 'female-tianmei',
            model: 'speech-02-hd',
            format: 'mp3',
          },
          {
            signal: abortController.signal,
          },
        ),
      ).rejects.toThrow();
    });
  });
});
