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
import { api } from '@services/api';
import { StellarText } from '@components/StellarCard';
import { StellarButton } from '@components/StellarButton';
import { StellarBackground } from '@components/StellarBackground';
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
  const { isAuthenticated, user } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
  }));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const googleRedirectUri = AuthSession.makeRedirectUri({
    scheme: Platform.OS === 'ios' 
      ? 'com.googleusercontent.apps.945791078641-ena3npefg2g7e4fs6vhsna4e0qkfouof' 
      : 'stellar-align',
  });

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    redirectUri: googleRedirectUri,
  });

  useEffect(() => {
    console.log('Google Auth Config:', {
      redirectUri: googleRedirectUri,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
    });
  }, []);

  useEffect(() => {
    console.log('useEffect - auth check:', { isAuthenticated, profileCompleted: user?.profileCompleted });
    if (isAuthenticated) {
      if (user?.profileCompleted) {
        console.log('Navigating to Main...');
        navigation.replace('Main');
      } else {
        console.log('Navigating to Register (Incomplete Profile)...');
        // @ts-ignore
        navigation.replace('Register', { step: 2, socialUser: user });
      }
    }
  }, [isAuthenticated, user?.profileCompleted, navigation, user]);

  useEffect(() => {
    if (response?.type === 'success' && response.params?.id_token) {
      socialLogin({ provider: 'google', idToken: response.params.id_token })
        .then((data) => {
          if (data.isNewUser) {
            // @ts-ignore
            navigation.navigate('Register', { 
              step: 2, 
              socialUser: data.user 
            });
          }
        })
        .catch(() => {
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

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first.');
      return;
    }

    try {
      await api.forgotPassword(email.toLowerCase().trim());
      Alert.alert('Success', 'If an account exists, a reset link has been sent to your email.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to request password reset');
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
        const data = await socialLogin({ provider: 'apple', idToken: credential.identityToken });
        if (data.isNewUser) {
          // @ts-ignore
          navigation.navigate('Register', { 
            step: 2, 
            socialUser: data.user 
          });
        }
      }
    } catch (e: any) {
      if (e.code === 'ERR_CANCELED') return;
      Alert.alert('Apple Sign-In Failed', 'An error occurred. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StellarBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <StellarText style={styles.backBtnText}>←</StellarText>
          </TouchableOpacity>

          <View style={styles.header}>
            <StellarText variant="heading1" serif italic style={styles.title}>
              Welcome back
            </StellarText>
            <StellarText style={styles.subtitle}>
              Please enter your details to sign in.
            </StellarText>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <StellarText style={styles.label}>Email Address</StellarText>
              <TextInput
                style={styles.input}
                placeholder="alex.kim@example.com"
                placeholderTextColor={colors.stellarMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <StellarText style={styles.label}>Password</StellarText>
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={colors.stellarMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={styles.forgotPw}
              onPress={handleForgotPassword}
            >
              <StellarText style={styles.forgotPwText}>Forgot password?</StellarText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, isLoginPending && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isLoginPending}
            >
              {isLoginPending ? (
                <ActivityIndicator color={colors.stellarBg} />
              ) : (
                <StellarText style={styles.btnText}>Sign In</StellarText>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.altLogin}>
            <View style={styles.altLoginTextContainer}>
              <View style={styles.altLine} />
              <StellarText style={styles.altLoginText}>Or continue with</StellarText>
              <View style={styles.altLine} />
            </View>
            
            <View style={styles.socialBtns}>
              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={styles.socialBtn}
                  onPress={handleAppleLogin}
                >
                  <StellarText style={styles.socialIcon}></StellarText>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.socialBtn}
                onPress={handleGoogleLogin}
                disabled={!request}
              >
                <StellarText style={styles.socialIcon}>G</StellarText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.indicator} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stellarBg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 60,
  },
  island: {
    position: 'absolute',
    top: 12,
    left: '50%',
    marginLeft: -63,
    width: 126,
    height: 37,
    backgroundColor: colors.black,
    borderRadius: 20,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    marginBottom: 32,
  },
  backBtnText: {
    fontSize: 24,
    color: colors.stellarFg,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    color: colors.stellarFg,
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    color: colors.stellarMuted,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontFamily: 'DM Sans',
    fontSize: 11,
    color: colors.stellarMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  input: {
    height: 52,
    backgroundColor: colors.stellarSurface,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: colors.stellarFg,
    fontSize: 15,
    fontFamily: 'DM Sans',
  },
  forgotPw: {
    alignSelf: 'flex-end',
    marginTop: -12,
  },
  forgotPwText: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    color: colors.stellarViolet,
  },
  btn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.stellarFg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  btnText: {
    color: colors.stellarBg,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'DM Sans',
  },
  altLogin: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: 40,
  },
  altLoginTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  altLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.stellarBorder,
  },
  altLoginText: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    color: colors.stellarMuted,
    marginHorizontal: 16,
  },
  socialBtns: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  socialBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    backgroundColor: colors.stellarSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    fontSize: 20,
    color: colors.stellarFg,
  },
  indicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -67,
    width: 134,
    height: 5,
    backgroundColor: colors.stellarFg,
    borderRadius: 3,
    opacity: 0.3,
  },
});

export default LoginScreen;
