# react-freshchat-hooks — Build Specification

> This file is the authoritative spec. Read it fully before writing any code.
> Work through sections in order. Do not skip ahead.

---

## Project Overview

A modern, TypeScript-first React library for integrating Freshchat into React and Next.js apps. Replaces the abandoned `react-freshchat` (8 years old, class-based, no TypeScript) which still receives ~2,700 weekly downloads because no modern alternative exists.

**Core goals:**
- Hooks-first API (`useFreshchat`, `useFreshchatUser`, `useFreshchatWidget`, `useFreshchatEvents`)
- Full TypeScript coverage
- Pre-login (anonymous) and post-login (authenticated) flows as first-class citizens
- Automatic `restoreId` management for cross-device conversation continuity
- SSR / Next.js 16 App Router compatible (no `window` access on server)
- Zero dependencies beyond React peer dep

---

## Repository Structure

```
react-freshchat-hooks/
├── src/
│   ├── context/
│   │   └── FreshchatContext.tsx       # React context + default state
│   ├── hooks/
│   │   ├── useFreshchat.ts            # Primary consumer hook (full surface)
│   │   ├── useFreshchatUser.ts        # User state + auth actions only
│   │   ├── useFreshchatWidget.ts      # Widget open/close/unread only
│   │   └── useFreshchatEvents.ts      # Declarative event subscriptions
│   ├── components/
│   │   └── FreshchatProvider.tsx      # Top-level provider component
│   ├── types/
│   │   └── index.ts                   # All TypeScript interfaces (write these first)
│   ├── utils/
│   │   ├── loader.ts                  # Lazy script loader (loads widget.js once)
│   │   └── guards.ts                  # SSR safety (isBrowser, withBrowser)
│   └── index.ts                       # Public re-exports only
├── examples/
│   ├── nextjs/                        # Next.js 16 App Router demo
│   └── vite/                          # Vite + React demo
├── tests/
│   ├── hooks/
│   └── utils/
├── package.json
├── tsconfig.json
├── vite.config.ts                     # Library build config (lib mode)
└── README.md
```

---

## Tech Stack

| Concern | Choice |
|---|---|
| Language | TypeScript 5.x |
| Build | Vite (lib mode) — ESM + CJS dual output |
| Testing | Vitest + @testing-library/react |
| Linting | ESLint + Prettier |
| Peer deps | React >=16.8.0, react-dom >=16.8.0 |

---

## Phase 1 — Scaffold & Core

### Step 1: Init project

```bash
npm create vite@latest react-freshchat-hooks -- --template react-ts
cd react-freshchat-hooks
npm install
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom eslint prettier
```

### Step 2: vite.config.ts (lib mode)

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [react(), dts({ include: ['src'] })],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: { globals: { react: 'React' } },
    },
  },
});
```

### Step 3: package.json key fields

```json
{
  "name": "react-freshchat-hooks",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0"
  },
  "sideEffects": false,
  "keywords": ["freshchat", "react", "hooks", "typescript", "freshworks", "live-chat", "widget"]
}
```

---

## Phase 2 — Type Definitions

Write ALL types in `src/types/index.ts` before touching any other file.

```ts
export type SupportedLocale =
  | 'en' | 'ar' | 'ca' | 'zh-HANS' | 'zh-HANT' | 'cs' | 'da'
  | 'nl' | 'de' | 'et' | 'fi' | 'fr' | 'hu' | 'id' | 'it'
  | 'ko' | 'lv' | 'nb' | 'pl' | 'pt' | 'pt-BR' | 'ro' | 'ru'
  | 'sk' | 'sl' | 'es' | 'es-LA' | 'sv' | 'th' | 'tr' | 'uk' | 'vi';

export type FreshchatEvent =
  | 'widget:opened'
  | 'widget:closed'
  | 'widget:loaded'
  | 'user:created'
  | 'unreadCount:notify';

export interface FreshchatUser {
  externalId: string;
  restoreId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  meta?: Record<string, unknown>;
}

export interface UserProperties {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  meta?: Record<string, string | number | boolean>;
}

export interface LoginConfig {
  externalId: string;              // Required — your system's unique user ID
  restoreId?: string;              // From your DB — enables cross-device conversation restore
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  meta?: Record<string, string | number | boolean>;
  onRestoreIdGenerated?: (restoreId: string) => void | Promise<void>;
}

export interface OpenPayload {
  name?: string;        // Open a specific channel by name
  replyText?: string;   // Pre-fill the message input
}

export interface FaqTagConfig {
  tags: string[];
  filterType: 'category' | 'article';
}

