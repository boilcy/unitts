import { UnifiedTTSOptions } from './unified';

// 原始客户端接口 - 只处理provider特定的API
export interface IRawTTSClient<TParams, TResponse, TChunk> {
  getProviderName(): string;

  // 批量合成 - 返回provider原始响应
  synthesize(params: TParams, options?: UnifiedTTSOptions): Promise<TResponse>;

  // 流式合成 - 返回provider原始流
  synthesizeStream(params: TParams, options?: UnifiedTTSOptions): AsyncGenerator<TChunk>;

  // 增量合成 - 返回provider原始流
  synthesizeIncremental(
    textStream: AsyncIterable<string>,
    params: TParams,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<TChunk>;
}
