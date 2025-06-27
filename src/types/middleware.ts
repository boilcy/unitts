import { UnifiedTTSOptions, UnifiedTTSParams } from './unified';

// 中间件上下文
export interface MiddlewareContext {
  provider: string;
  text?: string;
  textStream?: AsyncIterable<string> | undefined;
  params: UnifiedTTSParams<any>;
  options?: UnifiedTTSOptions | undefined;
  startTime: number;
  requestId: string;
}

// 中间件执行结果（请求阶段）
export interface MiddlewareResult {
  params: UnifiedTTSParams<any>;
  options?: UnifiedTTSOptions;
}

// 中间件响应结果（响应阶段）
export interface MiddlewareResponse<T = any> {
  response: T;
  context: MiddlewareContext;
}

// Next 函数类型，执行下一个中间件或实际的 TTS 调用
export type MiddlewareNext<T = any> = () => Promise<T>;

// 中间件接口 - 洋葱模型
export interface IMiddleware {
  process<T>(context: MiddlewareContext, next: MiddlewareNext<T>): Promise<T>;
}