export interface FreshchatWidgetConfig {
  locale?: SupportedLocale;
  siteId?: string;
  tags?: string[];
  faqTags?: FaqTagConfig;
  config?: Record<string, unknown>;  // Raw Freshchat widget config passthrough
}

export interface FreshchatProviderProps extends FreshchatWidgetConfig {
  token: string;
  host?: string;
  onLoad?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  onUnreadCount?: (count: number) => void;
  lazyLoad?: boolean;   // Default: true
  debug?: boolean;
  children: React.ReactNode;
}

export interface FreshchatContextValue {
  // Widget state
  isLoaded: boolean;
  isInitialized: boolean;
  isOpen: boolean;
  unreadCount: number;

  // Widget controls
  open: (payload?: OpenPayload) => void;
  close: () => void;
  destroy: () => void;
  track: (event: string, data?: Record<string, unknown>) => void;
  setTags: (tags: string[]) => void;
  setFaqTags: (config: FaqTagConfig) => void;
  setLocale: (locale: SupportedLocale) => void;

  // User state
  user: FreshchatUser | null;
  isLoggedIn: boolean;

  // User actions
  login: (config: LoginConfig) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (props: UserProperties) => Promise<void>;
}
```

---

## Phase 3 — Utilities

### src/utils/guards.ts

```ts
export const isBrowser = typeof window !== 'undefined';

export function withBrowser<T>(fn: () => T): T | undefined {
  if (!isBrowser) return undefined;
  return fn();
}

// Type-safe window.fcWidget access
export function getFcWidget(): Window['fcWidget'] | undefined {
  return withBrowser(() => window.fcWidget);
}
```

### src/utils/loader.ts

Load the Freshchat script exactly once. Safe to call multiple times.

```ts
let scriptPromise: Promise<void> | null = null;

export function loadFreshchatScript(host: string): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (document.querySelector('script[data-freshchat]')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `${host}/js/widget.js`;
    script.async = true;
    script.setAttribute('data-freshchat', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Freshchat script'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function resetScriptLoader() {
  // For testing only
  scriptPromise = null;
}
```

---

## Phase 4 — Context

### src/context/FreshchatContext.tsx

```tsx
import { createContext, useContext } from 'react';
import type { FreshchatContextValue } from '../types';

const noop = () => {};
const asyncNoop = async () => {};

export const defaultContextValue: FreshchatContextValue = {
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
};

export const FreshchatContext = createContext<FreshchatContextValue>(defaultContextValue);

export function useFreshchatContext(): FreshchatContextValue {
  return useContext(FreshchatContext);
}
```

---

## Phase 5 — Provider (Critical: Auth Flow Logic Lives Here)

### src/components/FreshchatProvider.tsx

This is the most complex file. Implement the full login/logout state machine.

```tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FreshchatContext } from '../context/FreshchatContext';
import { loadFreshchatScript } from '../utils/loader';
import { isBrowser, getFcWidget } from '../utils/guards';
import type {
  FreshchatProviderProps, FreshchatUser, LoginConfig,
  UserProperties, OpenPayload, FaqTagConfig, SupportedLocale
} from '../types';

