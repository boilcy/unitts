import { describe, it, expect } from 'vitest';
import type {
  UnifiedTTSParams,
  UnifiedTTSAudio,
  UnifiedTTSAudioChunk,
  UnifiedTTSOptions,
  UnifiedTTSParamsWithoutText,
} from '../../src/types/unified';
import type { IParameterAdapter, IResponseAdapter, IProviderAdapter } from '../../src/types/adapters';
import type { MiddlewareContext, IMiddleware } from '../../src/types/middleware';

describe('Type Definitions', () => {
  describe('UnifiedTTSParams', () => {
    it('应该接受基本参数', () => {
      const params: UnifiedTTSParams = {
        text: '测试文本',
        voice: 'female-tianmei',
        model: 'speech-02-hd',
        format: 'mp3',
      };

      expect(params.text).toBe('测试文本');
      expect(params.voice).toBe('female-tianmei');
      expect(params.model).toBe('speech-02-hd');
      expect(params.format).toBe('mp3');
    });

    it('应该接受可选参数', () => {
      const params: UnifiedTTSParams = {
        text: '测试文本',
        pitch: 0.5,
        rate: 1.2,
        volume: 0.8,
        emotion: 'happy',
        sampleRate: 22050,
        stream: true,
        extra: {
          customParam: 'customValue',
        },
      };

      expect(params.pitch).toBe(0.5);
      expect(params.rate).toBe(1.2);
      expect(params.volume).toBe(0.8);
      expect(params.emotion).toBe('happy');
      expect(params.sampleRate).toBe(22050);
      expect(params.stream).toBe(true);
      expect(params.extra?.['customParam']).toBe('customValue');
    });

    it('应该支持不同的音频格式', () => {
      const formats: Array<UnifiedTTSParams['format']> = ['mp3', 'wav', 'pcm', 'opus', 'ogg', 'm4a', 'flac'];

      formats.forEach((format) => {
        const params: UnifiedTTSParams = {
          text: '测试',
          format,
        };
        expect(params.format).toBe(format);
      });
    });
  });

  describe('UnifiedTTSParamsWithoutText', () => {
    it('应该不包含text属性', () => {
      const params: UnifiedTTSParamsWithoutText = {
        voice: 'female-tianmei',
        model: 'speech-02-hd',
        format: 'mp3',
      };

      expect('text' in params).toBe(false);
      expect(params.voice).toBe('female-tianmei');
    });
  });

  describe('UnifiedTTSAudio', () => {
    it('应该包含所有必需的属性', () => {
      const audio: UnifiedTTSAudio = {
        id: 'test-id',
        data: 'base64-audio-data',
        object: 'tts.audio',
        final: true,
      };

      expect(audio.id).toBe('test-id');
      expect(audio.data).toBe('base64-audio-data');
      expect(audio.object).toBe('tts.audio');
      expect(audio.final).toBe(true);
    });

    it('应该支持可选属性', () => {
      const audio: UnifiedTTSAudio = {
        id: 'test-id',
        data: 'base64-audio-data',
        object: 'tts.audio',
        final: true,
        model: 'speech-02-hd',
        metadata: { duration: 1000 },
        originalResponse: { raw: 'response' },
      };

      expect(audio.model).toBe('speech-02-hd');
      expect(audio.metadata?.['duration']).toBe(1000);
      expect(audio.originalResponse?.raw).toBe('response');
    });
  });

  describe('UnifiedTTSAudioChunk', () => {
    it('应该包含所有必需的属性', () => {
      const chunk: UnifiedTTSAudioChunk = {
        id: 'chunk-id',
        data: 'chunk-data',
        object: 'tts.audio.chunk',
        final: false,
      };

      expect(chunk.id).toBe('chunk-id');
      expect(chunk.data).toBe('chunk-data');
      expect(chunk.object).toBe('tts.audio.chunk');
      expect(chunk.final).toBe(false);
    });
  });

  describe('UnifiedTTSOptions', () => {
    it('应该支持所有选项', () => {
      const abortController = new AbortController();
      const options: UnifiedTTSOptions = {
        timeout: 5000,
        maxRetries: 3,
        signal: abortController.signal,
        headers: {
          'Custom-Header': 'value',
        },
      };

      expect(options.timeout).toBe(5000);
      expect(options.maxRetries).toBe(3);
      expect(options.signal).toBe(abortController.signal);
      expect(options.headers?.['Custom-Header']).toBe('value');
    });
  });

  describe('MiddlewareContext', () => {
    it('应该包含所有必需的属性', () => {
      const context: MiddlewareContext = {
        provider: 'test-provider',
        text: '测试文本',
        params: {
          text: '测试文本',
          voice: 'test-voice',
        },
        startTime: Date.now(),
        requestId: 'test-request-id',
      };

      expect(context.provider).toBe('test-provider');
      expect(context.text).toBe('测试文本');
      expect(context.params.text).toBe('测试文本');
      expect(typeof context.startTime).toBe('number');
      expect(context.requestId).toBe('test-request-id');
    });

    it('应该支持可选属性', () => {
      const context: MiddlewareContext = {
        provider: 'test-provider',
        params: {
          text: '测试文本',
        },
        startTime: Date.now(),
        requestId: 'test-request-id',
        textStream: (async function* () {
          yield 'text';
        })(),
        options: { timeout: 5000 },
      };

      expect(context.textStream).toBeDefined();
      expect(context.options?.timeout).toBe(5000);
    });
  });

  describe('Interface Compatibility', () => {
    it('IParameterAdapter应该有正确的方法签名', () => {
      class TestParameterAdapter implements IParameterAdapter<any, any> {
        transform(params: any) {
          return params;
        }

        validate(params: any) {
          if (!params.text) {
            throw new Error('Text is required');
          }
        }
      }

      const adapter = new TestParameterAdapter();
      const testParams = { text: '测试' };

      expect(() => adapter.validate(testParams)).not.toThrow();
      expect(adapter.transform(testParams)).toBe(testParams);
    });

    it('IResponseAdapter应该有正确的方法签名', () => {
      class TestResponseAdapter implements IResponseAdapter<any, any> {
        transform(response: any, requestId?: string) {
          return {
            ...response,
            requestId,
          };
        }
      }

      const adapter = new TestResponseAdapter();
      const testResponse = { data: 'test' };
      const result = adapter.transform(testResponse, 'test-id');

      expect(result.data).toBe('test');
      expect(result.requestId).toBe('test-id');
    });

    it('IProviderAdapter应该有正确的方法签名', () => {
      class TestProviderAdapter implements IProviderAdapter<any, any, any> {
        getProviderName(): string {
          return 'test-provider';
        }

        async synthesize(params: UnifiedTTSParams, options?: UnifiedTTSOptions): Promise<UnifiedTTSAudio> {
          return {
            id: 'test-id',
            data: 'test-data',
            object: 'tts.audio',
            final: true,
          };
        }

        async *synthesizeStream(
          params: UnifiedTTSParams,
          options?: UnifiedTTSOptions,
        ): AsyncGenerator<UnifiedTTSAudioChunk> {
          yield {
            id: 'chunk-id',
            data: 'chunk-data',
            object: 'tts.audio.chunk',
            final: true,
          };
        }

        async *synthesizeIncremental(
          textStream: AsyncIterable<string>,
          params: UnifiedTTSParamsWithoutText,
          options?: UnifiedTTSOptions,
        ): AsyncGenerator<UnifiedTTSAudioChunk> {
          yield {
            id: 'inc-id',
            data: 'inc-data',
            object: 'tts.audio.chunk',
            final: true,
          };
        }
      }

      const adapter = new TestProviderAdapter();
      expect(adapter.getProviderName()).toBe('test-provider');
    });

    it('IMiddleware应该有正确的方法签名', () => {
      class TestMiddleware implements IMiddleware {
        async process<T>(context: MiddlewareContext, next: () => Promise<T>): Promise<T> {
          return next();
        }
      }

      const middleware = new TestMiddleware();
      expect(middleware).toHaveProperty('process');
      expect(typeof middleware.process).toBe('function');
    });
  });
});
