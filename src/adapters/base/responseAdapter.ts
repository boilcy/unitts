import { uuidv4Generator } from '../../core/idGenerator';
import type { IResponseAdapter } from '../../types/adapters';

export abstract class BaseResponseAdapter<TProvider, TUnified>
  implements IResponseAdapter<TProvider, TUnified>
{
  abstract transform(response: TProvider, requestId?: string): TUnified;

  protected generateId(): string {
    return uuidv4Generator.nextId();
  }
}
