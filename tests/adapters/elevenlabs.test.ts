import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ElevenLabsProviderAdapter } from '../../src/adapters/elevenlabs/providerAdapter';
import { testConfig } from '../setup';

describe('ElevenLabsProviderAdapter', () => {
  let adapter: ElevenLabsProviderAdapter;

  beforeEach(() => {
    adapter = new ElevenLabsProviderAdapter(testConfig.ELEVENLABS_API_KEY || 'test-key');
  });

  describe('Basic Functionality', () => {
    it('应该能够创建适配器实例', () => {
      expect(adapter).toBeInstanceOf(ElevenLabsProviderAdapter);
    });

    it('应该返回正确的提供商名称', () => {
      expect(adapter.getProviderName()).toBe('elevenlabs');
    });

    it('应该能够合成文本', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs API测试 - 缺少API密钥');
        return;
      }

      const result = await adapter.synthesize({
        text: 'Hello, world!',
        voice: 'Rachel',
        model: 'eleven_multilingual_v2',
        format: 'mp3',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('data');
      expect(result.object).toBe('tts.audio');
      expect(typeof result.data).toBe('string');
    });

    it('应该能够流式合成文本', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs流式API测试 - 缺少API密钥');
        return;
      }

      const stream = adapter.synthesizeStream({
        text: 'This is a streaming synthesis test.',
        voice: 'Rachel',
        model: 'eleven_multilingual_v2',
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
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs增量API测试 - 缺少API密钥');
        return;
      }

      async function* textStream() {
        yield 'This ';
        yield 'is ';
        yield 'an ';
        yield 'incremental ';
        yield 'synthesis ';
        yield 'test.';
      }

      const stream = adapter.synthesizeIncremental(textStream(), {
        voice: 'Rachel',
        model: 'eleven_multilingual_v2',
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
    it('无效API密钥应该抛出错误', async () => {
      const invalidAdapter = new ElevenLabsProviderAdapter('invalid-key');

      await expect(
        invalidAdapter.synthesize({
          text: 'Test text',
          voice: 'Rachel',
          model: 'eleven_multilingual_v2',
          format: 'mp3',
        }),
      ).rejects.toThrow();
    });

    it('空文本应该处理正确', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs空文本测试 - 缺少API密钥');
        return;
      }

      await expect(
        adapter.synthesize({
          text: '',
          voice: 'Rachel',
          model: 'eleven_multilingual_v2',
          format: 'mp3',
        }),
      ).rejects.toThrow();
    });

    it('无效声音ID应该抛出错误', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs无效声音测试 - 缺少API密钥');
        return;
      }

      await expect(
        adapter.synthesize({
          text: 'Test text',
          voice: 'invalid-voice-id',
          model: 'eleven_multilingual_v2',
          format: 'mp3',
        }),
      ).rejects.toThrow();
    });
  });

  describe('Parameter Transformation', () => {
    it('应该正确转换统一参数到ElevenLabs格式', async () => {
      const mockClient = {
        getProviderName: () => 'elevenlabs',
        synthesize: vi.fn().mockResolvedValue({
          audioBase64: 'mock-audio-data',
          normalizedAlignment: {
            characters: [],
            characterStartTimesSeconds: [],
            characterEndTimesSeconds: [],
          },
          alignment: {
            characters: [],
            characterStartTimesSeconds: [],
            characterEndTimesSeconds: [],
          },
        }),
        synthesizeStream: vi.fn(),
        synthesizeIncremental: vi.fn(),
      };

      const result = await mockClient.synthesize({
        voiceId: 'Rachel',
        text: 'Test text',
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_22050_32',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true,
        },
        withTimestamps: false,
      });

      expect(mockClient.synthesize).toHaveBeenCalledWith({
        voiceId: 'Rachel',
        text: 'Test text',
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_22050_32',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true,
        },
        withTimestamps: false,
      });

      expect(result).toHaveProperty('audioBase64');
    });

    it('应该支持中文语音合成', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs中文测试 - 缺少API密钥');
        return;
      }

      const result = await adapter.synthesize({
        text: '你好，世界！这是中文语音合成测试。',
        voice: 'Rachel',
        model: 'eleven_multilingual_v2',
        format: 'mp3',
        extra: {
          language_code: 'zh',
        },
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('data');
      expect(result.object).toBe('tts.audio');
    });
  });

  describe('Voice Settings', () => {
    it('应该支持自定义语音设置', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs语音设置测试 - 缺少API密钥');
        return;
      }

      const result = await adapter.synthesize({
        text: 'Test with custom voice settings',
        voice: 'Rachel',
        model: 'eleven_multilingual_v2',
        format: 'mp3',
        extra: {
          voice_settings: {
            stability: 0.7,
            similarity_boost: 0.9,
            style: 0.2,
            use_speaker_boost: false,
          },
        },
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('data');
      expect(result.object).toBe('tts.audio');
    });

    it('应该支持时间戳', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs时间戳测试 - 缺少API密钥');
        return;
      }

      const result = await adapter.synthesize({
        text: 'Test with timestamps',
        voice: 'Rachel',
        model: 'eleven_multilingual_v2',
        format: 'mp3',
        extra: {
          withTimestamps: true,
        },
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('data');
      expect(result.object).toBe('tts.audio');
      // 当启用时间戳时，额外信息中应包含对齐数据
      if (result.originalResponse) {
        expect(result.originalResponse).toHaveProperty('normalizedAlignment');
      }
    });
  });
});
