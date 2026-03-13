# use-freshchat

Modern React hooks for [Freshchat](https://www.freshworks.com/live-chat-software/). TypeScript-first, SSR-safe, Next.js compatible.

Replaces the abandoned [`react-freshchat`](https://www.npmjs.com/package/react-freshchat) with a hooks-based API, full TypeScript coverage, and proper authentication flows.

## Install

```bash
npm install use-freshchat
```

```bash
pnpm add use-freshchat
```

```bash
yarn add use-freshchat
```

**Peer dependencies:** `react >= 16.8.0`, `react-dom >= 16.8.0`

## Quick Start

Wrap your app with `FreshchatProvider`:

```tsx
import { FreshchatProvider } from 'use-freshchat';

function App() {
  return (
    <FreshchatProvider token="YOUR_FRESHCHAT_TOKEN">
      <YourApp />
    </FreshchatProvider>
  );
}
```

Use hooks anywhere inside the provider:

```tsx
import { useFreshchatWidget } from 'use-freshchat';

function ChatButton() {
  const { isLoaded, isOpen, unreadCount, open, close } = useFreshchatWidget();

  if (!isLoaded) return null;

  return (
    <button onClick={() => (isOpen ? close() : open())}>
      Chat {unreadCount > 0 && `(${unreadCount})`}
    </button>
  );
}
```

## Next.js App Router

```tsx
// app/providers.tsx
'use client';

import { FreshchatProvider } from 'use-freshchat';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FreshchatProvider
      token={process.env.NEXT_PUBLIC_FRESHCHAT_TOKEN!}
      host="https://wchat.freshchat.com"
    >
      {children}
    </FreshchatProvider>
  );
}
```

## Authentication

`use-freshchat` handles the full Freshchat login/logout lifecycle including `restoreId` management for cross-device conversation continuity.

```tsx
import { useFreshchatUser } from 'use-freshchat';

function AuthHandler() {
  const { login, logout, isLoggedIn, user } = useFreshchatUser();

  async function handleLogin() {
    const restoreId = await getRestoreIdFromYourDB(currentUser.id);

    await login({
      externalId: currentUser.id,
      restoreId,
      firstName: currentUser.firstName,
      email: currentUser.email,
      onRestoreIdGenerated: async (newId) => {
        // Freshchat generates this on first login — save it to your DB
        await saveRestoreIdToYourDB(currentUser.id, newId);
      },
    });
  }

  return isLoggedIn ? (
    <button onClick={logout}>Logout ({user?.firstName})</button>
  ) : (
    <button onClick={handleLogin}>Login</button>
  );
}
```

## API

### `<FreshchatProvider>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `token` | `string` | **required** | Your Freshchat token |
| `host` | `string` | `https://wchat.freshchat.com` | Freshchat host URL |
| `locale` | `SupportedLocale` | — | Widget locale |
| `siteId` | `string` | — | Site identifier |
| `tags` | `string[]` | — | Conversation tags |
| `faqTags` | `FaqTagConfig` | — | FAQ tag filtering |
| `config` | `Record<string, unknown>` | — | Raw widget config passthrough |
| `lazyLoad` | `boolean` | `true` | Defer loading with `requestIdleCallback` |
| `debug` | `boolean` | `false` | Log internal events to console |
| `onLoad` | `() => void` | — | Called when widget loads |
| `onOpen` | `() => void` | — | Called when widget opens |
| `onClose` | `() => void` | — | Called when widget closes |
| `onUnreadCount` | `(count: number) => void` | — | Called on unread count change |

### `useFreshchat()`

Returns the full context — all state and actions.

```ts
const {
  isLoaded, isInitialized, isOpen, unreadCount,
  open, close, destroy, track, setTags, setFaqTags, setLocale,
  user, isLoggedIn, login, logout, updateUser,
} = useFreshchat();
```

### `useFreshchatWidget()`

Widget state only — use for custom chat buttons and unread badges.

```ts
const { isLoaded, isOpen, unreadCount, open, close } = useFreshchatWidget();
```

### `useFreshchatUser()`

User state and auth actions only.

```ts
const { user, isLoggedIn, login, logout, updateUser } = useFreshchatUser();
```

### `useFreshchatEvents(event, handler)`

Declarative event subscriptions with automatic cleanup.

```ts
import { useFreshchatEvents } from 'use-freshchat';

useFreshchatEvents('unreadCount:notify', (resp) => {
  console.log('Unread:', resp);
});
```

**Supported events:** `widget:opened`, `widget:closed`, `widget:loaded`, `user:created`, `unreadCount:notify`

### `login(config)`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `externalId` | `string` | yes | Your system's unique user ID |
| `restoreId` | `string` | no | From your DB — restores conversation history |
| `firstName` | `string` | no | |
| `lastName` | `string` | no | |
| `email` | `string` | no | |
| `phone` | `string` | no | |
| `phoneCountryCode` | `string` | no | |
| `meta` | `Record<string, string \| number \| boolean>` | no | Custom properties |
| `onRestoreIdGenerated` | `(restoreId: string) => void \| Promise<void>` | no | Called when Freshchat generates a new restoreId |

### `updateUser(props)`

Update the current user's properties without re-initializing.

```ts
const { updateUser } = useFreshchatUser();

await updateUser({
  firstName: 'Updated',
  meta: { plan: 'enterprise' },
});
```

## Migrating from react-freshchat

| `react-freshchat` | `use-freshchat` |
|---|---|
| `<Freshchat token="..." />` | `<FreshchatProvider token="...">` |
| Class component | Hooks-first |
| No TypeScript | Full TypeScript |
| No auth flow | Built-in login/logout with restoreId |
| No SSR support | SSR-safe, Next.js App Router compatible |
| No event hooks | `useFreshchatEvents` |

## License

MIT
