import type { IParameterAdapter } from '../../types/adapters';

export abstract class BaseParameterAdapter<TUnified, TProvider>
  implements IParameterAdapter<TUnified, TProvider>
{
  abstract transform(params: TUnified): TProvider;

  validate(params: TUnified): void {
    if (!params) {
      throw new Error('Parameters cannot be null or undefined');
    }
  }

  protected removeUndefinedFields<T extends Record<string, any>>(obj: T): T {
    const result = {} as T;
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const cleaned = this.removeUndefinedFields(value);
          if (Object.keys(cleaned).length > 0) {
            result[key as keyof T] = cleaned;
          }
        } else {
          result[key as keyof T] = value;
        }
      }
    }
    return result;
  }
}
