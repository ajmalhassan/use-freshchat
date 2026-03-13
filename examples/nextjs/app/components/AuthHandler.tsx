'use client';

import { useFreshchatUser } from 'use-freshchat';

export function AuthHandler() {
  const { login, logout, isLoggedIn, user } = useFreshchatUser();

  async function handleLogin() {
    // restoreId should come from your own DB
    // const restoreId = await myDB.getFreshchatRestoreId(currentUser.id);

    await login({
      externalId: 'user-123',
      // restoreId,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      meta: { plan: 'pro' },
      onRestoreIdGenerated: async (newId) => {
        // Save back to your DB so next login restores conversation
        console.log('Save restoreId to DB:', newId);
      },
    });
  }

  return (
    <div>
      {isLoggedIn ? (
        <button onClick={logout}>Logout ({user?.firstName})</button>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
