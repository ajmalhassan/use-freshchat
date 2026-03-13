import { useCallback, useEffect, useState } from 'react';
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
    if (debug) console.log('[use-freshchat]', ...args);
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

    window.fcWidget.on('unreadCount:notify', (resp: unknown) => {
      const count = (resp as { count: number }).count;
      setUnreadCount(count);
      onUnreadCount?.(count);
    });

    setIsInitialized(true);
    log('init anonymous');
  }, [token, host, siteId, locale, tags, faqTags, config, onLoad, onOpen, onClose, onUnreadCount, log]);

  useEffect(() => {
    if (!isBrowser) return;
    if (lazyLoad) {
      const id = typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(() => { initAnonymous(); })
        : setTimeout(() => { initAnonymous(); }, 1);
      return () => {
        if (typeof requestIdleCallback !== 'undefined') cancelIdleCallback(id as number);
        else clearTimeout(id as number);
      };
    } else {
      initAnonymous();
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
    window.fcWidget.on('unreadCount:notify', (resp: unknown) => {
      setUnreadCount((resp as { count: number }).count);
    });

    // Check if user exists in Freshchat
    window.fcWidget.user.get((resp: { status: number; data?: unknown }) => {
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
      window.fcWidget.on('user:created', async (createdResp: unknown) => {
        const typed = createdResp as { status: number; data?: { restoreId?: string } };
        if (typed?.status === 200 && typed.data?.restoreId) {
          const newRestoreId = typed.data.restoreId;
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
  }, [token, host, siteId, locale, onLoad, onOpen, onClose, log]);

  // ── LOGOUT FLOW ────────────────────────────────────────────────────────
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
  }, [initAnonymous, log]);

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

  const setTagsFn = useCallback((newTags: string[]) => {
    getFcWidget()?.setTags(newTags);
  }, []);

  const setFaqTagsFn = useCallback((faqTagConfig: FaqTagConfig) => {
    getFcWidget()?.setFaqTags(faqTagConfig);
  }, []);

  const setLocaleFn = useCallback((newLocale: SupportedLocale) => {
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
      setTags: setTagsFn,
      setFaqTags: setFaqTagsFn,
      setLocale: setLocaleFn,
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
