import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TencentProviderAdapter } from '../../src/adapters/tencent';
import type { UnifiedTTSParams } from '../../src/types/unified';
import type { TencentAuth } from '../../src/clients/tencent/tencentTypes';

describe('TencentProviderAdapter', () => {
  let adapter: TencentProviderAdapter;
  let mockAuth: TencentAuth;

  beforeEach(() => {
    mockAuth = {
      app_id: 'test_app_id',
      secret_id: 'test_secret_id',
      secret_key: 'test_secret_key',
    };
    adapter = new TencentProviderAdapter(mockAuth);
  });

  describe('parameter transformation', () => {
    it('should transform basic unified parameters to Tencent format', () => {
      const unifiedParams: UnifiedTTSParams<'tencent'> = {
        text: '你好，世界',
        voice: '101001',
        volume: 5,
        rate: 2,
        format: 'mp3',
        sampleRate: 16000,
      };

      const transformedParams = adapter['parameterAdapter'].transform(unifiedParams);

      expect(transformedParams).toEqual({
        Action: 'TextToStreamAudio',
        Version: '2019-08-23',
        Text: '你好，世界',
        VoiceType: 101001,
        Volume: 5,
        Speed: 2,
        Codec: 'mp3',
        SampleRate: 16000,
      });
    });

    it('should use default voice when not specified', () => {
      const unifiedParams: UnifiedTTSParams<'tencent'> = {
        text: '测试文本',
      };

      const transformedParams = adapter['parameterAdapter'].transform(unifiedParams);

      expect(transformedParams.VoiceType).toBe(101001); // 默认智瑜，情感女声
    });

    it('should handle numeric voice type', () => {
      const unifiedParams: UnifiedTTSParams<'tencent'> = {
        text: '测试文本',
        voice: '502001',
      };

      const transformedParams = adapter['parameterAdapter'].transform(unifiedParams);

      expect(transformedParams.VoiceType).toBe(502001);
    });

    it('should handle string numeric voice type', () => {
      const unifiedParams: UnifiedTTSParams<'tencent'> = {
        text: '测试文本',
        voice: '502001',
      };

      const transformedParams = adapter['parameterAdapter'].transform(unifiedParams);

      expect(transformedParams.VoiceType).toBe(502001);
    });

    it('should clamp volume to valid range', () => {
      const unifiedParams: UnifiedTTSParams<'tencent'> = {
        text: '测试文本',
        volume: 15, // 超出范围
      };

      const transformedParams = adapter['parameterAdapter'].transform(unifiedParams);

      expect(transformedParams.Volume).toBe(10); // 应该被限制在最大值
    });

    it('should clamp speed to valid range', () => {
      const unifiedParams: UnifiedTTSParams<'tencent'> = {
        text: '测试文本',
        rate: -15, // 超出范围
      };

      const transformedParams = adapter['parameterAdapter'].transform(unifiedParams);

      expect(transformedParams.Speed).toBe(-10); // 应该被限制在最小值
    });

    it('should filter unsupported audio formats', () => {
      const unifiedParams: UnifiedTTSParams<'tencent'> = {
        text: '测试文本',
        format: 'opus' as any, // 不支持的格式
      };

      const transformedParams = adapter['parameterAdapter'].transform(unifiedParams);

      expect(transformedParams.Codec).toBeUndefined();
    });

    it('should filter unsupported sample rates', () => {
      const unifiedParams: UnifiedTTSParams<'tencent'> = {
        text: '测试文本',
        sampleRate: 48000, // 不支持的采样率
      };

      const transformedParams = adapter['parameterAdapter'].transform(unifiedParams);

      expect(transformedParams.SampleRate).toBeUndefined();
    });

    it('should handle emotion mapping', () => {
      const unifiedParams: UnifiedTTSParams<'tencent'> = {
        text: '测试文本',
        emotion: 'happy',
      };

      const transformedParams = adapter['parameterAdapter'].transform(unifiedParams);

      expect(transformedParams.EmotionCategory).toBe('happy');
    });

    it('should merge extra parameters correctly', () => {
      const unifiedParams: UnifiedTTSParams<'tencent'> = {
        text: '测试文本',
        voice: '502001',
        extra: {
          EnableSubtitle: true,
          Volume: 8, // 应该覆盖基础参数
          EmotionIntensity: 120,
        },
      };

      const transformedParams = adapter['parameterAdapter'].transform(unifiedParams);

      expect(transformedParams).toEqual({
        Action: 'TextToStreamAudio',
        Version: '2019-08-23',
        Text: '测试文本',
        VoiceType: 502001,
        EnableSubtitle: true,
        Volume: 8,
        EmotionIntensity: 120,
      });
    });
  });

  describe('response transformation', () => {
    it('should transform Tencent response with base64 audio data to unified format', () => {
      const mockBlob = new Blob(['test audio data'], { type: 'audio/mp3' });
      const tencentResponse = {
        code: 0,
        message: '合成成功',
        session_id: 'test_session_id',
        request_id: 'test_request_id',
        message_id: 'test_message_id',
        audio_data: 'dGVzdCBhdWRpbyBkYXRh', // base64: "test audio data"
        audio_blob: mockBlob,
        final: 1,
      };

      const unifiedResponse = adapter['responseAdapter'].transform(tencentResponse);

      expect(unifiedResponse).toEqual({
        id: 'test_session_id',
        data: 'dGVzdCBhdWRpbyBkYXRh',
        final: true,
        object: 'tts.audio',
        metadata: {
          message: '合成成功',
          code: 0,
          session_id: 'test_session_id',
          request_id: 'test_request_id',
          message_id: 'test_message_id',
          blob: mockBlob,
          subtitles: undefined,
        },
        originalResponse: tencentResponse,
      });
    });

    it('should transform Tencent chunk to unified format', () => {
      const mockBlob = new Blob(['test audio data'], { type: 'audio/pcm' });
      const tencentChunk = {
        code: 0,
        message: '成功',
        session_id: 'test_session_id',
        request_id: 'test_request_id',
        message_id: 'test_message_id',
        audio_data: mockBlob,
        final: 0,
        result: {
          subtitles: [
            {
              Text: '测试文本',
              BeginTime: 0,
              EndTime: 1000,
              BeginIndex: 0,
              EndIndex: 4,
            },
          ],
        },
      };

      const unifiedChunk = adapter['chunkAdapter'].transform(tencentChunk);

      expect(unifiedChunk).toEqual({
        id: 'test_session_id',
        data: '[Blob data - use metadata.blob for actual data]',
        final: false,
        object: 'tts.audio.chunk',
        metadata: {
          message: '成功',
          code: 0,
          session_id: 'test_session_id',
          request_id: 'test_request_id',
          message_id: 'test_message_id',
          blob: mockBlob,
          subtitles: [
            {
              Text: '测试文本',
              BeginTime: 0,
              EndTime: 1000,
              BeginIndex: 0,
              EndIndex: 4,
            },
          ],
        },
        originalResponse: tencentChunk,
      });
    });

    it('should handle string audio data in chunks', () => {
      const tencentChunk = {
        code: 0,
        message: '成功',
        session_id: 'test_session_id',
        request_id: 'test_request_id',
        message_id: 'test_message_id',
        audio_data: new Blob(['test audio data'], { type: 'audio/mp3' }),
        final: 1,
      };

      const unifiedChunk = adapter['chunkAdapter'].transform(tencentChunk);

      expect(unifiedChunk.data).toBe('dGVzdCBhdWRpbyBkYXRh');
      expect(unifiedChunk.final).toBe(true);
      expect(unifiedChunk.metadata?.['blob']).toBeUndefined();
    });

    it('should use request_id as fallback for id', () => {
      const tencentResponse = {
        code: 0,
        message: '合成成功',
        request_id: 'test_request_id',
        message_id: 'test_message_id',
        session_id: 'test_session_id',
        audio_data: 'dGVzdCBhdWRpbw==',
        final: 1,
      };

      const unifiedResponse = adapter['responseAdapter'].transform(tencentResponse);

      expect(unifiedResponse.id).toBe('test_request_id');
    });

    it('should handle response without audio data', () => {
      const tencentResponse = {
        code: 0,
        message: '合成成功',
        session_id: 'test_session_id',
        request_id: 'test_request_id',
        message_id: 'test_message_id',
        final: 1,
      };

      const unifiedResponse = adapter['responseAdapter'].transform(tencentResponse);

      expect(unifiedResponse.data).toBe('');
      expect(unifiedResponse.metadata?.['blob']).toBeUndefined();
    });
  });

  describe('client integration', () => {
    it('should initialize with correct provider name', () => {
      const client = adapter['client'];
      expect(client.getProviderName()).toBe('tencent');
    });
  });

  describe('adapter methods', () => {
    it('should have synthesize method', () => {
      expect(typeof adapter.synthesize).toBe('function');
    });

    it('should have synthesizeStream method', () => {
      expect(typeof adapter.synthesizeStream).toBe('function');
    });

    it('should have synthesizeIncremental method', () => {
      expect(typeof adapter.synthesizeIncremental).toBe('function');
    });

    it('should transform parameters before passing to client', async () => {
      const unifiedParams: UnifiedTTSParams<'tencent'> = {
        text: '你好世界',
        voice: '502001',
        volume: 5,
        rate: 1,
      };

      const clientSpy = vi.spyOn(adapter['client'], 'synthesize').mockResolvedValue({
        code: 0,
        message: '合成成功',
        session_id: 'test_session',
        request_id: 'test_request',
        message_id: 'test_message',
        audio_data: 'dGVzdA==',
        final: 1,
      });

      await adapter.synthesize(unifiedParams);

      expect(clientSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: 'TextToStreamAudio',
          Version: '2019-08-23',
          Text: '你好世界',
          VoiceType: 502001,
          Volume: 5,
          Speed: 1,
        }),
        undefined,
      );

      clientSpy.mockRestore();
    });
  });

  describe('streaming and incremental support', () => {
    it('should support streaming synthesis with real voice id', async () => {
      const unifiedParams: UnifiedTTSParams<'tencent'> = {
        text: '这是一个流式合成测试',
        voice: '502001',
        format: 'pcm',
        sampleRate: 16000,
        extra: {
          EnableSubtitle: true,
        },
      };

      const mockChunks = [
        {
          code: 0,
          message: '成功',
          session_id: 'stream_session',
          request_id: 'stream_request',
          message_id: 'stream_message_1',
          audio_data: new Blob(['chunk1'], { type: 'audio/pcm' }),
          final: 0,
        },
        {
          code: 0,
          message: '成功',
          session_id: 'stream_session',
          request_id: 'stream_request',
          message_id: 'stream_message_2',
          audio_data: new Blob(['chunk2'], { type: 'audio/pcm' }),
          final: 1,
        },
      ];

      const mockAsyncGenerator = async function* () {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      };

      const clientSpy = vi.spyOn(adapter['client'], 'synthesizeStream').mockReturnValue(mockAsyncGenerator());

      const chunks = [];
      for await (const chunk of adapter.synthesizeStream(unifiedParams)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual(
        expect.objectContaining({
          id: 'stream_session',
          data: '[Blob data - use metadata.blob for actual data]',
          final: false,
          object: 'tts.audio.chunk',
        }),
      );
      expect(chunks[1]).toEqual(
        expect.objectContaining({
          final: true,
        }),
      );

      expect(clientSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: 'TextToStreamAudio',
          Text: '这是一个流式合成测试',
          VoiceType: 502001,
          Codec: 'pcm',
          SampleRate: 16000,
          EnableSubtitle: true,
        }),
        undefined,
      );

      clientSpy.mockRestore();
    });

    it('should support incremental synthesis', async () => {
      const textStream = async function* () {
        yield '第一句话。';
        yield '第二句话。';
        yield '第三句话。';
      };

      const params = {
        voice: '502001',
        volume: 6,
        rate: 0,
        extra: {
          EmotionCategory: 'happy' as const,
          EmotionIntensity: 150,
        },
      };

      const mockChunks = [
        {
          code: 0,
          message: '增量合成中',
          session_id: 'incremental_session',
          request_id: 'incremental_request',
          message_id: 'incremental_1',
          audio_data: new Blob(['inc1'], { type: 'audio/pcm' }),
          final: 0,
        },
        {
          code: 0,
          message: '增量合成中',
          session_id: 'incremental_session',
          request_id: 'incremental_request',
          message_id: 'incremental_2',
          audio_data: new Blob(['inc2'], { type: 'audio/pcm' }),
          final: 0,
        },
        {
          code: 0,
          message: '增量合成完成',
          session_id: 'incremental_session',
          request_id: 'incremental_request',
          message_id: 'incremental_3',
          audio_data: new Blob(['inc3'], { type: 'audio/pcm' }),
          final: 1,
        },
      ];

      const mockAsyncGenerator = async function* () {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      };

      const clientSpy = vi
        .spyOn(adapter['client'], 'synthesizeIncremental')
        .mockReturnValue(mockAsyncGenerator());

      const chunks = [];
      for await (const chunk of adapter.synthesizeIncremental(textStream(), params)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[2]?.final).toBe(true);

      expect(clientSpy).toHaveBeenCalledWith(
        textStream,
        expect.objectContaining({
          VoiceType: 502001,
          Volume: 6,
          Speed: 0,
          EmotionCategory: 'happy',
          EmotionIntensity: 150,
        }),
        undefined,
      );

      clientSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle client errors in synthesis', async () => {
      const unifiedParams: UnifiedTTSParams<'tencent'> = {
        text: '测试错误处理',
        voice: '502001',
      };

      const clientSpy = vi
        .spyOn(adapter['client'], 'synthesize')
        .mockRejectedValue(new Error('腾讯云 TTS 错误: 参数无效'));

      await expect(adapter.synthesize(unifiedParams)).rejects.toThrow('腾讯云 TTS 错误: 参数无效');

      clientSpy.mockRestore();
    });

    it('should handle streaming errors', async () => {
      const unifiedParams: UnifiedTTSParams<'tencent'> = {
        text: '测试流式错误',
        voice: '502001',
      };

      const mockErrorGenerator = async function* () {
        throw new Error('WebSocket连接失败');
      };

      const clientSpy = vi.spyOn(adapter['client'], 'synthesizeStream').mockReturnValue(mockErrorGenerator());

      await expect(async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const chunk of adapter.synthesizeStream(unifiedParams)) {
          // 应该抛出错误
        }
      }).rejects.toThrow('WebSocket连接失败');

      clientSpy.mockRestore();
    });
  });

  describe('voice id compatibility', () => {
    it('should handle real-time synthesis voices (502xxx)', () => {
      const voices = ['502001', '502003', '502004'];

      voices.forEach((voiceId) => {
        const unifiedParams: UnifiedTTSParams<'tencent'> = {
          text: `测试语音 ${voiceId}`,
          voice: voiceId,
        };

        const transformedParams = adapter['parameterAdapter'].transform(unifiedParams);
        expect(transformedParams.VoiceType).toBe(Number.parseInt(voiceId, 10));
      });
    });

    it('should handle large model voices (501xxx)', () => {
      const voices = ['501000', '501001', '501002'];

      voices.forEach((voiceId) => {
        const unifiedParams: UnifiedTTSParams<'tencent'> = {
          text: `测试大模型语音 ${voiceId}`,
          voice: voiceId,
        };

        const transformedParams = adapter['parameterAdapter'].transform(unifiedParams);
        expect(transformedParams.VoiceType).toBe(Number.parseInt(voiceId, 10));
      });
    });

    it('should handle premium voices (101xxx)', () => {
      const voices = ['101001', '101002', '101003'];

      voices.forEach((voiceId) => {
        const unifiedParams: UnifiedTTSParams<'tencent'> = {
          text: `测试精品语音 ${voiceId}`,
          voice: voiceId,
        };

        const transformedParams = adapter['parameterAdapter'].transform(unifiedParams);
        expect(transformedParams.VoiceType).toBe(Number.parseInt(voiceId, 10));
      });
    });
  });
});
