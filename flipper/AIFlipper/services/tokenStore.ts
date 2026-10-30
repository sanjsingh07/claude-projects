import * as SecureStore from 'expo-secure-store';

// JWTs live in the device keychain/keystore via expo-secure-store, not AsyncStorage
// — AsyncStorage is plaintext on disk. Keys must match [A-Za-z0-9._-]; these do.
const ACCESS_KEY = 'aiflipper.accessToken';
const REFRESH_KEY = 'aiflipper.refreshToken';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export const saveTokens = async (tokens: StoredTokens): Promise<void> => {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
  ]);
};

export const loadTokens = async (): Promise<StoredTokens | null> => {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
};

export const clearTokens = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
};
