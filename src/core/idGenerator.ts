import { v4 as uuidv4 } from 'uuid';

class Counter {
  private _lastId = 0;

  next(): string {
    return (++this._lastId).toString();
  }
}

const counter = new Counter();

export function incrementId(): string {
  return counter.next();
}

export class IdGenerator {
  private _prefix: string;
  private _generator: () => string;
  constructor(prefix: string, generator: () => string) {
    this._prefix = prefix;
    this._generator = generator;
  }

  public nextId(): string {
    return this._prefix + this._generator();
  }
}

export const uuidv4Generator = new IdGenerator('id#', uuidv4);
