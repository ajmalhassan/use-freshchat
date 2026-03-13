export const isBrowser = typeof window !== 'undefined';

export function withBrowser<T>(fn: () => T): T | undefined {
  if (!isBrowser) return undefined;
  return fn();
}

export function getFcWidget(): Window['fcWidget'] | undefined {
  return withBrowser(() => window.fcWidget);
}
