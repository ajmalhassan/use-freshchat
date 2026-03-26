import { useEffect } from 'react';
import { useFreshchatContext } from '../context/FreshchatContext';
import { isBrowser } from '../utils/guards';
import type { FreshchatEvent } from '../types';

export function useFreshchatEvents(
  event: FreshchatEvent,
  handler: (resp?: unknown) => void
) {
  const { isInitialized } = useFreshchatContext();

  useEffect(() => {
    if (!isBrowser || !isInitialized || !window.fcWidget) return;

    window.fcWidget.on(event, handler);

    return () => {
      window.fcWidget?.off?.(event, handler);
    };
  }, [event, handler, isInitialized]);
}
