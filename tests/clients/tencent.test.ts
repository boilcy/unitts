import { describe, it, expect, beforeEach } from 'vitest';
import { TencentClient } from '../../src/clients/tencent/tencentClient';
import type { TencentAuth, TencentTTSParams } from '../../src/clients/tencent/tencentTypes';
import { testConfig } from '../setup';

describe('TencentClient', () => {
  let client: TencentClient;
  let mockAuth: TencentAuth;

  beforeEach(() => {
    mockAuth = {
      app_id: testConfig.TENCENT_APP_ID || 'test_app_id',
      secret_id: testConfig.TENCENT_SECRET_ID || 'test_secret_id',
      secret_key: testConfig.TENCENT_SECRET_KEY || 'test_secret_key',
    };
    client = new TencentClient(mockAuth);
  });

  describe('基础功能', () => {
    it('应该返回正确的提供商名称', () => {
      expect(client.getProviderName()).toBe('tencent');
    });

    it('应该能够创建客户端实例', () => {
      expect(client).toBeInstanceOf(TencentClient);
    });

    it('应该生成正确格式的会话ID', () => {
      const sessionId = client['generateSessionId']();
      expect(sessionId).toMatch(/^[a-z0-9]+$/);
      expect(sessionId.length).toBeGreaterThan(10);
    });
  });

  describe('synthesize', () => {
    it('应该成功合成音频', async () => {
      if (!testConfig.TENCENT_APP_ID || !testConfig.TENCENT_SECRET_ID || !testConfig.TENCENT_SECRET_KEY) {
        console.log('跳过腾讯云客户端API测试 - 缺少API密钥');
        return;
      }

      const params: TencentTTSParams = {
        Action: 'TextToVoice',
        Version: '2019-08-23',
        Text: '你好世界，这是腾讯云TTS测试',
        SessionId: 'test_session_' + Date.now(),
        VoiceType: 502001, // 智小柔
        Volume: 5,
        Speed: 0,
        Codec: 'mp3',
      };

      const result = await client.synthesize(params);

      expect(result).toEqual({
        code: 0,
        message: '合成成功',
        session_id: expect.any(String),
        request_id: expect.any(String),
        message_id: expect.any(String),
        audio_data: expect.any(String), // base64数据
        audio_blob: expect.any(Blob),
        final: 1,
      });

      expect(result.code).toBe(0);
      expect(result.message).toBe('合成成功');
      expect(result.audio_data).toBeTruthy();
      expect(result.audio_blob).toBeInstanceOf(Blob);
      expect(result.final).toBe(1);
    });

    it('应该处理API错误', async () => {
      const invalidClient = new TencentClient({
        app_id: 'invalid_app_id',
        secret_id: 'invalid_secret_id',
        secret_key: 'invalid_secret_key',
      });

      const params: TencentTTSParams = {
        Action: 'TextToVoice',
        Version: '2019-08-23',
        Text: '测试文本',
        SessionId: 'test_session',
      };

      await expect(invalidClient.synthesize(params)).rejects.toThrow();
    });

    it('应该支持不同的音色和参数', async () => {
      if (!testConfig.TENCENT_APP_ID || !testConfig.TENCENT_SECRET_ID || !testConfig.TENCENT_SECRET_KEY) {
        console.log('跳过腾讯云参数测试 - 缺少API密钥');
        return;
      }

      const params: TencentTTSParams = {
        Action: 'TextToVoice',
        Version: '2019-08-23',
        Text: '这是一个参数测试',
        SessionId: 'test_session_' + Date.now(),
        VoiceType: 502003, // 智小敏
        Volume: 3,
        Speed: 1,
        Codec: 'opus',
        SampleRate: 16000,
      };

      const result = await client.synthesize(params);

      expect(result.code).toBe(0);
      expect(result.audio_data).toBeTruthy();
      expect(result.audio_blob).toBeInstanceOf(Blob);
    });
  });

  describe('synthesizeStream', () => {
    it('应该成功建立WebSocket连接并接收音频流', async () => {
      if (!testConfig.TENCENT_APP_ID || !testConfig.TENCENT_SECRET_ID || !testConfig.TENCENT_SECRET_KEY) {
        console.log('跳过腾讯云流式客户端测试 - 缺少API密钥');
        return;
      }

      const params: TencentTTSParams = {
        Action: 'TextToStreamAudioWS',
        Version: '2019-08-23',
        Text: '这是一个流式合成测试，内容稍长一些以确保能够产生多个音频块。',
        SessionId: 'test_session_' + Date.now(),
        VoiceType: 502001, // 智小柔
        Volume: 5,
        Speed: 0,
        Codec: 'mp3',
      };

      const chunks = [];
      for await (const chunk of client.synthesizeStream(params)) {
        chunks.push(chunk);
        expect(chunk).toEqual(
          expect.objectContaining({
            code: 0,
            session_id: expect.any(String),
            request_id: expect.any(String),
            message_id: expect.any(String),
          }),
        );

        if (chunk.audio_data) {
          expect(chunk.audio_data).toBeInstanceOf(Blob);
        }
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('应该处理流式API错误', async () => {
      const invalidClient = new TencentClient({
        app_id: 'invalid_app_id',
        secret_id: 'invalid_secret_id',
        secret_key: 'invalid_secret_key',
      });

      const params: TencentTTSParams = {
        Action: 'TextToStreamAudioWS',
        Version: '2019-08-23',
        Text: '测试文本',
        SessionId: 'test_session',
      };

      const streamIterator = invalidClient.synthesizeStream(params);
      await expect(streamIterator.next()).rejects.toThrow();
    });

    it('应该支持字幕功能', async () => {
      if (!testConfig.TENCENT_APP_ID || !testConfig.TENCENT_SECRET_ID || !testConfig.TENCENT_SECRET_KEY) {
        console.log('跳过腾讯云字幕测试 - 缺少API密钥');
        return;
      }

      const params: TencentTTSParams = {
        Action: 'TextToStreamAudioWS',
        Version: '2019-08-23',
        Text: '你好世界，这是字幕测试',
        SessionId: 'test_session_' + Date.now(),
        VoiceType: 502001,
        EnableSubtitle: true,
      };

      const chunks = [];
      for await (const chunk of client.synthesizeStream(params)) {
        chunks.push(chunk);
        if (chunk.result?.subtitles) {
          expect(Array.isArray(chunk.result.subtitles)).toBe(true);
        }
      }

      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('synthesizeIncremental', () => {
    it('应该正确处理文本流', async () => {
      if (!testConfig.TENCENT_APP_ID || !testConfig.TENCENT_SECRET_ID || !testConfig.TENCENT_SECRET_KEY) {
        console.log('跳过腾讯云增量客户端测试 - 缺少API密钥');
        return;
      }

      const textStream = async function* () {
        yield '这是';
        yield '一个';
        yield '增量';
        yield '合成';
        yield '测试';
      };

      const params = {
        Action: 'TextToStreamAudioWSv2' as const,
        Version: '2019-08-23' as const,
        SessionId: 'test_session_' + Date.now(),
        VoiceType: 502001,
        Codec: 'mp3' as const,
      };

      const chunks = [];
      for await (const chunk of client.synthesizeIncremental(textStream(), params)) {
        chunks.push(chunk);
        expect(chunk).toEqual(
          expect.objectContaining({
            code: 0,
            session_id: expect.any(String),
          }),
        );

        if (chunk.audio_data) {
          expect(chunk.audio_data).toBeInstanceOf(Blob);
        }
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('应该正确组合文本流', async () => {
      if (!testConfig.TENCENT_APP_ID || !testConfig.TENCENT_SECRET_ID || !testConfig.TENCENT_SECRET_KEY) {
        console.log('跳过腾讯云文本组合测试 - 缺少API密钥');
        return;
      }

      const textStream = async function* () {
        yield '第一部分，';
        yield '第二部分，';
        yield '第三部分。';
      };

      const params = {
        Action: 'TextToStreamAudioWSv2' as const,
        Version: '2019-08-23' as const,
        SessionId: 'test_session_' + Date.now(),
        VoiceType: 502001,
        Codec: 'pcm' as const,
      };

      const chunks = [];
      for await (const chunk of client.synthesizeIncremental(textStream(), params)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('应该处理增量合成错误', async () => {
      const invalidClient = new TencentClient({
        app_id: 'invalid_app_id',
        secret_id: 'invalid_secret_id',
        secret_key: 'invalid_secret_key',
      });

      const textStream = async function* () {
        yield '测试文本';
      };

      const params = {
        Action: 'TextToStreamAudioWSv2' as const,
        Version: '2019-08-23' as const,
        SessionId: 'test_session',
        VoiceType: 502001,
      };

      const streamIterator = invalidClient.synthesizeIncremental(textStream(), params);
      await expect(streamIterator.next()).rejects.toThrow();
    });
  });

  describe('情感语音测试', () => {
    it('应该支持情感语音合成', async () => {
      if (!testConfig.TENCENT_APP_ID || !testConfig.TENCENT_SECRET_ID || !testConfig.TENCENT_SECRET_KEY) {
        console.log('跳过腾讯云情感语音测试 - 缺少API密钥');
        return;
      }

      const params: TencentTTSParams = {
        Action: 'TextToVoice',
        Version: '2019-08-23',
        Text: '今天天气真好呀！',
        SessionId: 'test_session_' + Date.now(),
        VoiceType: 502004,
        EmotionCategory: 'happy',
        EmotionIntensity: 150,
      };

      const result = await client.synthesize(params);

      expect(result.code).toBe(0);
      expect(result.audio_data).toBeTruthy();
      expect(result.audio_blob).toBeInstanceOf(Blob);
    });
  });
});
