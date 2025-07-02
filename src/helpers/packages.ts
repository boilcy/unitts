export function checkElevenLabsPackage(): void {
  try {
    require('@elevenlabs/elevenlabs-js');
  } catch (error) {
    throw new Error(
      '@elevenlabs/elevenlabs-js 未安装。请在Node.js环境中运行: pnpm install @elevenlabs/elevenlabs-js',
    );
  }
}