export function FreshchatProvider({
  token,
  host = 'https://wchat.freshchat.com',
  siteId,
  locale,
  config,
  tags,
  faqTags,
  onLoad,
  onOpen,
  onClose,
  onUnreadCount,
  lazyLoad = true,
  debug = false,
  children,
}: FreshchatProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<FreshchatUser | null>(null);

  const log = useCallback((...args: unknown[]) => {
    if (debug) console.log('[react-freshchat-hooks]', ...args);
  }, [debug]);

  // ── INIT (anonymous mode) ──────────────────────────────────────────────
  const initAnonymous = useCallback(async () => {
    if (!isBrowser) return;
    await loadFreshchatScript(host);

    window.fcWidget.init({
      token,
      host,
      ...(siteId && { siteId }),
      ...(locale && { locale }),
      ...(tags && { tags }),
      ...(faqTags && { faqTags }),
      ...(config && { config }),
    });

    window.fcWidget.on('widget:loaded', () => {
      setIsLoaded(true);
      onLoad?.();
      log('widget:loaded');
    });

    window.fcWidget.on('widget:opened', () => {
      setIsOpen(true);
      onOpen?.();
    });

    window.fcWidget.on('widget:closed', () => {
      setIsOpen(false);
      onClose?.();
    });

    window.fcWidget.on('unreadCount:notify', (resp: { count: number }) => {
      setUnreadCount(resp.count);
      onUnreadCount?.(resp.count);
    });

    setIsInitialized(true);
    log('init anonymous');
  }, [token, host, siteId, locale, tags, faqTags, config, onLoad, onOpen, onClose, onUnreadCount, debug]);

  useEffect(() => {
    if (!isBrowser) return;
    if (lazyLoad) {
      const id = requestIdleCallback
        ? requestIdleCallback(initAnonymous)
        : setTimeout(initAnonymous, 1);
      return () => {
        if (requestIdleCallback) cancelIdleCallback(id as number);
        else clearTimeout(id as number);
      };
    } else {
      initAnonymous();
    }
  }, []); // Run once on mount

  // ── LOGIN FLOW ─────────────────────────────────────────────────────────
  //
  // Sequence:
  // 1. If already initialized with a different user, clear first
  // 2. Re-init with externalId + restoreId
  // 3. Call user.get() to check if user exists in Freshchat
  // 4. If status 401 (not found), call user.setProperties()
  // 5. Listen on user:created to capture restoreId
  // 6. Call onRestoreIdGenerated callback if restoreId is new
  //
  const login = useCallback(async (loginConfig: LoginConfig) => {
    if (!isBrowser) return;

    const {
      externalId, restoreId, firstName, lastName,
      email, phone, phoneCountryCode, meta,
      onRestoreIdGenerated,
    } = loginConfig;

    log('login called for', externalId);

    // If widget already has a different user session, clear it first
    if (window.fcWidget.isInitialized()) {
      await window.fcWidget.user.clear();
      window.fcWidget.destroy();
      setIsInitialized(false);
      setIsLoaded(false);
    }

    await loadFreshchatScript(host);

    window.fcWidget.init({
      token,
      host,
      externalId,
      restoreId: restoreId ?? null,
      ...(siteId && { siteId }),
      ...(locale && { locale }),
    });

    setIsInitialized(true);

    // Re-attach core event listeners after re-init
    window.fcWidget.on('widget:loaded', () => { setIsLoaded(true); onLoad?.(); });
    window.fcWidget.on('widget:opened', () => { setIsOpen(true); onOpen?.(); });
    window.fcWidget.on('widget:closed', () => { setIsOpen(false); onClose?.(); });
    window.fcWidget.on('unreadCount:notify', (resp: { count: number }) => {
      setUnreadCount(resp.count);
    });

    // Check if user exists in Freshchat
    window.fcWidget.user.get((resp: { status: number; data?: FreshchatUser }) => {
      const status = resp?.status;

      if (status !== 200) {
        // User not found — set properties which will trigger user creation
        log('user not found (status', status, '), setting properties');
        window.fcWidget.user.setProperties({
          firstName,
          lastName,
          email,
          phone,
          phoneCountryCode,
          ...meta,
        });
      } else {
        log('user found in Freshchat');
      }

      // Always listen for user:created — fires when Freshchat creates the user
      // and assigns a restoreId for the first time
      window.fcWidget.on('user:created', async (createdResp: { status: number; data?: { restoreId?: string } }) => {
        if (createdResp?.status === 200 && createdResp.data?.restoreId) {
          const newRestoreId = createdResp.data.restoreId;
          log('restoreId generated:', newRestoreId);

          setUser(prev => prev ? { ...prev, restoreId: newRestoreId } : null);

          if (onRestoreIdGenerated) {
            await onRestoreIdGenerated(newRestoreId);
          }
        }
      });
    });

    setUser({
      externalId,
      restoreId,
      firstName,
      lastName,
      email,
      phone,
    });

    log('login complete for', externalId);
  }, [token, host, siteId, locale, onLoad, onOpen, onClose, debug]);

  // ── LOGOUT FLOW ────────────────────────────────────────────────────────
  //
  // Sequence:
  // 1. user.clear() — disassociates user identity (MUST come before destroy)
  // 2. destroy() — removes widget from DOM
  // 3. Clear React state
  // 4. Re-init in anonymous mode
  //
  const logout = useCallback(async () => {
    if (!isBrowser || !window.fcWidget?.isInitialized()) return;
    log('logout called');

    await window.fcWidget.user.clear();
    window.fcWidget.destroy();

    setUser(null);
    setIsInitialized(false);
    setIsLoaded(false);
    setIsOpen(false);
    setUnreadCount(0);

    // Re-init as anonymous
    await initAnonymous();
    log('logout complete, re-init anonymous');
  }, [initAnonymous, debug]);

  // ── UPDATE USER ────────────────────────────────────────────────────────
  const updateUser = useCallback(async (props: UserProperties) => {
    if (!isBrowser) return;
    await window.fcWidget.user.update({
      firstName: props.firstName,
      lastName: props.lastName,
      email: props.email,
      phone: props.phone,
      phoneCountryCode: props.phoneCountryCode,
      meta: props.meta,
    });
    setUser(prev => prev ? { ...prev, ...props } : null);
  }, []);

  // ── WIDGET CONTROLS ────────────────────────────────────────────────────
  const open = useCallback((payload?: OpenPayload) => {
    getFcWidget()?.open(payload);
  }, []);

  const close = useCallback(() => {
    getFcWidget()?.close();
  }, []);

  const destroy = useCallback(() => {
    getFcWidget()?.destroy();
    setIsInitialized(false);
    setIsLoaded(false);
  }, []);

  const track = useCallback((event: string, data?: Record<string, unknown>) => {
    getFcWidget()?.track(event, data);
  }, []);

  const setTags = useCallback((newTags: string[]) => {
    getFcWidget()?.setTags(newTags);
  }, []);

  const setFaqTags = useCallback((faqTagConfig: FaqTagConfig) => {
    getFcWidget()?.setFaqTags(faqTagConfig);
  }, []);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    getFcWidget()?.user.setLocale(newLocale);
  }, []);

  return (
    <FreshchatContext.Provider value={{
      isLoaded,
      isInitialized,
      isOpen,
      unreadCount,
      open,
      close,
      destroy,
      track,
      setTags,
      setFaqTags,
      setLocale,
      user,
      isLoggedIn: user !== null,
      login,
      logout,
      updateUser,
    }}>
      {children}
    </FreshchatContext.Provider>
  );
}
```

---

## Phase 6 — Hooks

### src/hooks/useFreshchat.ts

Primary hook — full API surface.

```ts
import { useFreshchatContext } from '../context/FreshchatContext';

