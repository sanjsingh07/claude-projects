import { NativeModules, Platform } from 'react-native';

const DEFAULT_BACKEND_PORT = 3000;

// In development the backend runs on the same machine as the Metro bundler, so
// the bundler's own URL tells us the right host. This is what makes the app work
// on a physical device without anyone editing a hardcoded IP after every network
// change — `localhost` resolves to the phone itself, not to the dev machine.
const hostFromMetroBundler = (): string | null => {
  const scriptURL: unknown = NativeModules?.SourceCode?.scriptURL;
  if (typeof scriptURL !== 'string') return null;

  const host = scriptURL.split('://')[1]?.split('/')[0]?.split(':')[0];
  return host && host.length > 0 ? host : null;
};

const resolveApiUrl = (): string => {
  // Explicit override wins. Set EXPO_PUBLIC_API_URL in AIFlipper/.env (gitignored)
  // or in the build environment. Expo inlines EXPO_PUBLIC_* at build time.
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured && configured.length > 0) return configured;

  if (__DEV__) {
    const host = hostFromMetroBundler();
    if (host) return `http://${host}:${DEFAULT_BACKEND_PORT}/api`;

    // Android emulators reach the host machine through a fixed alias; iOS
    // simulators share the host's loopback.
    const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${fallbackHost}:${DEFAULT_BACKEND_PORT}/api`;
  }

  throw new Error(
    'EXPO_PUBLIC_API_URL is not set. Production builds must be given a backend URL at build time.'
  );
};

export const Config = {
  API_URL: resolveApiUrl(),
};
