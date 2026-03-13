'use client';

import { useFreshchatWidget } from 'use-freshchat';

export function ChatButton() {
  const { isLoaded, isOpen, unreadCount, open, close } = useFreshchatWidget();

  if (!isLoaded) return null;

  return (
    <button onClick={() => isOpen ? close() : open()}>
      Chat
      {unreadCount > 0 && <span>{unreadCount}</span>}
    </button>
  );
}
