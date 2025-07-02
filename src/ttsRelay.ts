import { uuidv4Generator } from './core/idGenerator';
import type { IProviderAdapter } from './types/adapters';
import type { IMiddleware, MiddlewareContext } from './types/middleware';
import type {
  ProviderName,
  UnifiedTTSParams,
  UnifiedTTSAudio,
  UnifiedTTSAudioChunk,
  UnifiedTTSOptions,
  UnifiedTTSParamsWithoutText,
} from './types/unified';

export class TTSRelay {
  private adapters: Map<ProviderName, IProviderAdapter> = new Map();
  private middleware: IMiddleware[] = [];

  registerAdapter<P extends ProviderName>(providerName: P, adapter: IProviderAdapter): void {
    this.adapters.set(providerName, adapter);
  }

  use(middleware: IMiddleware): void {
    this.middleware.push(middleware);
  }

  async synthesize<P extends ProviderName>(
    provider: P,
    params: UnifiedTTSParams<P>,
    options?: UnifiedTTSOptions,
  ): Promise<UnifiedTTSAudio>;

  async synthesize(
    provider: ProviderName,
    params: UnifiedTTSParams<ProviderName>,
    options?: UnifiedTTSOptions,
  ): Promise<UnifiedTTSAudio>;

  async synthesize<P extends ProviderName>(
    provider: P,
    params: UnifiedTTSParams<P>,
    options?: UnifiedTTSOptions,
  ): Promise<UnifiedTTSAudio> {
    const adapter = this.getAdapter(provider as ProviderName);
    const context = this.createContext(provider, params, options);

    // 使用洋葱模型执行中间件
    return this.executeMiddleware(context, async () => {
      return adapter.synthesize(context.params, context.options);
    });
  }

  async *synthesizeStream<P extends ProviderName>(
    provider: P,
    params: UnifiedTTSParams<P>,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<UnifiedTTSAudioChunk> {
    const adapter = this.getAdapter(provider);
    const context = this.createContext(provider, params, options);

    // 使用洋葱模型执行中间件
    const result = await this.executeMiddleware(context, async () => {
      return adapter.synthesizeStream(context.params, context.options);
    });

    yield* result;
  }

  async *synthesizeIncremental<P extends ProviderName>(
    provider: P,
    textStream: AsyncIterable<string>,
    params: UnifiedTTSParamsWithoutText<P>,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<UnifiedTTSAudioChunk> {
    const adapter = this.getAdapter(provider);
    const fullParams = { ...params, text: '' };
    const context = this.createContext(provider, fullParams, options, textStream);

    // 使用洋葱模型执行中间件
    const result = await this.executeMiddleware(context, async () => {
      const { text, ...paramsWithoutText } = context.params;
      return adapter.synthesizeIncremental(textStream, paramsWithoutText, context.options);
    });

    yield* result;
  }

  listProviders(): ProviderName[] {
    return Array.from(this.adapters.keys());
  }

  private getAdapter<P extends ProviderName>(provider: P): IProviderAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Provider '${provider}' not found`);
    }
    return adapter;
  }

  private createContext(
    provider: string,
    params: UnifiedTTSParams<any>,
    options?: UnifiedTTSOptions,
    textStream?: AsyncIterable<string>,
  ): MiddlewareContext {
    return {
      provider,
      text: params.text,
      textStream: textStream,
      params,
      options,
      startTime: Date.now(),
      requestId: uuidv4Generator.nextId(),
    };
  }

  private async executeMiddleware<T>(context: MiddlewareContext, finalHandler: () => Promise<T>): Promise<T> {
    // 创建洋葱模型的执行链
    let index = -1;

    const dispatch = async (i: number): Promise<T> => {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      if (i === this.middleware.length) {
        // 执行最终的处理函数（实际的 TTS 调用）
        return finalHandler();
      }

      const middleware = this.middleware[i];
      if (!middleware) {
        throw new Error('Middleware not found');
      }
      return middleware.process(context, () => dispatch(i + 1));
    };

    return dispatch(0);
  }
}
