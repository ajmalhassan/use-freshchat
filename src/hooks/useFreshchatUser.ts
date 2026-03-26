import { useFreshchatContext } from '../context/FreshchatContext';
import type { FreshchatUserState } from '../types';

export function useFreshchatUser(): FreshchatUserState & {
  login: ReturnType<typeof useFreshchatContext>['login'];
  logout: ReturnType<typeof useFreshchatContext>['logout'];
  updateUser: ReturnType<typeof useFreshchatContext>['updateUser'];
} {
  const { user, isLoggedIn, login, logout, updateUser } = useFreshchatContext();
  return { user, isLoggedIn, login, logout, updateUser } as FreshchatUserState & {
    login: typeof login;
    logout: typeof logout;
    updateUser: typeof updateUser;
  };
}
