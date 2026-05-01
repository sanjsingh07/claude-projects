import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { RootStackParamList } from '@navigation/RootNavigator';
import { useAuth } from '@hooks/useAuth';
import { useAuthStore } from '@store/authStore';
import { CostarText } from '@components/CostarCard';
import { CostarButton } from '@components/CostarButton';
import { CostarBackground } from '@components/CostarBackground';
import { SignIcon } from '@components/SignIcon';
import { colors, spacing } from '@theme/theme';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Login'>>();
  const { login, socialLogin, isLoginPending, error } = useAuth();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'stellaralign',
    }),
  });

  console.log('LoginScreen - isAuthenticated:', isAuthenticated);

  useEffect(() => {
    console.log('useEffect - isAuthenticated changed to:', isAuthenticated);
    if (isAuthenticated) {
      console.log('Navigating to Main...');
      navigation.replace('Main');
    }
  }, [isAuthenticated, navigation]);

  useEffect(() => {
    if (response?.type === 'success' && response.params?.id_token) {
      socialLogin({ provider: 'google', idToken: response.params.id_token }).catch(() => {
        Alert.alert('Google Sign-In Failed', 'Please try again');
      });
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign-In Failed', 'An error occurred');
    }
  }, [response]);

  const handleLogin = async () => {
    console.log('handleLogin called with:', { email, password: '***' });
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      console.log('Calling login...');
      await login({ email: email.toLowerCase().trim(), password });
      console.log('Login completed successfully');
    } catch (e: any) {
      console.error('Login error:', e);
      Alert.alert('Login Failed', e.message || 'Please check your credentials');
    }
  };

  const handleGoogleLogin = async () => {
    if (!GOOGLE_CLIENT_ID && !GOOGLE_IOS_CLIENT_ID && !GOOGLE_ANDROID_CLIENT_ID && !GOOGLE_WEB_CLIENT_ID) {
      Alert.alert('Coming Soon', 'Google Sign-In requires configuration. Please use email/password for now.');
      return;
    }
    await promptAsync();
  };

  const handleAppleLogin = async () => {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('Not Available', 'Apple Sign-In is only available on iOS devices.');
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        await socialLogin({ provider: 'apple', idToken: credential.identityToken });
      }
    } catch (e: any) {
      if (e.code === 'ERR_CANCELED') return;
      Alert.alert('Apple Sign-In Failed', 'An error occurred. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <CostarBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoRow}>
              <SignIcon sign="sun" size={48} color={colors.white} />
              <SignIcon sign="moon" size={40} color={colors.gray400} />
              <SignIcon sign="rising" size={36} color={colors.gray600} />
            </View>
            <CostarText variant="heading1" uppercase style={styles.title}>
              Stellar Align
            </CostarText>
            <CostarText variant="bodySmall" color={colors.gray500} style={styles.subtitle}>
              Daily cosmic guidance
            </CostarText>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <CostarText variant="label" color={colors.gray400} style={styles.inputLabel}>
                Email
              </CostarText>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={colors.gray600}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <CostarText variant="label" color={colors.gray400} style={styles.inputLabel}>
                Password
              </CostarText>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.gray600}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <CostarButton
              onPress={handleLogin}
              loading={isLoginPending}
              fullWidth
              size="large"
              style={styles.loginButton}
            >
              Sign In
            </CostarButton>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <CostarText variant="caption" color={colors.gray600}>
                OR
              </CostarText>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login */}
            <CostarButton
              onPress={handleGoogleLogin}
              variant="outline"
              fullWidth
              disabled={isLoginPending || !request}
              style={styles.socialButton}
            >
              Continue with Google{!GOOGLE_CLIENT_ID ? ' (Coming Soon)' : ''}
            </CostarButton>

            {Platform.OS === 'ios' ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={handleAppleLogin}
              />
            ) : (
              <CostarButton
                onPress={handleAppleLogin}
                variant="outline"
                fullWidth
                disabled
                style={styles.socialButton}
              >
                Continue with Apple (iOS only)
              </CostarButton>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <CostarText variant="bodySmall" color={colors.gray500}>
              New to Stellar Align?
            </CostarText>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <CostarText variant="label" color={colors.white} uppercase>
                Create Account
              </CostarText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray900,
    borderRadius: 8,
    padding: spacing.lg,
    color: colors.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.gray800,
  },
  loginButton: {
    marginTop: spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray800,
  },
  socialButtons: {
    gap: spacing.md,
  },
  socialButton: {
    marginTop: spacing.sm,
  },
  appleButton: {
    width: '100%',
    height: 50,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing['3xl'],
    gap: spacing.sm,
  },
});

export default LoginScreen;
