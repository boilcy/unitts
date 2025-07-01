import { BaseProviderAdapter } from '../base/providerAdapter';
import { TencentClient } from '../../clients/tencent/tencentClient';
import { TencentParameterAdapter } from './parameterAdapter';
import { TencentResponseAdapter, TencentChunkAdapter } from './responseAdapter';
import type {
  TencentAuth,
  TencentTTSParams,
  TencentTTSResponse,
  TencentTTSChunk,
} from '../../clients/tencent/tencentTypes';

export class TencentProviderAdapter extends BaseProviderAdapter<
  TencentTTSParams,
  TencentTTSResponse,
  TencentTTSChunk
> {
  constructor(auth: TencentAuth) {
    const client = new TencentClient(auth);
    const parameterAdapter = new TencentParameterAdapter();
    const responseAdapter = new TencentResponseAdapter();
    const chunkAdapter = new TencentChunkAdapter();

    super(client, parameterAdapter, responseAdapter, chunkAdapter);
  }
}
