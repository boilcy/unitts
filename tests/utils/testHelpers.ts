import type { UnifiedTTSAudio, UnifiedTTSAudioChunk } from '../../src/types/unified';

export function createMockTTSAudio(overrides?: Partial<UnifiedTTSAudio>): UnifiedTTSAudio {
  return {
    id: 'mock-audio-id',
    data: 'mock-base64-audio-data',
    object: 'tts.audio',
    final: true,
    model: 'mock-model',
    ...overrides,
  };
}

export function createMockTTSAudioChunk(overrides?: Partial<UnifiedTTSAudioChunk>): UnifiedTTSAudioChunk {
  return {
    id: 'mock-chunk-id',
    data: 'mock-chunk-data',
    object: 'tts.audio.chunk',
    final: false,
    model: 'mock-model',
    ...overrides,
  };
}

export function createMockTextStream(texts: string[]): AsyncIterable<string> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const text of texts) {
        yield text;
      }
    },
  };
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockAbortSignal(timeoutMs?: number): AbortSignal {
  const controller = new AbortController();
  if (timeoutMs) {
    setTimeout(() => controller.abort(), timeoutMs);
  }
  return controller.signal;
}

export async function collectAsyncIterable<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const item of iterable) {
    results.push(item);
  }
  return results;
}

export function isValidBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

export function validateAudioResponse(audio: UnifiedTTSAudio): void {
  if (!audio.id || typeof audio.id !== 'string') {
    throw new Error('Invalid audio ID');
  }
  if (!audio.data || typeof audio.data !== 'string') {
    throw new Error('Invalid audio data');
  }
  if (audio.object !== 'tts.audio') {
    throw new Error('Invalid audio object type');
  }
  if (typeof audio.final !== 'boolean') {
    throw new Error('Invalid final flag');
  }
}

export function validateAudioChunk(chunk: UnifiedTTSAudioChunk): void {
  if (!chunk.id || typeof chunk.id !== 'string') {
    throw new Error('Invalid chunk ID');
  }
  if (!chunk.data || typeof chunk.data !== 'string') {
    throw new Error('Invalid chunk data');
  }
  if (chunk.object !== 'tts.audio.chunk') {
    throw new Error('Invalid chunk object type');
  }
  if (typeof chunk.final !== 'boolean') {
    throw new Error('Invalid final flag');
  }
}