export function useFreshchat() {
  const ctx = useFreshchatContext();
  if (ctx === undefined) {
    throw new Error('useFreshchat must be used within a <FreshchatProvider>');
  }
  return ctx;
}
```

### src/hooks/useFreshchatUser.ts

User-only hook — prevents re-renders from widget state changes.

```ts
import { useFreshchatContext } from '../context/FreshchatContext';

export function useFreshchatUser() {
  const { user, isLoggedIn, login, logout, updateUser } = useFreshchatContext();
  if (user === undefined) {
    throw new Error('useFreshchatUser must be used within a <FreshchatProvider>');
  }
  return { user, isLoggedIn, login, logout, updateUser };
}
```

### src/hooks/useFreshchatWidget.ts

Widget-only hook — use in custom chat buttons / unread badges.

```ts
import { useFreshchatContext } from '../context/FreshchatContext';

export function useFreshchatWidget() {
  const { isLoaded, isOpen, unreadCount, open, close } = useFreshchatContext();
  return { isLoaded, isOpen, unreadCount, open, close };
}
```

### src/hooks/useFreshchatEvents.ts

Declarative event subscriptions. Auto-cleanup on unmount.

```ts
import { useEffect } from 'react';
import { isBrowser } from '../utils/guards';
import type { FreshchatEvent } from '../types';

export function useFreshchatEvents(
  event: FreshchatEvent,
  handler: (resp?: unknown) => void
) {
  useEffect(() => {
    if (!isBrowser || !window.fcWidget) return;

    window.fcWidget.on(event, handler);

    return () => {
      window.fcWidget?.off?.(event, handler);
    };
  }, [event, handler]);
}
```

---

## Phase 7 — Public Exports

### src/index.ts

```ts
// Components
export { FreshchatProvider } from './components/FreshchatProvider';

// Hooks
export { useFreshchat } from './hooks/useFreshchat';
export { useFreshchatUser } from './hooks/useFreshchatUser';
export { useFreshchatWidget } from './hooks/useFreshchatWidget';
export { useFreshchatEvents } from './hooks/useFreshchatEvents';

// Types
export type {
  FreshchatProviderProps,
  FreshchatContextValue,
  FreshchatUser,
  LoginConfig,
  UserProperties,
  OpenPayload,
  FaqTagConfig,
  FreshchatWidgetConfig,
  FreshchatEvent,
  SupportedLocale,
} from './types';
```

---

## Phase 8 — Next.js 16 Example

### examples/nextjs/app/layout.tsx

```tsx
// This must be a Client Component — FreshchatProvider uses browser APIs
'use client';

