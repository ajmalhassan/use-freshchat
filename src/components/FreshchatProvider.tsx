import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FreshchatContext } from '../context/FreshchatContext';
import { loadFreshchatScript } from '../utils/loader';
import { isBrowser, getFcWidget } from '../utils/guards';
import type {
  FreshchatProviderProps, FreshchatUser, LoginConfig,
  UserProperties, OpenPayload, FaqTagConfig, SupportedLocale
} from '../types';

type EventHandler = (resp?: unknown) => void;

function attachListeners(
  handlers: {
    onLoaded: EventHandler;
    onOpened: EventHandler;
    onClosed: EventHandler;
    onUnread: EventHandler;
  }
): () => void {
  const fc = window.fcWidget;
  if (!fc) return () => {};

  fc.on('widget:loaded', handlers.onLoaded);
  fc.on('widget:opened', handlers.onOpened);
  fc.on('widget:closed', handlers.onClosed);
  fc.on('unreadCount:notify', handlers.onUnread);

  return () => {
    fc.off('widget:loaded', handlers.onLoaded);
    fc.off('widget:opened', handlers.onOpened);
    fc.off('widget:closed', handlers.onClosed);
    fc.off('unreadCount:notify', handlers.onUnread);
  };
}

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

  // Refs for callback props to avoid stale closures in event handlers
  const onLoadRef = useRef(onLoad);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onUnreadCountRef = useRef(onUnreadCount);
  const debugRef = useRef(debug);

  // Ref to track cleanup function for current listeners
  const cleanupListenersRef = useRef<(() => void) | null>(null);
  const cleanupUserCreatedRef = useRef<(() => void) | null>(null);

  useEffect(() => { onLoadRef.current = onLoad; }, [onLoad]);
  useEffect(() => { onOpenRef.current = onOpen; }, [onOpen]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { onUnreadCountRef.current = onUnreadCount; }, [onUnreadCount]);
  useEffect(() => { debugRef.current = debug; }, [debug]);

  const log = useCallback((...args: unknown[]) => {
    if (debugRef.current) console.log('[use-freshchat]', ...args);
  }, []);

  // Stable event handlers that read from refs
  const stableHandlers = useMemo(() => ({
    onLoaded: () => {
      setIsLoaded(true);
      onLoadRef.current?.();
      log('widget:loaded');
    },
    onOpened: () => {
      setIsOpen(true);
      onOpenRef.current?.();
    },
    onClosed: () => {
      setIsOpen(false);
      onCloseRef.current?.();
    },
    onUnread: (resp?: unknown) => {
      const count = (resp as { count: number })?.count ?? 0;
      setUnreadCount(count);
      onUnreadCountRef.current?.(count);
    },
  }), [log]);

  // ── INIT (anonymous mode) ──────────────────────────────────────────────
  const initAnonymous = useCallback(async () => {
    if (!isBrowser) return;
    await loadFreshchatScript(host);

    if (!window.fcWidget) return;

    window.fcWidget.init({
      token,
      host,
      ...(siteId && { siteId }),
      ...(locale && { locale }),
      ...(tags && { tags }),
      ...(faqTags && { faqTags }),
      ...(config && { config }),
    });

    // Clean up previous listeners before attaching new ones
    cleanupListenersRef.current?.();
    cleanupListenersRef.current = attachListeners(stableHandlers);

    setIsInitialized(true);
    log('init anonymous');
  }, [token, host, siteId, locale, tags, faqTags, config, stableHandlers, log]);

  useEffect(() => {
    if (!isBrowser) return;

    if (lazyLoad) {
      const id = typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(() => { initAnonymous(); })
        : setTimeout(() => { initAnonymous(); }, 1);
      return () => {
        if (typeof requestIdleCallback !== 'undefined') cancelIdleCallback(id as number);
        else clearTimeout(id as number);
        // Cleanup widget on unmount
        cleanupListenersRef.current?.();
        cleanupUserCreatedRef.current?.();
        if (window.fcWidget?.isInitialized()) {
          window.fcWidget.destroy();
        }
      };
    } else {
      initAnonymous();
      return () => {
        cleanupListenersRef.current?.();
        cleanupUserCreatedRef.current?.();
        if (isBrowser && window.fcWidget?.isInitialized()) {
          window.fcWidget.destroy();
        }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // ── LOGIN FLOW ─────────────────────────────────────────────────────────
  const login = useCallback(async (loginConfig: LoginConfig) => {
    if (!isBrowser) return;

    const {
      externalId, restoreId, firstName, lastName,
      email, phone, phoneCountryCode, meta,
      onRestoreIdGenerated,
    } = loginConfig;

    log('login called for', externalId);

    // If widget already has a different user session, clear it first
    if (window.fcWidget?.isInitialized()) {
      cleanupListenersRef.current?.();
      cleanupUserCreatedRef.current?.();
      await window.fcWidget.user.clear();
      window.fcWidget.destroy();
      setIsInitialized(false);
      setIsLoaded(false);
    }

    await loadFreshchatScript(host);
    if (!window.fcWidget) return;

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
    cleanupListenersRef.current = attachListeners(stableHandlers);

    // Promisify the user.get + user:created flow
    await new Promise<void>((resolve) => {
      window.fcWidget!.user.get((resp: { status: number; data?: unknown }) => {
        const status = resp?.status;

        if (status !== 200) {
          log('user not found (status', status, '), setting properties');
          window.fcWidget!.user.setProperties({
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

        // Clean up previous user:created listener
        cleanupUserCreatedRef.current?.();

        const userCreatedHandler = async (createdResp?: unknown) => {
          const typed = createdResp as { status: number; data?: { restoreId?: string } };
          if (typed?.status === 200 && typed.data?.restoreId) {
            const newRestoreId = typed.data.restoreId;
            log('restoreId generated:', newRestoreId);

            setUser(prev => prev ? { ...prev, restoreId: newRestoreId } : null);

            if (onRestoreIdGenerated) {
              await onRestoreIdGenerated(newRestoreId);
            }
          }
        };

        window.fcWidget!.on('user:created', userCreatedHandler);
        cleanupUserCreatedRef.current = () => {
          window.fcWidget?.off('user:created', userCreatedHandler);
        };

        resolve();
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
  }, [token, host, siteId, locale, stableHandlers, log]);

  // ── LOGOUT FLOW ────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (!isBrowser || !window.fcWidget?.isInitialized()) return;
    log('logout called');

    cleanupListenersRef.current?.();
    cleanupUserCreatedRef.current?.();

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
  }, [initAnonymous, log]);

  // ── UPDATE USER ────────────────────────────────────────────────────────
  const updateUser = useCallback(async (props: UserProperties) => {
    if (!isBrowser || !window.fcWidget) return;
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
    cleanupListenersRef.current?.();
    cleanupUserCreatedRef.current?.();
    getFcWidget()?.destroy();
    setIsInitialized(false);
    setIsLoaded(false);
  }, []);

  const track = useCallback((event: string, data?: Record<string, unknown>) => {
    getFcWidget()?.track(event, data);
  }, []);

  const setTagsFn = useCallback((newTags: string[]) => {
    getFcWidget()?.setTags(newTags);
  }, []);

  const setFaqTagsFn = useCallback((faqTagConfig: FaqTagConfig) => {
    getFcWidget()?.setFaqTags(faqTagConfig);
  }, []);

  const setLocaleFn = useCallback((newLocale: SupportedLocale) => {
    getFcWidget()?.user.setLocale(newLocale);
  }, []);

  const contextValue = useMemo(() => ({
    isLoaded,
    isInitialized,
    isOpen,
    unreadCount,
    open,
    close,
    destroy,
    track,
    setTags: setTagsFn,
    setFaqTags: setFaqTagsFn,
    setLocale: setLocaleFn,
    user,
    isLoggedIn: user !== null,
    login,
    logout,
    updateUser,
  }), [
    isLoaded, isInitialized, isOpen, unreadCount,
    open, close, destroy, track, setTagsFn, setFaqTagsFn, setLocaleFn,
    user, login, logout, updateUser,
  ]);

  return (
    <FreshchatContext.Provider value={contextValue}>
      {children}
    </FreshchatContext.Provider>
  );
}
