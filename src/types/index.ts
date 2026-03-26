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
  meta?: Record<string, string | number | boolean>;
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
  externalId: string;
  restoreId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  meta?: Record<string, string | number | boolean>;
  onRestoreIdGenerated?: (restoreId: string) => void | Promise<void>;
}

export interface OpenPayload {
  name?: string;
  replyText?: string;
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
  config?: Record<string, unknown>;
}

export interface FreshchatProviderProps extends FreshchatWidgetConfig {
  token: string;
  host?: string;
  onLoad?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  onUnreadCount?: (count: number) => void;
  lazyLoad?: boolean;
  debug?: boolean;
  children: React.ReactNode;
}

export type FreshchatUserState =
  | { user: FreshchatUser; isLoggedIn: true }
  | { user: null; isLoggedIn: false };

export interface FreshchatContextValue {
  isLoaded: boolean;
  isInitialized: boolean;
  isOpen: boolean;
  unreadCount: number;

  open: (payload?: OpenPayload) => void;
  close: () => void;
  destroy: () => void;
  track: (event: string, data?: Record<string, unknown>) => void;
  setTags: (tags: string[]) => void;
  setFaqTags: (config: FaqTagConfig) => void;
  setLocale: (locale: SupportedLocale) => void;

  user: FreshchatUser | null;
  isLoggedIn: boolean;

  login: (config: LoginConfig) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (props: UserProperties) => Promise<void>;
}

export interface FcWidget {
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
}

declare global {
  interface Window {
    fcWidget?: FcWidget;
  }
}
