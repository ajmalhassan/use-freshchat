import { useFreshchatContext } from '../context/FreshchatContext';

export function useFreshchat() {
  const ctx = useFreshchatContext();
  if (ctx === undefined) {
    throw new Error('useFreshchat must be used within a <FreshchatProvider>');
  }
  return ctx;
}
