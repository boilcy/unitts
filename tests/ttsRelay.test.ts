import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TTSRelay } from '../src/ttsRelay';
import { LoggingMiddleware } from '../src/middleware/logging';

describe('TTSRelay', () => {
  let ttsRelay: TTSRelay;

  beforeEach(() => {
    ttsRelay = new TTSRelay();
  });

  describe('Provider Management', () => {
    it('应该成功注册适配器', () => {
      const mockAdapter = {
        getProviderName: () => 'test',
        synthesize: vi.fn(),
        synthesizeStream: vi.fn(),
        synthesizeIncremental: vi.fn(),
      };

      ttsRelay.registerAdapter('test', mockAdapter);
      const providers = ttsRelay.listProviders();

      expect(providers).toContain('test');
    });

    it('应该列出所有已注册的提供商', () => {
      const adapter1 = {
        getProviderName: () => 'provider1',
        synthesize: vi.fn(),
        synthesizeStream: vi.fn(),
        synthesizeIncremental: vi.fn(),
      };

      const adapter2 = {
        getProviderName: () => 'provider2',
        synthesize: vi.fn(),
        synthesizeStream: vi.fn(),
        synthesizeIncremental: vi.fn(),
      };

      ttsRelay.registerAdapter('provider1', adapter1);
      ttsRelay.registerAdapter('provider2', adapter2);

      const providers = ttsRelay.listProviders();
      expect(providers).toEqual(['provider1', 'provider2']);
    });

    it('使用未注册的提供商时应该抛出错误', async () => {
      await expect(ttsRelay.synthesize('nonexistent', { text: 'test' })).rejects.toThrow(
        "Provider 'nonexistent' not found",
      );
    });
  });

  describe('Middleware', () => {
    it('应该成功注册中间件', () => {
      const middleware = new LoggingMiddleware();
      expect(() => ttsRelay.use(middleware)).not.toThrow();
    });

    it('应该按顺序执行多个中间件', async () => {
      const executionOrder: string[] = [];

      const middleware1 = {
        process: async (context: any, next: any) => {
          executionOrder.push('middleware1-before');
          const result = await next();
          executionOrder.push('middleware1-after');
          return result;
        },
      };

      const middleware2 = {
        process: async (context: any, next: any) => {
          executionOrder.push('middleware2-before');
          const result = await next();
          executionOrder.push('middleware2-after');
          return result;
        },
      };

      const mockAdapter = {
        getProviderName: () => 'test',
        synthesize: vi.fn().mockResolvedValue({
          id: '1',
          data: 'test-audio-data',
          object: 'tts.audio',
          final: true,
        }),
        synthesizeStream: vi.fn(),
        synthesizeIncremental: vi.fn(),
      };

      ttsRelay.use(middleware1);
      ttsRelay.use(middleware2);
      ttsRelay.registerAdapter('test', mockAdapter);

      await ttsRelay.synthesize('test', { text: 'hello' });

      expect(executionOrder).toEqual([
        'middleware1-before',
        'middleware2-before',
        'middleware2-after',
        'middleware1-after',
      ]);
    });
  });

  describe('Error Handling', () => {
    it('中间件重复调用next()应该抛出错误', async () => {
      const badMiddleware = {
        process: async (context: any, next: any) => {
          await next();
          await next(); // 重复调用
        },
      };

      const mockAdapter = {
        getProviderName: () => 'test',
        synthesize: vi.fn().mockResolvedValue({
          id: '1',
          data: 'test-audio-data',
          object: 'tts.audio',
          final: true,
        }),
        synthesizeStream: vi.fn(),
        synthesizeIncremental: vi.fn(),
      };

      ttsRelay.use(badMiddleware);
      ttsRelay.registerAdapter('test', mockAdapter);

      await expect(ttsRelay.synthesize('test', { text: 'hello' })).rejects.toThrow(
        'next() called multiple times',
      );
    });
  });
});
