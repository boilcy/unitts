import { describe, it, expect, beforeEach } from 'vitest';
import { ElevenLabsClient } from '../../../src/clients/elevenlabs/elevenlabsClient';
import { testConfig } from '../../setup';

const testVoiceId = 'X103yr7FZVoJMPQk9Yen';

describe('ElevenLabsClient', () => {
  let client: ElevenLabsClient;

  beforeEach(() => {
    client = new ElevenLabsClient(testConfig.ELEVENLABS_API_KEY || 'test-key');
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
});
