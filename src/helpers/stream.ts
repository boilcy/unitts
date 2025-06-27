import type { UnifiedTTSTextChunk } from '../types';

/**
 * Converts an OpenAI stream completion to AsyncIterable<TextChunk>
 *
 * @param stream The OpenAI stream returned from a completion call
 * @returns An AsyncIterable that yields TextChunk objects
 */
export async function* openaiStreamToTextChunks(
  stream: AsyncIterable<any>,
): AsyncGenerator<UnifiedTTSTextChunk> {
  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content || '';
    if (content) {
      yield { text: content };
    }
  }
}

/**
 * Creates a TextChunk AsyncIterable from an OpenAI stream
 *
 * @param stream The OpenAI stream returned from a completion call
 * @returns An AsyncIterable that yields TextChunk objects
 */
export function createTextChunkStream(stream: AsyncIterable<any>): AsyncIterable<UnifiedTTSTextChunk> {
  return {
    [Symbol.asyncIterator]() {
      return openaiStreamToTextChunks(stream);
    },
  };
}
