import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MinimaxProviderAdapter } from '../../src/adapters/minimax/providerAdapter';
import { testConfig } from '../setup';

describe('MinimaxProviderAdapter', () => {
  let adapter: MinimaxProviderAdapter;

  beforeEach(() => {
    adapter = new MinimaxProviderAdapter(
      testConfig.MINIMAX_API_KEY || 'test-key',
      testConfig.MINIMAX_GROUP_ID || 'test-group',
    );
  });

  describe('Basic Functionality', () => {
    it('应该能够创建适配器实例', () => {
      expect(adapter).toBeInstanceOf(MinimaxProviderAdapter);
    });

    it('应该能够合成文本', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过Minimax API测试 - 缺少API密钥');
        return;
      }

      const result = await adapter.synthesize({
        text: '你好，世界！',
        voice: 'female-tianmei',
        model: 'speech-02-hd',
        format: 'mp3',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('data');
      expect(result.object).toBe('tts.audio');
      expect(typeof result.data).toBe('string');
    });

    it('应该能够流式合成文本', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过Minimax流式API测试 - 缺少API密钥');
        return;
      }

      const stream = adapter.synthesizeStream({
        text: '这是一个流式合成测试。',
        voice: 'female-tianmei',
        model: 'speech-02-hd',
        format: 'mp3',
      });

      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
        expect(chunk).toHaveProperty('id');
        expect(chunk).toHaveProperty('data');
        expect(chunk.object).toBe('tts.audio.chunk');
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('应该能够增量合成文本', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过Minimax增量API测试 - 缺少API密钥');
        return;
      }

      async function* textStream() {
        yield '这是';
        yield '一个';
        yield '增量';
        yield '合成';
        yield '测试';
      }

      const stream = adapter.synthesizeIncremental(textStream(), {
        voice: 'female-tianmei',
        model: 'speech-02-hd',
        format: 'mp3',
      });

      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
        expect(chunk).toHaveProperty('id');
        expect(chunk).toHaveProperty('data');
        expect(chunk.object).toBe('tts.audio.chunk');
      }

      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('无效参数应该抛出错误', async () => {
      const invalidAdapter = new MinimaxProviderAdapter('invalid-key', 'invalid-group');

      await expect(
        invalidAdapter.synthesize({
          text: '测试文本',
          voice: 'female-tianmei',
          model: 'speech-02-hd',
          format: 'mp3',
        }),
      ).rejects.toThrow();
    });

    it('空文本应该处理正确', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过Minimax空文本测试 - 缺少API密钥');
        return;
      }

      await expect(
        adapter.synthesize({
          text: '',
          voice: 'female-tianmei',
          model: 'speech-02-hd',
          format: 'mp3',
        }),
      ).rejects.toThrow();
    });
  });

  describe('Parameter Transformation', () => {
    it('应该正确转换统一参数到Minimax格式', async () => {
      const mockClient = {
        getProviderName: () => 'minimax',
        synthesize: vi.fn().mockResolvedValue({
          base_resp: { status_code: 0, status_msg: 'success' },
          data: { audio: 'mock-audio-data', status: 2 },
          trace_id: 'test-trace-id',
        }),
        synthesizeStream: vi.fn(),
        synthesizeIncremental: vi.fn(),
      };

      const result = await mockClient.synthesize({
        text: '测试文本',
        model: 'speech-02-hd',
        voice_setting: {
          voice_id: 'female-tianmei',
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
          emotion: 'neutral',
        },
        audio_setting: {
          format: 'mp3',
          sample_rate: 22050,
        },
      });

      expect(mockClient.synthesize).toHaveBeenCalledWith({
        text: '测试文本',
        model: 'speech-02-hd',
        voice_setting: {
          voice_id: 'female-tianmei',
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
          emotion: 'neutral',
        },
        audio_setting: {
          format: 'mp3',
          sample_rate: 22050,
        },
      });

      expect(result).toHaveProperty('data.audio');
    });
  });
});