import { FreshchatProvider } from 'react-freshchat-hooks';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <FreshchatProvider
          token={process.env.NEXT_PUBLIC_FRESHCHAT_TOKEN!}
          host="https://wchat.freshchat.com"
          debug={process.env.NODE_ENV === 'development'}
        >
          {children}
        </FreshchatProvider>
      </body>
    </html>
  );
}
```

### examples/nextjs/app/components/AuthHandler.tsx

```tsx
'use client';

import { useFreshchatUser } from 'react-freshchat-hooks';

export function AuthHandler() {
  const { login, logout, isLoggedIn, user } = useFreshchatUser();

  async function handleLogin() {
    // restoreId should come from your own DB
    const restoreId = await myDB.getFreshchatRestoreId(currentUser.id);

    await login({
      externalId: currentUser.id,
      restoreId,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      meta: { plan: currentUser.plan },
      onRestoreIdGenerated: async (newId) => {
        // Save back to your DB so next login restores conversation
        await myDB.saveFreshchatRestoreId(currentUser.id, newId);
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
```

### examples/nextjs/app/components/ChatButton.tsx

```tsx
'use client';

import { useFreshchatWidget } from 'react-freshchat-hooks';

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
```

---

## Critical Invariants

These must hold throughout the implementation. Do not violate them.

1. **Never call `window.fcWidget` without the `isBrowser` guard** — SSR will throw
2. **`login()` must call `user.get()` first** — do not skip this step, it detects existing users
3. **`user.setProperties()` only if user.get() returns status 401** — calling it on existing users causes errors
4. **Always listen on `user:created`** — restoreId is generated asynchronously, not returned from init()
5. **`logout()` must call `user.clear()` before `destroy()`** — order matters for proper session cleanup
6. **All hooks must throw a descriptive error if used outside `<FreshchatProvider>`**
7. **`useFreshchatEvents` must call `fcWidget.off()` in useEffect cleanup** — prevent listener leaks
8. **Script is loaded once** — `loader.ts` caches the promise; never append the script tag twice
9. **`lazyLoad: true` is the default** — use `requestIdleCallback` to defer, fallback to `setTimeout`

---

## Window Type Declaration

Add this to `src/types/index.ts` or a `global.d.ts` file so TypeScript knows about `window.fcWidget`:

```ts
declare global {
  interface Window {
    fcWidget: {
      init: (config: Record<string, unknown>) => void;
      destroy: () => void;
      isInitialized: () => boolean;
      isLoaded: () => boolean;
      isOpen: () => boolean;
      open: (payload?: OpenPayload) => void;
      close: () => void;
      track: (event: string, data?: Record<string, unknown>) => void;
      setTags: (tags: string[]) => void;
      setFaqTags: (config: FaqTagConfig) => void;
      on: (event: string, handler: (resp?: unknown) => void) => void;
      off: (event: string, handler: (resp?: unknown) => void) => void;
      user: {
        get: (callback?: (resp: { status: number; data?: unknown }) => void) => Promise<unknown>;
        create: () => Promise<void>;
        update: (props: Record<string, unknown>) => Promise<void>;
        clear: () => Promise<void>;
        setProperties: (props: Record<string, unknown>) => void;
        setLocale: (locale: string) => void;
      };
    };
  }
}
```

---

## Build Order Checklist

Work through these in order. Each step depends on the previous.

- [ ] Scaffold project + install deps
- [ ] Configure `vite.config.ts` in lib mode
- [ ] Configure `package.json` exports
- [ ] Write `src/types/index.ts` (all interfaces + Window declaration)
- [ ] Write `src/utils/guards.ts`
- [ ] Write `src/utils/loader.ts`
- [ ] Write `src/context/FreshchatContext.tsx`
- [ ] Write `src/components/FreshchatProvider.tsx` (login/logout state machine)
- [ ] Write `src/hooks/useFreshchat.ts`
- [ ] Write `src/hooks/useFreshchatUser.ts`
- [ ] Write `src/hooks/useFreshchatWidget.ts`
- [ ] Write `src/hooks/useFreshchatEvents.ts`
- [ ] Write `src/index.ts` (public exports)
- [ ] Write `examples/nextjs/` (Next.js 16 App Router demo)
- [ ] Write `examples/vite/` (Vite + React demo)
- [ ] Write tests for login/logout state transitions
- [ ] Write tests for SSR guards (no window access)
- [ ] `npm run build` — verify ESM + CJS output + `.d.ts` generated
- [ ] Write `README.md` with usage, migration guide from `react-freshchat`, API reference
