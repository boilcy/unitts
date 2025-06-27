import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MinimaxClient } from '../../src/clients/minimax/minimaxClient';
import { testConfig } from '../setup';
import { MinimaxTTSParams } from 'unitts/clients/minimax';

describe('MinimaxClient', () => {
  let client: MinimaxClient;

  beforeEach(() => {
    client = new MinimaxClient(
      testConfig.MINIMAX_API_KEY || 'test-key',
      testConfig.MINIMAX_GROUP_ID || 'test-group',
    );
  });

  describe('Basic Properties', () => {
    it('应该返回正确的提供商名称', () => {
      expect(client.getProviderName()).toBe('minimax');
    });

    it('应该能够创建客户端实例', () => {
      expect(client).toBeInstanceOf(MinimaxClient);
    });
  });

  describe('Synthesize Method', () => {
    it('应该能够合成文本', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过Minimax客户端API测试 - 缺少API密钥');
        return;
      }

      const params = {
        text: '测试文本合成',
        model: 'speech-02-hd' as const,
        voice_setting: {
          voice_id: 'female-tianmei' as const,
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
          emotion: 'neutral' as const,
        },
        audio_setting: {
          format: 'mp3' as const,
          sample_rate: 22050 as const,
        },
      };

      const result = await client.synthesize(params);

      expect(result).toHaveProperty('base_resp');
      expect(result.base_resp.status_code).toBe(0);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('audio');
      expect(typeof result.data?.audio).toBe('string');
    });

    it('应该处理API错误', async () => {
      const invalidClient = new MinimaxClient('invalid-key', 'invalid-group');

      const params = {
        text: '测试文本',
        model: 'speech-02-hd' as const,
        voice_setting: {
          voice_id: 'female-tianmei' as const,
        },
      };

      await expect(invalidClient.synthesize(params)).rejects.toThrow();
    });

    it('应该支持超时选项', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过Minimax超时测试 - 缺少API密钥');
        return;
      }

      const params = {
        text: '测试超时',
        model: 'speech-02-hd' as const,
        voice_setting: {
          voice_id: 'female-tianmei' as const,
        },
      };

      const abortController = new AbortController();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          abortController.abort();
          reject(new Error('测试超时'));
        }, 1);
      });

      await expect(
        Promise.race([client.synthesize(params, { signal: abortController.signal }), timeoutPromise]),
      ).rejects.toThrow();
    });
  });

  describe('Stream Synthesis', () => {
    it('应该能够流式合成文本', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过Minimax流式客户端测试 - 缺少API密钥');
        return;
      }

      const params = {
        text: '这是流式合成测试文本，内容稍长一些以确保能够产生多个音频块。',
        model: 'speech-02-hd' as const,
        voice_setting: {
          voice_id: 'female-tianmei' as const,
          speed: 1.0,
          vol: 1.0,
        },
        audio_setting: {
          format: 'mp3' as const,
          sample_rate: 22050 as const,
        },
        stream: true,
      };

      const chunks = [];
      for await (const chunk of client.synthesizeStream(params)) {
        chunks.push(chunk);
        expect(chunk).toHaveProperty('base_resp');
        expect(chunk).toHaveProperty('data');

        if (chunk.data) {
          expect(chunk.data).toHaveProperty('audio');
          expect(typeof chunk.data.audio).toBe('string');
        }
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('应该处理流式API错误', async () => {
      const invalidClient = new MinimaxClient('invalid-key', 'invalid-group');

      const params: MinimaxTTSParams = {
        text: '测试文本',
        model: 'speech-02-hd' as const,
        voice_setting: {
          voice_id: 'female-tianmei' as const,
        },
        stream: true,
      };

      const streamIterator = invalidClient.synthesizeStream(params);
      await expect(streamIterator.next()).rejects.toThrow();
    });
  });

  describe('Incremental Synthesis', () => {
    it('应该能够增量合成文本', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过Minimax增量客户端测试 - 缺少API密钥');
        return;
      }

      async function* textStream() {
        yield '这是';
        yield '一个';
        yield '增量';
        yield '文本';
        yield '合成';
        yield '测试';
      }

      const params = {
        voice_setting: {
          voice_id: 'female-tianmei' as const,
          speed: 1.0,
        },
        audio_setting: {
          format: 'mp3' as const,
          sample_rate: 22050 as const,
        },
        model: 'speech-02-hd' as const,
      };

      const chunks = [];
      for await (const chunk of client.synthesizeIncremental(textStream(), { ...params, text: 'test' })) {
        chunks.push(chunk);
        expect(chunk).toHaveProperty('base_resp');
        expect(chunk).toHaveProperty('data');
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('应该正确组合文本流', async () => {
      if (!testConfig.MINIMAX_API_KEY || !testConfig.MINIMAX_GROUP_ID) {
        console.log('跳过Minimax文本组合测试 - 缺少API密钥');
        return;
      }

      async function* textStream() {
        yield '第一部分，';
        yield '第二部分，';
        yield '第三部分。';
      }

      const params = {
        voice_setting: {
          voice_id: 'female-tianmei' as const,
        },
        model: 'speech-02-hd' as const,
      };

      const chunks = [];
      for await (const chunk of client.synthesizeIncremental(textStream(), { ...params, text: 'test' })) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Request Headers', () => {
    it('应该支持自定义请求头', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            base_resp: { status_code: 0, status_msg: 'success' },
            data: { audio: 'mock-data', status: 2 },
            trace_id: 'test-id',
          }),
      });

      global.fetch = mockFetch;

      const params = {
        text: '测试自定义头',
        model: 'speech-02-hd' as const,
      };

      const options = {
        headers: {
          'Custom-Header': 'test-value',
          'X-Request-ID': 'custom-request-id',
        },
      };

      await client.synthesize(params, options);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.minimax.chat'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Custom-Header': 'test-value',
            'X-Request-ID': 'custom-request-id',
            'Content-Type': 'application/json',
            Authorization: expect.stringContaining('Bearer'),
          }),
        }),
      );
    });
  });
});
