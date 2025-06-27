import type { IMiddleware, MiddlewareNext, MiddlewareContext } from '../types/middleware';

export interface LoggingConfig {
  logParams?: boolean;
  logResponse?: boolean;
  logTiming?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  logger?: Logger;
}

export interface Logger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
}

export class ConsoleLogger implements Logger {
  debug(message: string, data?: any): void {
    console.debug(`[TTS-DEBUG] ${message}`, data || '');
  }

  info(message: string, data?: any): void {
    console.info(`[TTS-INFO] ${message}`, data || '');
  }

  warn(message: string, data?: any): void {
    console.warn(`[TTS-WARN] ${message}`, data || '');
  }

  error(message: string, data?: any): void {
    console.error(`[TTS-ERROR] ${message}`, data || '');
  }
}

export class LoggingMiddleware implements IMiddleware {
  private config: Required<LoggingConfig>;

  constructor(config: LoggingConfig = {}) {
    this.config = {
      logParams: true,
      logResponse: true,
      logTiming: true,
      logLevel: 'info',
      logger: new ConsoleLogger(),
      ...config,
    };
  }

  async process<T>(context: MiddlewareContext, next: MiddlewareNext<T>): Promise<T> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // 请求前日志记录
    if (this.config.logParams) {
      this.config.logger.info(`[${timestamp}] TTS Request Started:`, {
        provider: context.provider,
        requestId: context.requestId,
        text: this.truncateText(context.params.text || '', 100),
        model: context.params.model,
        voice: context.params.voice,
        format: context.params.format,
      });
    }

    try {
      // 执行下一个中间件或实际的 TTS 调用
      const result = await next();

      // 响应后日志记录
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (this.config.logResponse) {
        this.config.logger.info(`[${timestamp}] TTS Request Completed:`, {
          requestId: context.requestId,
          duration: `${duration}ms`,
          success: true,
          responseType: this.getResponseType(result),
        });
      }

      if (this.config.logTiming) {
        this.config.logger.debug(`[${timestamp}] TTS Timing:`, {
          requestId: context.requestId,
          duration: `${duration}ms`,
          provider: context.provider,
        });
      }

      return result;
    } catch (error) {
      // 错误日志记录
      const endTime = Date.now();
      const duration = endTime - startTime;

      this.config.logger.error(`[${timestamp}] TTS Request Failed:`, {
        requestId: context.requestId,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
        provider: context.provider,
      });

      throw error;
    }
  }

  private truncateText(text: string, maxLength: number = 100): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  private getResponseType(response: any): string {
    if (!response) return 'null';
    if (typeof response === 'object') {
      if ('id' in response && 'data' in response) return 'UnifiedTTSAudio';
      if (Symbol.asyncIterator in response) return 'AsyncGenerator';
      return 'object';
    }
    return typeof response;
  }
}
