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
  FreshchatUserState,
  LoginConfig,
  UserProperties,
  OpenPayload,
  FaqTagConfig,
  FreshchatWidgetConfig,
  FreshchatEvent,
  SupportedLocale,
} from './types';
