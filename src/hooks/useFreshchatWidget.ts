import { useFreshchatContext } from '../context/FreshchatContext';

export function useFreshchatWidget() {
  const { isLoaded, isOpen, unreadCount, open, close } = useFreshchatContext();
  return { isLoaded, isOpen, unreadCount, open, close };
}
