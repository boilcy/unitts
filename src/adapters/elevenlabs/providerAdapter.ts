import { ElevenLabsClient } from '../../clients/elevenlabs/elevenlabsClient';
import {
  UnifiedTTSAudio,
  UnifiedTTSOptions,
  UnifiedTTSParams,
  UnifiedTTSAudioChunk,
  UnifiedTTSParamsWithoutText,
} from '../../types/unified';
import { IProviderAdapter } from '../../types/adapters';
import { ElevenLabsParameterAdapter } from './parameterAdapter';
import { ElevenLabsUnifiedResponseAdapter } from './responseAdapter';
import type {
  TextToSpeechRequestWithTimestamps,
  TextToSpeechRequestWithoutTimestamps,
  StreamTextToSpeechRequestWithTimestamps,
  StreamTextToSpeechRequestWithoutTimestamps,
} from '../../clients/elevenlabs/elevenlabsTypes';
import type { ElevenLabs } from '@elevenlabs/elevenlabs-js';

export class ElevenLabsProviderAdapter implements IProviderAdapter {
  private client: ElevenLabsClient;
  private parameterAdapter: ElevenLabsParameterAdapter;
  private responseAdapter: ElevenLabsUnifiedResponseAdapter;

  constructor(apiKey: string) {
    this.client = new ElevenLabsClient(apiKey);
    this.parameterAdapter = new ElevenLabsParameterAdapter();
    this.responseAdapter = new ElevenLabsUnifiedResponseAdapter();
  }

  getProviderName(): string {
    return 'elevenlabs';
  }

  async synthesize(params: UnifiedTTSParams, options?: UnifiedTTSOptions): Promise<UnifiedTTSAudio> {
    // 1. 验证和转换参数
    this.parameterAdapter.validate(params);
    const providerParams = this.parameterAdapter.transform(params);

    // 2. 根据 withTimestamps 参数调用不同的方法
    if (providerParams.withTimestamps === true) {
      // 带 timestamps 的请求
      const timestampParams = providerParams as TextToSpeechRequestWithTimestamps;
      const rawResponse = await this.client.synthesize(timestampParams, options);
      return await this.responseAdapter.transformSynthesizeResponse(rawResponse);
    } else {
      // 不带 timestamps 的请求
      const noTimestampParams = providerParams as TextToSpeechRequestWithoutTimestamps;
      const rawResponse = await this.client.synthesize(noTimestampParams, options);
      return await this.responseAdapter.transformSynthesizeResponse(rawResponse);
    }
  }

  async *synthesizeStream(
    params: UnifiedTTSParams,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<UnifiedTTSAudioChunk> {
    // 1. 验证和转换参数
    this.parameterAdapter.validate(params);
    const providerParams = this.parameterAdapter.transform(params);

    // 2. 根据 withTimestamps 参数调用不同的方法
    if (providerParams.withTimestamps === true) {
      // 带 timestamps 的流式请求
      const timestampParams = providerParams as StreamTextToSpeechRequestWithTimestamps;
      const rawStream = this.client.synthesizeStream(timestampParams, options);

      for await (const rawChunk of rawStream) {
        yield this.responseAdapter.transformStreamChunk(rawChunk);
      }
    } else {
      // 不带 timestamps 的流式请求
      const noTimestampParams = providerParams as StreamTextToSpeechRequestWithoutTimestamps;
      const rawStream = this.client.synthesizeStream(noTimestampParams, options);

      for await (const rawChunk of rawStream) {
        yield this.responseAdapter.transformStreamChunk(rawChunk);
      }
    }
  }

  async *synthesizeIncremental(
    textStream: AsyncIterable<string>,
    params: UnifiedTTSParamsWithoutText,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<UnifiedTTSAudioChunk> {
    // 1. 验证和转换参数
    this.parameterAdapter.validate({ ...params, text: '' });
    const baseParams = this.parameterAdapter.transform({ ...params, text: '' });

    // 2. 转换为 incremental 方法需要的类型
    const { voiceId, ...restParams } = baseParams;
    const providerParams: { voiceId: string } & ElevenLabs.TextToSpeechRequest = {
      voiceId,
      ...restParams,
    };

    // 3. 获取原始流（ElevenLabs incremental 总是返回带 timestamps 的数据）
    const rawStream = this.client.synthesizeIncremental(textStream, providerParams, options);

    // 4. 转换每个 chunk
    for await (const rawChunk of rawStream) {
      yield this.responseAdapter.transformStreamChunk(rawChunk);
    }
  }
}
