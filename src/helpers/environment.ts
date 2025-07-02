export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

export function isNode(): boolean {
  return typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
}

export function isWebWorker(): boolean {
  return (
    typeof importScripts === 'function' && typeof navigator !== 'undefined' && typeof window === 'undefined'
  );
}

export function getRuntimeEnvironment(): 'browser' | 'node' | 'webworker' | 'unknown' {
  if (isBrowser()) return 'browser';
  if (isNode()) return 'node';
  if (isWebWorker()) return 'webworker';
  return 'unknown';
}
