import { isBrowser } from './environment';

/**
 * 兼容 Node.js 和浏览器环境
 * 将hex字符串转换为Blob
 * @param hexString - 十六进制字符串
 * @param type - Blob类型
 * @returns Blob
 */
export function hexToBlob(hexString: string, type: string): Blob {
  const byteArray = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    byteArray[i / 2] = Number.parseInt(hexString.substring(i, i + 2), 16);
  }
  return new Blob([byteArray], { type });
}

/**
 * 将Blob转换为base64字符串
 * 兼容 Node.js 和浏览器环境
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  if (isBrowser()) {
    const arrayBuffer = await blob.arrayBuffer();
    return uint8ArrayToBase64(new Uint8Array(arrayBuffer));
  } else {
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  }
}

/**
 * 将base64字符串转换为Blob
 */
export function base64ToBlob(base64: string, type: string = 'audio/mp3'): Blob {
  // 移除可能存在的data URL前缀
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

  // Node.js环境
  const buffer = Buffer.from(base64Data || '', 'base64');
  return new Blob([buffer], { type });
}

/**
 * 合并多个音频Blob
 */
export function mergeAudioBlobs(blobs: Blob[], type: string = 'audio/mp3'): Blob {
  return new Blob(blobs, { type });
}

/**
 * 将Uint8Array转换为base64字符串
 * 兼容 Node.js 和浏览器环境
 */
export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  if (isBrowser()) {
    return btoa(String.fromCharCode(...uint8Array));
  } else {
    return Buffer.from(uint8Array).toString('base64');
  }
}

export function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  return uint8ArrayToBase64(new Uint8Array(arrayBuffer));
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  if (isBrowser()) {
    const binaryString = atob(base64Data || '');
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    return uint8Array.buffer;
  } else {
    return Buffer.from(base64Data || '', 'base64').buffer;
  }
}

export function arrayBufferToBlob(arrayBuffer: ArrayBuffer, type: string = 'audio/mp3'): Blob {
  return new Blob([arrayBuffer], { type });
}

export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return await blob.arrayBuffer();
}

export function uint8ArrayToBlob(uint8Array: Uint8Array, type: string = 'audio/mp3'): Blob {
  return new Blob([uint8Array], { type });
}

export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export function arrayBufferToUint8Array(arrayBuffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(arrayBuffer);
}

export function uint8ArrayToArrayBuffer(uint8Array: Uint8Array): ArrayBuffer {
  return uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength);
}

export function hexToArrayBuffer(hexString: string): ArrayBuffer {
  const uint8Array = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    uint8Array[i / 2] = Number.parseInt(hexString.substring(i, i + 2), 16);
  }
  return uint8Array.buffer;
}

export function arrayBufferToHex(arrayBuffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(arrayBuffer);
  return Array.from(uint8Array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function hexToUint8Array(hexString: string): Uint8Array {
  const uint8Array = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    uint8Array[i / 2] = Number.parseInt(hexString.substring(i, i + 2), 16);
  }
  return uint8Array;
}

export function uint8ArrayToHex(uint8Array: Uint8Array): string {
  return Array.from(uint8Array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  if (isBrowser()) {
    const binaryString = atob(base64Data || '');
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    return uint8Array;
  } else {
    return new Uint8Array(Buffer.from(base64Data || '', 'base64'));
  }
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64Data] = dataUrl.split(',');
  const mimeType = header?.match(/data:([^;]+)/)?.[1] || 'application/octet-stream';
  return base64ToBlob(base64Data || '', mimeType);
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  const base64 = await blobToBase64(blob);
  return `data:${blob.type};base64,${base64}`;
}

export function base64ToDataUrl(base64: string, mimeType: string = 'audio/mp3'): string {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  return `data:${mimeType};base64,${base64Data}`;
}

export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1] || '';
}

export function bufferToBlob(buffer: Buffer, type: string = 'audio/mp3'): Blob {
  return new Blob([buffer], { type });
}

export async function blobToBuffer(blob: Blob): Promise<Buffer> {
  if (isBrowser()) {
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } else {
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

export function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  return Buffer.from(base64Data || '', 'base64');
}

export function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

export function arrayBufferToBuffer(arrayBuffer: ArrayBuffer): Buffer {
  return Buffer.from(arrayBuffer);
}

export function stringToArrayBuffer(str: string, encoding: BufferEncoding = 'utf8'): ArrayBuffer {
  if (isBrowser()) {
    const encoder = new TextEncoder();
    return encoder.encode(str).buffer;
  } else {
    return Buffer.from(str, encoding).buffer;
  }
}

export function arrayBufferToString(arrayBuffer: ArrayBuffer, encoding: BufferEncoding = 'utf8'): string {
  if (isBrowser()) {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(arrayBuffer);
  } else {
    return Buffer.from(arrayBuffer).toString(encoding);
  }
}

export function validateAudioFormat(data: unknown): boolean {
  return (
    data instanceof ArrayBuffer ||
    data instanceof Uint8Array ||
    data instanceof Blob ||
    (typeof Buffer !== 'undefined' && data instanceof Buffer) ||
    (typeof data === 'string' &&
      (data.startsWith('data:') || /^[0-9a-fA-F]+$/.test(data) || /^[A-Za-z0-9+/=]+$/.test(data)))
  );
}

export function getAudioMimeType(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);

  if (uint8Array.length >= 3 && uint8Array[0] === 0xff && (uint8Array[1]! & 0xe0) === 0xe0) {
    return 'audio/mpeg';
  }

  // WAV
  if (
    uint8Array.length >= 12 &&
    uint8Array[0] === 0x52 &&
    uint8Array[1] === 0x49 &&
    uint8Array[2] === 0x46 &&
    uint8Array[3] === 0x46 &&
    uint8Array[8] === 0x57 &&
    uint8Array[9] === 0x41 &&
    uint8Array[10] === 0x56 &&
    uint8Array[11] === 0x45
  ) {
    return 'audio/wav';
  }

  // OGG
  if (
    uint8Array.length >= 4 &&
    uint8Array[0] === 0x4f &&
    uint8Array[1] === 0x67 &&
    uint8Array[2] === 0x67 &&
    uint8Array[3] === 0x53
  ) {
    return 'audio/ogg';
  }

  // FLAC
  if (
    uint8Array.length >= 4 &&
    uint8Array[0] === 0x66 &&
    uint8Array[1] === 0x4c &&
    uint8Array[2] === 0x61 &&
    uint8Array[3] === 0x43
  ) {
    return 'audio/flac';
  }

  // M4A/AAC
  if (
    uint8Array.length >= 8 &&
    uint8Array[4] === 0x66 &&
    uint8Array[5] === 0x74 &&
    uint8Array[6] === 0x79 &&
    uint8Array[7] === 0x70
  ) {
    return 'audio/mp4';
  }

  return 'audio/mpeg'; // Default to MP3
}
