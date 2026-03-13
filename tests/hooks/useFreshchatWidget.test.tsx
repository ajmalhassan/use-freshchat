import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFreshchatWidget } from '../../src/hooks/useFreshchatWidget';
import { FreshchatContext, defaultContextValue } from '../../src/context/FreshchatContext';
import type { FreshchatContextValue } from '../../src/types';
import type { ReactNode } from 'react';

function createWrapper(value: FreshchatContextValue) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <FreshchatContext.Provider value={value}>
        {children}
      </FreshchatContext.Provider>
    );
  };
}

describe('useFreshchatWidget', () => {
  it('should return widget state from context', () => {
    const { result } = renderHook(() => useFreshchatWidget(), {
      wrapper: createWrapper({
        ...defaultContextValue,
        isLoaded: true,
        isOpen: false,
        unreadCount: 3,
      }),
    });

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.unreadCount).toBe(3);
    expect(typeof result.current.open).toBe('function');
    expect(typeof result.current.close).toBe('function');
  });

  it('should work with default context (outside provider returns defaults)', () => {
    const { result } = renderHook(() => useFreshchatWidget());

    expect(result.current.isLoaded).toBe(false);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.unreadCount).toBe(0);
  });
});
