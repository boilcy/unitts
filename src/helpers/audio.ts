// Helper function to convert hex to blob
export function hexToBlob(hexString: string, type: string): Blob {
  const byteArray = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    byteArray[i / 2] = Number.parseInt(hexString.substring(i, i + 2), 16);
  }
  return new Blob([byteArray], { type });
}

/**
 * 将Blob转换为base64字符串
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  // Node.js环境
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
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
