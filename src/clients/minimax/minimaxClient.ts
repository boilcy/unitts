import WebSocket from 'ws';
import type { IRawTTSClient } from '../../types/clients';
import type { UnifiedTTSOptions } from '../../types/unified';
import type {
  MinimaxTTSParams,
  MinimaxTTSResponse,
  MinimaxTTSChunk,
  WSMinimaxTTSResponse,
} from './minimaxTypes';

export class MinimaxClient implements IRawTTSClient<MinimaxTTSParams, MinimaxTTSResponse, MinimaxTTSChunk> {
  constructor(
    private apiKey: string,
    private groupId: string,
  ) {}

  getProviderName(): string {
    return 'minimax';
  }

  async synthesize(params: MinimaxTTSParams, options?: UnifiedTTSOptions): Promise<MinimaxTTSResponse> {
    const response = await fetch(`https://api.minimax.chat/v1/t2a_v2?GroupId=${this.groupId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        ...options?.headers,
      },
      body: JSON.stringify({ ...params }),
      signal: options?.signal ?? null,
    });

    if (!response.ok) {
      throw new Error(`Minimax API error: ${response.statusText}`);
    }

    const responseJson = (await response.json()) as MinimaxTTSResponse;
    this.validate_base_resp(responseJson);
    return responseJson;
  }

  async *synthesizeStream(
    params: MinimaxTTSParams,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<MinimaxTTSChunk> {
    const response = await fetch(`https://api.minimax.chat/v1/t2a_v2?GroupId=${this.groupId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        ...options?.headers,
      },
      body: JSON.stringify({ ...params, stream: true, stream_options: { exclude_aggregated_audio: true } }),
      signal: options?.signal ?? null,
    });

    if (!response.ok) {
      const error = new Error(`Minimax TTS stream request failed: ${response.status} ${response.statusText}`);
      throw error;
    }

    if (!response.body) {
      const error = new Error('Response body is null');
      throw error;
    }

    const contentType = response.headers.get('content-type') || '';
    const isSSE = contentType.includes('text/event-stream');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      if (isSSE) {
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          if (!event.trim()) continue;
          const lines = event.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.substring(6).trim();
              if (!jsonStr) continue;

              try {
                const chunk = JSON.parse(jsonStr) as MinimaxTTSResponse;
                this.validate_base_resp(chunk);
                yield chunk;
              } catch (e: any) {
                throw e;
              }
            }
          }
        }
      } else {
        try {
          const chunk = JSON.parse(buffer) as MinimaxTTSResponse;
          this.validate_base_resp(chunk);
          yield chunk;
          break;
        } catch (e) {
          throw e;
        }
      }
    }
  }

  async *synthesizeIncremental(
    textStream: AsyncIterable<string>,
    params: MinimaxTTSParams,
    options?: UnifiedTTSOptions,
  ): AsyncGenerator<MinimaxTTSChunk> {
    const signal = options?.signal;

    // WebSocket URL for Minimax TTS
    const wsUrl = 'wss://api.minimax.chat/ws/v1/t2a_v2';

    // Create WebSocket connection
    const ws = new WebSocket(wsUrl, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      signal: signal,
      rejectUnauthorized: false,
    });

    // Set up queue system for incoming chunks
    const chunkQueue: Array<WSMinimaxTTSResponse> = [];
    let resolveNextChunk: ((value: IteratorResult<WSMinimaxTTSResponse, undefined>) => void) | null = null;
    let isComplete = false;
    let hasError = false;
    let error: Error | null = null;

    // Promise for connection established
    let resolveConnected: () => void;
    let rejectConnected: (reason?: any) => void;
    const wsConnected = new Promise<void>((resolve, reject) => {
      resolveConnected = resolve;
      rejectConnected = reject;
    });

    // Handle WebSocket messages
    ws.onmessage = (event: WebSocket.MessageEvent) => {
      try {
        const data = event.data;
        if (typeof data === 'string') {
          const response = JSON.parse(data);

          // Handle connection confirmation
          if (response.event === 'connected_success') {
            resolveConnected();
            return;
          }

          if (response.event === 'task_started') {
          }

          if (response.event === 'task_continued') {
            const chunk = response as WSMinimaxTTSResponse;
            chunkQueue.push(chunk);
            if (resolveNextChunk) {
              const resolve = resolveNextChunk;
              resolveNextChunk = null;
              const chunk = chunkQueue.shift();
              if (chunk) {
                resolve({ value: chunk, done: false });
              }
            }
          }

          if (response.event === 'task_finished') {
            isComplete = true;
            if (ws.readyState === WebSocket.OPEN) {
              ws.close();
            }
          }

          // Handle task failed
          if (response.event === 'task_failed') {
            hasError = true;
            error = new Error(`Minimax TTS task failed: ${response.base_resp.status_msg || 'Unknown error'}`);
            if (ws.readyState === WebSocket.OPEN) {
              ws.close();
            }
          }
        }
      } catch (err) {
        hasError = true;
        error = err instanceof Error ? err : new Error('Failed to parse WebSocket message');
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      }
    };

    // Handle WebSocket close
    ws.onclose = () => {
      isComplete = true;

      // If there's a pending next() call, resolve it as done
      if (resolveNextChunk) {
        const resolve = resolveNextChunk;
        resolveNextChunk = null;
        resolve({ value: undefined, done: true });
      }
    };

    // Handle WebSocket errors
    ws.onerror = (err: any) => {
      hasError = true;
      error = new Error('WebSocket error in Minimax TTS incremental stream');
      rejectConnected(error);

      // If there's a pending next() call, resolve it
      if (resolveNextChunk) {
        const resolve = resolveNextChunk;
        resolveNextChunk = null;
        resolve({ value: undefined, done: true });
      }
    };

    try {
      // Wait for WebSocket connection to open
      await wsConnected;

      // Start the TTS task with initial settings
      const startMessage = {
        event: 'task_start',
        ...params,
      };

      ws.send(JSON.stringify(startMessage));

      // Process the text stream concurrently
      const processTextPromise = (async () => {
        let pendingText = '';
        for await (const textChunk of textStream) {
          if (textChunk && textChunk.trim().length > 0) {
            pendingText += textChunk;

            // Check if we have a complete sentence or significant chunk
            if (pendingText.match(/[.!?。！？]\s*$/) || pendingText.length > 50) {
              // Send accumulated text chunk for synthesis
              const continueMessage = {
                event: 'task_continue',
                text: pendingText,
              };
              ws.send(JSON.stringify(continueMessage));
              pendingText = '';
            }
          }
        }

        // Send any remaining text that didn't end with sentence terminators
        if (pendingText.trim().length > 0) {
          const continueMessage = {
            event: 'task_continue',
            text: pendingText,
          };
          ws.send(JSON.stringify(continueMessage));
        }

        // Send task finish after all text chunks are sent
        ws.send(JSON.stringify({ event: 'task_finish' }));
        ws.close();
      })();

      // Handle errors during text processing
      processTextPromise.catch((err) => {
        hasError = true;
        error = err instanceof Error ? err : new Error('Failed to process text stream');
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ event: 'task_finish' }));
          ws.close();
        }
      });

      // Main loop to yield audio chunks
      while (true) {
        // Yield chunks already in the queue
        if (chunkQueue.length > 0) {
          const chunkData = chunkQueue.shift()!;
          yield this.convert_ws_chunk_to_minimax_chunk(chunkData);
        }
        // Check for completion
        else if (isComplete) {
          break;
        }
        // Check for errors
        else if (hasError) {
          throw error;
        }
        // Wait for next chunk
        else {
          const result = await new Promise<IteratorResult<WSMinimaxTTSResponse, undefined>>((resolve) => {
            resolveNextChunk = resolve;
          });

          if (!result.done && result.value) {
            yield this.convert_ws_chunk_to_minimax_chunk(result.value);
          }
        }
      }
    } catch (err) {
      throw err;
    } finally {
      // Ensure WebSocket is closed
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }
  }

  private validate_base_resp(response: MinimaxTTSResponse) {
    if (response.base_resp.status_code !== 0) {
      throw new Error(`Minimax TTS task failed: ${response.base_resp.status_msg || 'Unknown error'}`);
    }
  }

  private convert_ws_chunk_to_minimax_chunk(chunk: WSMinimaxTTSResponse): MinimaxTTSChunk {
    return chunk as MinimaxTTSChunk;
  }
}
