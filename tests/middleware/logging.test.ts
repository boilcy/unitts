import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoggingMiddleware, ConsoleLogger } from '../../src/middleware/logging';
import type { MiddlewareContext } from '../../src/types/middleware';

describe('LoggingMiddleware', () => {
  let middleware: LoggingMiddleware;
  let mockLogger: any;
  let mockContext: MiddlewareContext;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    middleware = new LoggingMiddleware({
      logger: mockLogger,
      logParams: true,
      logResponse: true,
      logTiming: true,
    });

    mockContext = {
      provider: 'test-provider',
      text: '测试文本',
      params: {
        text: '测试文本',
        voice: 'test-voice',
        model: 'test-model',
        format: 'mp3',
      },
      options: { timeout: 5000 },
      startTime: Date.now(),
      requestId: 'test-request-id',
    };
  });

  describe('Logging Configuration', () => {
    it('应该使用默认配置创建中间件', () => {
      const defaultMiddleware = new LoggingMiddleware();
      expect(defaultMiddleware).toBeInstanceOf(LoggingMiddleware);
    });

    it('应该使用自定义配置', () => {
      const customMiddleware = new LoggingMiddleware({
        logParams: false,
        logResponse: false,
        logTiming: true,
        logLevel: 'debug',
      });
      expect(customMiddleware).toBeInstanceOf(LoggingMiddleware);
    });
  });

  describe('Request Logging', () => {
    it('应该记录请求参数', async () => {
      const mockNext = vi.fn().mockResolvedValue({
        id: 'test-id',
        data: 'test-data',
        object: 'tts.audio',
        final: true,
      });

      await middleware.process(mockContext, mockNext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('TTS Request Started:'),
        expect.objectContaining({
          provider: 'test-provider',
          requestId: 'test-request-id',
          text: '测试文本',
          model: 'test-model',
          voice: 'test-voice',
          format: 'mp3',
        }),
      );
    });

    it('应该截断长文本', async () => {
      const longText = 'a'.repeat(200);
      const contextWithLongText = {
        ...mockContext,
        params: { ...mockContext.params, text: longText },
      };

      const mockNext = vi.fn().mockResolvedValue({
        id: 'test-id',
        data: 'test-data',
        object: 'tts.audio',
        final: true,
      });

      await middleware.process(contextWithLongText, mockNext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('TTS Request Started:'),
        expect.objectContaining({
          text: longText.substring(0, 100) + '...',
        }),
      );
    });
  });

  describe('Response Logging', () => {
    it('应该记录成功响应', async () => {
      const mockResponse = {
        id: 'test-id',
        data: 'test-data',
        object: 'tts.audio',
        final: true,
      };

      const mockNext = vi.fn().mockResolvedValue(mockResponse);

      const result = await middleware.process(mockContext, mockNext);

      expect(result).toBe(mockResponse);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('TTS Request Completed:'),
        expect.objectContaining({
          requestId: 'test-request-id',
          success: true,
          responseType: 'UnifiedTTSAudio',
        }),
      );
    });

    it('应该记录时间信息', async () => {
      const mockNext = vi.fn().mockResolvedValue({
        id: 'test-id',
        data: 'test-data',
        object: 'tts.audio',
        final: true,
      });

      await middleware.process(mockContext, mockNext);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('TTS Timing:'),
        expect.objectContaining({
          requestId: 'test-request-id',
          provider: 'test-provider',
          duration: expect.stringMatching(/\d+ms/),
        }),
      );
    });
  });

  describe('Error Logging', () => {
    it('应该记录错误', async () => {
      const testError = new Error('测试错误');
      const mockNext = vi.fn().mockRejectedValue(testError);

      await expect(middleware.process(mockContext, mockNext)).rejects.toThrow('测试错误');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('TTS Request Failed:'),
        expect.objectContaining({
          requestId: 'test-request-id',
          error: '测试错误',
          provider: 'test-provider',
          duration: expect.stringMatching(/\d+ms/),
        }),
      );
    });

    it('应该记录非Error对象的错误', async () => {
      const mockNext = vi.fn().mockRejectedValue('字符串错误');

      await expect(middleware.process(mockContext, mockNext)).rejects.toBe('字符串错误');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('TTS Request Failed:'),
        expect.objectContaining({
          error: '字符串错误',
        }),
      );
    });
  });

  describe('ConsoleLogger', () => {
    let consoleLogger: ConsoleLogger;
    let consoleSpy: any;

    beforeEach(() => {
      consoleLogger = new ConsoleLogger();
      consoleSpy = {
        debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
        info: vi.spyOn(console, 'info').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      };
    });

    it('应该使用console.debug记录debug信息', () => {
      consoleLogger.debug('测试消息', { data: 'test' });
      expect(consoleSpy.debug).toHaveBeenCalledWith('[TTS-DEBUG] 测试消息', { data: 'test' });
    });

    it('应该使用console.info记录info信息', () => {
      consoleLogger.info('测试消息');
      expect(consoleSpy.info).toHaveBeenCalledWith('[TTS-INFO] 测试消息', '');
    });

    it('应该使用console.warn记录warn信息', () => {
      consoleLogger.warn('测试消息');
      expect(consoleSpy.warn).toHaveBeenCalledWith('[TTS-WARN] 测试消息', '');
    });

    it('应该使用console.error记录error信息', () => {
      consoleLogger.error('测试消息');
      expect(consoleSpy.error).toHaveBeenCalledWith('[TTS-ERROR] 测试消息', '');
    });
  });
});
