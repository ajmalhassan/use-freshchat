import { createContext, useContext } from 'react';
import type { FreshchatContextValue } from '../types';

export const FreshchatContext = createContext<FreshchatContextValue | null>(null);

export function useFreshchatContext(): FreshchatContextValue {
  const ctx = useContext(FreshchatContext);
  if (ctx === null) {
    throw new Error(
      'useFreshchat/useFreshchatUser/useFreshchatWidget must be used within a <FreshchatProvider>'
    );
  }
  return ctx;
}
