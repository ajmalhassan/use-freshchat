import { useEffect } from 'react';
import { isBrowser } from '../utils/guards';
import type { FreshchatEvent } from '../types';

export function useFreshchatEvents(
  event: FreshchatEvent,
  handler: (resp?: unknown) => void
) {
  useEffect(() => {
    if (!isBrowser || !window.fcWidget) return;

    window.fcWidget.on(event, handler);

    return () => {
      window.fcWidget?.off?.(event, handler);
    };
  }, [event, handler]);
}
