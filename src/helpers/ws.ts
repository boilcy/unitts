import { isBrowser, getRuntimeEnvironment } from './environment';

export function requiresNodeEnvironment(): void {
  if (isBrowser()) {
    throw new Error(
      `浏览器环境下的WebSocket不支持自定义头部。` +
        `当前运行时环境: ${getRuntimeEnvironment()}。` +
        `请在Node.js环境中使用自定义头部功能。`,
    );
  }
}

export interface WebSocketOptions {
  headers?: Record<string, string>;
  protocols?: string | string[];
  timeout?: number;
}

export function hasCustomHeaders(options?: WebSocketOptions): boolean {
  return options?.headers != null && Object.keys(options.headers).length > 0;
}

export function validateWebSocketOptions(options?: WebSocketOptions): void {
  if (hasCustomHeaders(options) && isBrowser()) {
    throw new Error(
      `浏览器环境下的WebSocket不支持自定义头部。` +
        `当前运行时环境: ${getRuntimeEnvironment()}。` +
        `请在Node.js环境中使用自定义头部功能。`,
    );
  }
}

/**
 * 检查WebSocket连接是否需要自定义头部认证
 * @param url WebSocket连接URL
 * @param options WebSocket连接选项
 * @returns 如果需要自定义头部认证返回true，否则返回false
 */
export function requiresCustomHeaders(url: string, options?: WebSocketOptions): boolean {
  // 检查是否有授权头部
  const authHeaders = ['authorization', 'auth', 'x-api-key', 'x-auth-token'];

  if (options?.headers) {
    const headerKeys = Object.keys(options.headers).map((key) => key.toLowerCase());
    return authHeaders.some((authHeader) => headerKeys.includes(authHeader));
  }

  return false;
}

/**
 * 为WebSocket连接创建安全的选项对象
 * 在浏览器环境下自动移除不支持的头部选项
 * @param options 原始WebSocket选项
 * @returns 适合当前运行时环境的WebSocket选项
 */
export function createSafeWebSocketOptions(options?: WebSocketOptions): WebSocketOptions | undefined {
  if (!options) return undefined;

  if (isBrowser()) {
    // 浏览器环境下移除headers
    const { headers, ...safeOptions } = options;
    return Object.keys(safeOptions).length > 0 ? safeOptions : undefined;
  }

  return options;
}

/**
 * 验证并抛出WebSocket兼容性错误
 * @param url WebSocket连接URL
 * @param options WebSocket连接选项
 * @throws Error 当浏览器环境下需要自定义头部时抛出错误
 */
export function validateWebSocketCompatibility(url: string, options?: WebSocketOptions): void {
  if (isBrowser() && requiresCustomHeaders(url, options)) {
    throw new Error(
      `无法在浏览器环境中建立需要自定义头部认证的WebSocket连接。` +
        `URL: ${url}，运行时环境: ${getRuntimeEnvironment()}。` +
        `此功能仅在Node.js环境中可用。`,
    );
  }

  validateWebSocketOptions(options);
}
