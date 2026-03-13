import { FreshchatProvider, useFreshchatWidget, useFreshchatUser } from 'use-freshchat';

function ChatButton() {
  const { isLoaded, isOpen, unreadCount, open, close } = useFreshchatWidget();

  if (!isLoaded) return null;

  return (
    <button onClick={() => isOpen ? close() : open()}>
      Chat {unreadCount > 0 && `(${unreadCount})`}
    </button>
  );
}

function UserInfo() {
  const { user, isLoggedIn, login, logout } = useFreshchatUser();

  return (
    <div>
      {isLoggedIn ? (
        <>
          <p>Logged in as {user?.firstName}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={() => login({ externalId: 'user-1', firstName: 'Demo' })}>
          Login
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <FreshchatProvider token="YOUR_TOKEN" debug>
      <h1>Vite + use-freshchat Demo</h1>
      <ChatButton />
      <UserInfo />
    </FreshchatProvider>
  );
}
