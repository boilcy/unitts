import type {
  UnifiedTTSParams,
  UnifiedTTSAudio,
  UnifiedTTSAudioChunk,
  UnifiedTTSOptions,
  UnifiedTTSParamsWithoutText,
} from './unified';

// 参数适配器接口
export interface IParameterAdapter<TUnifiedParams, TProviderParams> {
  transform(params: TUnifiedParams): TProviderParams;
  validate(params: TUnifiedParams): void;
}

// 响应适配器接口
export interface IResponseAdapter<TProviderResponse, TUnifiedResponse> {
  transform(response: TProviderResponse): TUnifiedResponse;
}

// 供应商适配器接口
export interface IProviderAdapter<TParams, TResponse, TChunk> {
  getProviderName(): string;

  synthesize(params: UnifiedTTSParams, options?: UnifiedTTSOptions): Promise<UnifiedTTSAudio>;

  synthesizeStream(
    params: UnifiedTTSParams,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<UnifiedTTSAudioChunk>;

  synthesizeIncremental(
    textStream: AsyncIterable<string>,
    params: UnifiedTTSParamsWithoutText,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<UnifiedTTSAudioChunk>;
}
