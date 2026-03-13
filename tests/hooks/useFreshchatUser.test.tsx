import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFreshchatUser } from '../../src/hooks/useFreshchatUser';
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

describe('useFreshchatUser', () => {
  it('should return user state and actions', () => {
    const mockLogin = vi.fn();
    const mockLogout = vi.fn();
    const mockUpdate = vi.fn();

    const { result } = renderHook(() => useFreshchatUser(), {
      wrapper: createWrapper({
        ...defaultContextValue,
        user: { externalId: 'user-1', firstName: 'Jane' },
        isLoggedIn: true,
        login: mockLogin,
        logout: mockLogout,
        updateUser: mockUpdate,
      }),
    });

    expect(result.current.user?.externalId).toBe('user-1');
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.login).toBe(mockLogin);
    expect(result.current.logout).toBe(mockLogout);
    expect(result.current.updateUser).toBe(mockUpdate);
  });

  it('should return null user when not logged in', () => {
    const { result } = renderHook(() => useFreshchatUser(), {
      wrapper: createWrapper(defaultContextValue),
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
  });
});
