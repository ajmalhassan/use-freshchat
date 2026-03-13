import { useFreshchatContext } from '../context/FreshchatContext';

export function useFreshchatUser() {
  const { user, isLoggedIn, login, logout, updateUser } = useFreshchatContext();
  if (user === undefined) {
    throw new Error('useFreshchatUser must be used within a <FreshchatProvider>');
  }
  return { user, isLoggedIn, login, logout, updateUser };
}
