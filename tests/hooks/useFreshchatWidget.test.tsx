import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFreshchatWidget } from '../../src/hooks/useFreshchatWidget';
import { FreshchatContext } from '../../src/context/FreshchatContext';
import type { FreshchatContextValue } from '../../src/types';
import type { ReactNode } from 'react';

const noop = () => {};
const asyncNoop = async () => {};

function createWrapper(value: FreshchatContextValue) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <FreshchatContext.Provider value={value}>
        {children}
      </FreshchatContext.Provider>
    );
  };
}

function makeContextValue(overrides: Partial<FreshchatContextValue> = {}): FreshchatContextValue {
  return {
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
    ...overrides,
  };
}

describe('useFreshchatWidget', () => {
  it('should return widget state from context', () => {
    const { result } = renderHook(() => useFreshchatWidget(), {
      wrapper: createWrapper(makeContextValue({
        isLoaded: true,
        isOpen: false,
        unreadCount: 3,
      })),
    });

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.unreadCount).toBe(3);
    expect(typeof result.current.open).toBe('function');
    expect(typeof result.current.close).toBe('function');
  });

  it('should throw when used outside FreshchatProvider', () => {
    expect(() => {
      renderHook(() => useFreshchatWidget());
    }).toThrow('must be used within a <FreshchatProvider>');
  });
});
