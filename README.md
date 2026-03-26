# use-freshchat

[![npm](https://img.shields.io/npm/v/use-freshchat)](https://www.npmjs.com/package/use-freshchat)
[![bundle size](https://img.shields.io/bundlephobia/minzip/use-freshchat)](https://bundlephobia.com/package/use-freshchat)
[![license](https://img.shields.io/npm/l/use-freshchat)](https://github.com/ajmalhassan/use-freshchat/blob/main/LICENSE)

React hooks for [Freshchat](https://www.freshworks.com/live-chat-software/). TypeScript-first, SSR-safe, works with Next.js App Router.

A modern replacement for [`react-freshchat`](https://www.npmjs.com/package/react-freshchat) (abandoned, class-based, no TypeScript).

## Features

- **Hooks-first** -- `useFreshchat`, `useFreshchatUser`, `useFreshchatWidget`, `useFreshchatEvents`
- **Full TypeScript** -- discriminated unions, strict types, no `any`
- **Auth built-in** -- login, logout, `restoreId` management for cross-device conversation continuity
- **SSR-safe** -- no `window` access on server, `'use client'` directive in output
- **Tiny** -- ~2.5 KB gzipped, zero dependencies, tree-shakeable
- **Lazy loading** -- defers widget script via `requestIdleCallback` by default

## Install

```bash
npm install use-freshchat
```

**Peer dependencies:** React >= 16.8.0

## Quick Start

```tsx
import { FreshchatProvider, useFreshchatWidget } from 'use-freshchat';

function ChatButton() {
  const { isLoaded, isOpen, unreadCount, open, close } = useFreshchatWidget();
  if (!isLoaded) return null;

  return (
    <button onClick={() => (isOpen ? close() : open())}>
      Chat {unreadCount > 0 && `(${unreadCount})`}
    </button>
  );
}

function App() {
  return (
    <FreshchatProvider token="YOUR_TOKEN">
      <ChatButton />
    </FreshchatProvider>
  );
}
```

## Next.js App Router

Create a client wrapper -- don't put `'use client'` on your root layout:

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

```tsx
// app/layout.tsx (stays a Server Component)
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Authentication

The library handles the full Freshchat login/logout lifecycle including automatic `restoreId` capture for cross-device conversation continuity.

```tsx
import { useFreshchatUser } from 'use-freshchat';

function AuthHandler() {
  const { login, logout, isLoggedIn, user } = useFreshchatUser();

  async function handleLogin() {
    const restoreId = await db.getFreshchatRestoreId(currentUser.id);

    await login({
      externalId: currentUser.id,
      restoreId,
      firstName: currentUser.firstName,
      email: currentUser.email,
      onRestoreIdGenerated: async (newId) => {
        // Freshchat generates this on first login -- save it
        await db.saveFreshchatRestoreId(currentUser.id, newId);
      },
    });
  }

  if (isLoggedIn) {
    // `user` is narrowed to `FreshchatUser` here (not null)
    return <button onClick={logout}>Logout ({user.firstName})</button>;
  }

  return <button onClick={handleLogin}>Login</button>;
}
```

### How restoreId works

1. User logs in for the first time -- Freshchat creates a user and generates a `restoreId`
2. Your `onRestoreIdGenerated` callback fires -- save this ID to your database
3. On subsequent logins (same or different device), pass the saved `restoreId` to `login()`
4. Freshchat restores the full conversation history

## API Reference

### `<FreshchatProvider>`

Wrap your app with this component. All hooks must be used within it.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `token` | `string` | **required** | Freshchat token |
| `host` | `string` | `https://wchat.freshchat.com` | Freshchat host URL |
| `locale` | `SupportedLocale` | -- | Widget locale (34 locales supported) |
| `siteId` | `string` | -- | Site identifier |
| `tags` | `string[]` | -- | Conversation tags |
| `faqTags` | `FaqTagConfig` | -- | FAQ tag filtering |
| `config` | `Record<string, unknown>` | -- | Raw Freshchat widget config passthrough |
| `lazyLoad` | `boolean` | `true` | Defer script loading with `requestIdleCallback` |
| `debug` | `boolean` | `false` | Log internal state transitions to console |
| `onLoad` | `() => void` | -- | Called when widget finishes loading |
| `onOpen` | `() => void` | -- | Called when widget opens |
| `onClose` | `() => void` | -- | Called when widget closes |
| `onUnreadCount` | `(count: number) => void` | -- | Called when unread count changes |

### `useFreshchat()`

Full API surface. Use when you need everything.

```ts
const {
  // Widget state
  isLoaded, isInitialized, isOpen, unreadCount,
  // Widget controls
  open, close, destroy, track, setTags, setFaqTags, setLocale,
  // User state
  user, isLoggedIn,
  // User actions
  login, logout, updateUser,
} = useFreshchat();
```

### `useFreshchatWidget()`

Widget state and controls only. Use for custom chat buttons and unread badges.

```ts
const { isLoaded, isOpen, unreadCount, open, close } = useFreshchatWidget();
```

### `useFreshchatUser()`

User state and auth actions. Returns a [discriminated union](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) -- when `isLoggedIn` is `true`, `user` is narrowed to `FreshchatUser` (not `null`).

```ts
const { user, isLoggedIn, login, logout, updateUser } = useFreshchatUser();

if (isLoggedIn) {
  console.log(user.firstName); // user is FreshchatUser, not null
}
```

### `useFreshchatEvents(event, handler)`

Subscribe to Freshchat events declaratively. Listeners are cleaned up on unmount and re-attached when the widget initializes.

```ts
import { useCallback } from 'react';
import { useFreshchatEvents } from 'use-freshchat';

const handler = useCallback((resp?: unknown) => {
  console.log('Widget opened', resp);
}, []);

useFreshchatEvents('widget:opened', handler);
```

**Events:** `widget:opened` | `widget:closed` | `widget:loaded` | `user:created` | `unreadCount:notify`

### `login(config)`

Authenticates a user with Freshchat. Resolves after the identity flow completes.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `externalId` | `string` | yes | Your system's unique user ID |
| `restoreId` | `string` | no | From your DB -- enables cross-device conversation restore |
| `firstName` | `string` | no | |
| `lastName` | `string` | no | |
| `email` | `string` | no | |
| `phone` | `string` | no | |
| `phoneCountryCode` | `string` | no | |
| `meta` | `Record<string, string \| number \| boolean>` | no | Custom user properties |
| `onRestoreIdGenerated` | `(id: string) => void \| Promise<void>` | no | Called when Freshchat generates a new restoreId |

### `updateUser(props)`

Update user properties without re-initializing the widget.

```ts
await updateUser({
  firstName: 'Jane',
  meta: { plan: 'enterprise' },
});
```

### `open(payload?)`

Open the widget, optionally targeting a specific channel or pre-filling a message.

```ts
open(); // open default
open({ name: 'support' }); // open specific channel
open({ replyText: 'I need help with...' }); // pre-fill message
```

## Migrating from react-freshchat

| react-freshchat | use-freshchat |
|---|---|
| `<Freshchat token="..." />` | `<FreshchatProvider token="...">` |
| Class component, render prop | Hooks |
| No TypeScript | Full TypeScript with discriminated unions |
| No auth flow | Built-in login/logout with restoreId management |
| No SSR support | SSR-safe, Next.js App Router compatible |
| No event API | `useFreshchatEvents` with auto-cleanup |
| No lazy loading | `requestIdleCallback` by default |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
