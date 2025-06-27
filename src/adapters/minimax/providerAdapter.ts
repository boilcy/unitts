import { BaseProviderAdapter } from '../base/providerAdapter';
import { MinimaxClient } from '../../clients/minimax/minimaxClient';
import { MinimaxParameterAdapter } from './parameterAdapter';
import { MinimaxResponseAdapter, MinimaxChunkAdapter } from './responseAdapter';
import type {
  MinimaxTTSParams,
  MinimaxTTSResponse,
  MinimaxTTSChunk,
} from '../../clients/minimax/minimaxTypes';

export class MinimaxProviderAdapter extends BaseProviderAdapter<
  MinimaxTTSParams,
  MinimaxTTSResponse,
  MinimaxTTSChunk
> {
  constructor(apiKey: string, groupId: string) {
    const client = new MinimaxClient(apiKey, groupId);
    const parameterAdapter = new MinimaxParameterAdapter();
    const responseAdapter = new MinimaxResponseAdapter();
    const chunkAdapter = new MinimaxChunkAdapter();

    super(client, parameterAdapter, responseAdapter, chunkAdapter);
  }
}
