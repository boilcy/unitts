// Helper function to convert hex to blob
export function hexToBlob(hexString: string, type: string): Blob {
  const byteArray = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    byteArray[i / 2] = Number.parseInt(hexString.substring(i, i + 2), 16);
  }
  return new Blob([byteArray], { type });
}
