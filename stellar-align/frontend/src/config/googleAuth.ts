export const GOOGLE_AUTH = {
  clientId:
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    '945791078641-qi8cnf9cdh0o38j4ae2njifgc5mibp0b.apps.googleusercontent.com',
  iosClientId:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    '945791078641-ena3npefg2g7e4fs6vhsna4e0qkfouof.apps.googleusercontent.com',
  androidClientId:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    '945791078641-fd1eldv9qkj6lu89kdggf2hbtke4bl2o.apps.googleusercontent.com',
  webClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    '945791078641-qi8cnf9cdh0o38j4ae2njifgc5mibp0b.apps.googleusercontent.com',
  iosRedirectScheme: 'com.googleusercontent.apps.945791078641-ena3npefg2g7e4fs6vhsna4e0qkfouof',
};

export const isGoogleAuthConfigured = Boolean(
  GOOGLE_AUTH.clientId &&
    GOOGLE_AUTH.iosClientId &&
    GOOGLE_AUTH.androidClientId &&
    GOOGLE_AUTH.webClientId
);
