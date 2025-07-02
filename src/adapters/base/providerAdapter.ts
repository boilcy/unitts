import type { IProviderAdapter, IParameterAdapter, IResponseAdapter } from '../../types/adapters';
import type {
  UnifiedTTSParams,
  UnifiedTTSAudio,
  UnifiedTTSAudioChunk,
  UnifiedTTSOptions,
  UnifiedTTSParamsWithoutText,
} from '../../types/unified';
import type { IRawTTSClient } from '../../types/clients';

export abstract class BaseProviderAdapter<TParams, TResponse, TChunk> implements IProviderAdapter {
  constructor(
    protected client: IRawTTSClient<TParams, TResponse, TChunk>,
    protected parameterAdapter: IParameterAdapter<UnifiedTTSParams, TParams>,
    protected responseAdapter: IResponseAdapter<TResponse, UnifiedTTSAudio>,
    protected chunkAdapter: IResponseAdapter<TChunk, UnifiedTTSAudioChunk>,
  ) {}

  getProviderName(): string {
    return this.client.getProviderName();
  }

  async synthesize(params: UnifiedTTSParams, options?: UnifiedTTSOptions): Promise<UnifiedTTSAudio> {
    // 1. 验证和转换参数
    this.parameterAdapter.validate(params);
    const providerParams = this.parameterAdapter.transform(params);

    // 2. 调用原始客户端
    const rawResponse = await this.client.synthesize(providerParams, options);

    // 3. 转换响应
    return this.responseAdapter.transform(rawResponse);
  }

  async *synthesizeStream(
    params: UnifiedTTSParams,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<UnifiedTTSAudioChunk> {
    // 1. 验证和转换参数
    this.parameterAdapter.validate(params);
    const providerParams = this.parameterAdapter.transform(params);

    // 2. 获取原始流
    const rawStream = this.client.synthesizeStream(providerParams, options);

    // 3. 转换每个chunk
    for await (const rawChunk of rawStream) {
      yield this.chunkAdapter.transform(rawChunk);
    }
  }

  async *synthesizeIncremental(
    textStream: AsyncIterable<string>,
    params: UnifiedTTSParamsWithoutText,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<UnifiedTTSAudioChunk> {
    // 1. 验证和转换参数
    this.parameterAdapter.validate({ ...params, text: '' });
    const providerParams = this.parameterAdapter.transform({ ...params, text: '' });

    // 2. 获取原始流
    const rawStream = this.client.synthesizeIncremental(textStream, providerParams, options);

    // 3. 转换每个chunk
    for await (const rawChunk of rawStream) {
      yield this.chunkAdapter.transform(rawChunk);
    }
  }
}
