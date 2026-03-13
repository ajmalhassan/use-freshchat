import { createContext, useContext } from 'react';
import type { FreshchatContextValue } from '../types';

const noop = () => {};
const asyncNoop = async () => {};

export const defaultContextValue: FreshchatContextValue = {
  isLoaded: false,
  isInitialized: false,
  isOpen: false,
  unreadCount: 0,
  open: noop,
  close: noop,
  destroy: noop,
  track: noop,
  setTags: noop,
  setFaqTags: noop,
  setLocale: noop,
  user: null,
  isLoggedIn: false,
  login: asyncNoop,
  logout: asyncNoop,
  updateUser: asyncNoop,
};

export const FreshchatContext = createContext<FreshchatContextValue>(defaultContextValue);

export function useFreshchatContext(): FreshchatContextValue {
  return useContext(FreshchatContext);
}
