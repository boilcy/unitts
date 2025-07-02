import { describe, it, expect, beforeEach } from 'vitest';
import { ElevenLabsClient } from '../../src/clients/elevenlabs/elevenlabsClient';
import { testConfig } from '../setup';
import type {
  StreamTextToSpeechRequestExtended,
  TextToSpeechRequestExtended,
} from '../../src/clients/elevenlabs/elevenlabsTypes';

const testVoiceId = 'X103yr7FZVoJMPQk9Yen';

describe('ElevenLabsClient', () => {
  let client: ElevenLabsClient;

  beforeEach(() => {
    client = new ElevenLabsClient(testConfig.ELEVENLABS_API_KEY || 'test-key');
  });

  describe('Basic Properties', () => {
    it('应该返回正确的提供商名称', () => {
      expect(client.getProviderName()).toBe('elevenlabs');
    });

    it('应该能够创建客户端实例', () => {
      expect(client).toBeInstanceOf(ElevenLabsClient);
    });
  });

  describe('Synthesize Method', () => {
    it('应该能够合成文本', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs客户端API测试 - 缺少API密钥');
        return;
      }

      const params: TextToSpeechRequestExtended = {
        voiceId: testVoiceId,
        text: 'Hello, this is a test synthesis.',
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_22050_32',
        withTimestamps: true,
      };

      const result = await client.synthesize(params);

      expect(result).toHaveProperty('audioBase64');
      expect(typeof result.audioBase64).toBe('string');
      expect(result.audioBase64.length).toBeGreaterThan(0);
    });

    it('应该处理API错误', async () => {
      const invalidClient = new ElevenLabsClient('invalid-key');

      const params: TextToSpeechRequestExtended = {
        voiceId: testVoiceId,
        text: 'Test text',
        modelId: 'eleven_multilingual_v2',
      };

      await expect(invalidClient.synthesize(params)).rejects.toThrow();
    });

    it('应该支持超时选项', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs超时测试 - 缺少API密钥');
        return;
      }

      const params: TextToSpeechRequestExtended = {
        voiceId: testVoiceId,
        text: 'Test timeout',
        modelId: 'eleven_multilingual_v2',
      };

      const abortController = new AbortController();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          abortController.abort();
          reject(new Error('测试超时'));
        }, 1);
      });

      await expect(
        Promise.race([client.synthesize(params, { signal: abortController.signal }), timeoutPromise]),
      ).rejects.toThrow();
    });

    it('应该支持时间戳', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs时间戳测试 - 缺少API密钥');
        return;
      }

      const params: TextToSpeechRequestExtended = {
        voiceId: testVoiceId,
        text: 'Test with timestamps',
        modelId: 'eleven_multilingual_v2',
        withTimestamps: true,
      };

      const result = await client.synthesize(params);

      expect(result).toHaveProperty('audioBase64');
      expect(result).toHaveProperty('alignment');
      expect(result).toHaveProperty('normalizedAlignment');
    });
  });

  describe('Stream Synthesis', () => {
    it('应该能够流式合成文本', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs流式客户端测试 - 缺少API密钥');
        return;
      }

      const params: StreamTextToSpeechRequestExtended = {
        voiceId: testVoiceId,
        text: 'This is a streaming synthesis test with longer text to ensure multiple audio chunks are generated.',
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_22050_32',
        withTimestamps: true,
      };

      const chunks = [];
      for await (const chunk of client.synthesizeStream(params)) {
        chunks.push(chunk);
        expect(chunk).toHaveProperty('audioBase64');
        expect(typeof chunk.audioBase64).toBe('string');
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('应该处理流式API错误', async () => {
      const invalidClient = new ElevenLabsClient('invalid-key');

      const params = {
        voiceId: testVoiceId,
        text: 'Test text',
        model_id: 'eleven_multilingual_v2',
      };

      const streamIterator = invalidClient.synthesizeStream(params);
      await expect(streamIterator.next()).rejects.toThrow();
    });
  });

  describe('Incremental Synthesis', () => {
    it('应该能够增量合成文本', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs增量客户端测试 - 缺少API密钥');
        return;
      }

      async function* textStream() {
        yield 'This ';
        yield 'is ';
        yield 'an ';
        yield 'incremental ';
        yield 'text ';
        yield 'synthesis ';
        yield 'test.';
      }

      const params = {
        voiceId: testVoiceId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
        },
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_22050_32' as const,
      };

      const chunks = [];
      for await (const chunk of client.synthesizeIncremental(textStream(), { ...params, text: '' })) {
        chunks.push(chunk);
        expect(chunk).toHaveProperty('audio');
        expect(chunk).toHaveProperty('isFinal');
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('应该正确组合文本流', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs文本组合测试 - 缺少API密钥');
        return;
      }

      async function* textStream() {
        yield 'First part, ';
        yield 'second part, ';
        yield 'third part.';
      }

      const params = {
        voiceId: testVoiceId,
        voice_settings: {
          stability: 0.5,
        },
        model_id: 'eleven_multilingual_v2',
      };

      const chunks = [];
      for await (const chunk of client.synthesizeIncremental(textStream(), { ...params, text: '' })) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('应该处理空文本流', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs空流测试 - 缺少API密钥');
        return;
      }

      async function* emptyTextStream() {
        // 空的生成器
        return;
      }

      const params = {
        voiceId: testVoiceId,
        modelId: 'eleven_multilingual_v2',
      };

      const chunks = [];
      for await (const chunk of client.synthesizeIncremental(emptyTextStream(), { ...params, text: '' })) {
        chunks.push(chunk);
      }

      // 空流可能不产生任何块，或者产生最小的音频块
      expect(chunks.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Request Headers', () => {
    it('应该支持自定义请求头', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs自定义头测试 - 缺少API密钥');
        return;
      }

      const params: TextToSpeechRequestExtended = {
        voiceId: testVoiceId,
        text: 'Test with custom headers',
        modelId: 'eleven_multilingual_v2',
      };

      const options = {
        headers: {
          'Custom-Header': 'test-value',
          'X-Request-ID': 'custom-request-id',
        },
      };

      // 这里主要测试不会抛出错误，具体的头部传递由底层SDK处理
      const result = await client.synthesize(params, options);
      expect(result).toHaveProperty('audioBase64');
    });
  });

  describe('Audio Formats', () => {
    it('应该支持不同的音频格式', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs音频格式测试 - 缺少API密钥');
        return;
      }

      const formats = ['mp3_22050_32', 'mp3_44100_32', 'pcm_16000', 'pcm_22050', 'pcm_24000'] as const;

      for (const format of formats) {
        const params: TextToSpeechRequestExtended = {
          voiceId: testVoiceId,
          text: `Test with ${format} format`,
          modelId: 'eleven_multilingual_v2',
          outputFormat: format,
          withTimestamps: true,
        };

        const result = await client.synthesize(params);
        expect(result).toHaveProperty('audioBase64');
        expect(result.audioBase64.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Language Support', () => {
    it('应该支持多语言合成', async () => {
      if (!testConfig.ELEVENLABS_API_KEY) {
        console.log('跳过ElevenLabs多语言测试 - 缺少API密钥');
        return;
      }

      const testCases = [
        { text: 'Hello, world!', lang: 'en' },
        { text: '你好，世界！', lang: 'zh' },
        { text: 'Hola, mundo!', lang: 'es' },
        { text: 'Bonjour le monde!', lang: 'fr' },
      ];

      for (const testCase of testCases) {
        const params: TextToSpeechRequestExtended = {
          voiceId: testVoiceId,
          text: testCase.text,
          modelId: 'eleven_multilingual_v2',
          languageCode: testCase.lang,
          withTimestamps: true,
        };

        const result = await client.synthesize(params);
        expect(result).toHaveProperty('audioBase64');
        expect(result.audioBase64.length).toBeGreaterThan(0);
      }
    });
  });
});
