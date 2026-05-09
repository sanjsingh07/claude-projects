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
  const { isAuthenticated, user } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
  }));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'stellar-align',
  });

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    redirectUri,
  });

  console.log('LoginScreen - isAuthenticated:', isAuthenticated);

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
      <CostarBackground />
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
            <CostarText style={styles.backBtnText}>←</CostarText>
          </TouchableOpacity>

          <View style={styles.header}>
            <CostarText variant="heading1" serif italic style={styles.title}>
              Welcome back
            </CostarText>
            <CostarText style={styles.subtitle}>
              Please enter your details to sign in.
            </CostarText>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <CostarText style={styles.label}>Email Address</CostarText>
              <TextInput
                style={styles.input}
                placeholder="alex.kim@example.com"
                placeholderTextColor={colors.astraMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <CostarText style={styles.label}>Password</CostarText>
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={colors.astraMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={styles.forgotPw}
              onPress={handleForgotPassword}
            >
              <CostarText style={styles.forgotPwText}>Forgot password?</CostarText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, isLoginPending && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isLoginPending}
            >
              {isLoginPending ? (
                <ActivityIndicator color={colors.astraBg} />
              ) : (
                <CostarText style={styles.btnText}>Sign In</CostarText>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.altLogin}>
            <View style={styles.altLoginTextContainer}>
              <View style={styles.altLine} />
              <CostarText style={styles.altLoginText}>Or continue with</CostarText>
              <View style={styles.altLine} />
            </View>
            
            <View style={styles.socialBtns}>
              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={styles.socialBtn}
                  onPress={handleAppleLogin}
                >
                  <CostarText style={styles.socialIcon}></CostarText>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.socialBtn}
                onPress={handleGoogleLogin}
                disabled={!request}
              >
                <CostarText style={styles.socialIcon}>G</CostarText>
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
    backgroundColor: colors.astraBg,
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
    color: colors.astraFg,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    color: colors.astraFg,
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    color: colors.astraMuted,
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
    color: colors.astraMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  input: {
    height: 52,
    backgroundColor: colors.astraSurface,
    borderWidth: 1,
    borderColor: colors.astraBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: colors.astraFg,
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
    color: colors.astraViolet,
  },
  btn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.astraFg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  btnText: {
    color: colors.astraBg,
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
    backgroundColor: colors.astraBorder,
  },
  altLoginText: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    color: colors.astraMuted,
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
    borderColor: colors.astraBorder,
    backgroundColor: colors.astraSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    fontSize: 20,
    color: colors.astraFg,
  },
  indicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -67,
    width: 134,
    height: 5,
    backgroundColor: colors.astraFg,
    borderRadius: 3,
    opacity: 0.3,
  },
});

export default LoginScreen;
