import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
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
import { CostarBackground } from '@components/CostarBackground';
import { colors, spacing } from '@theme/theme';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export const RegisterStartScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { socialLogin } = useAuth();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'stellaralign',
    }),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Main');
    }
  }, [isAuthenticated, navigation]);

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
      <StatusBar barStyle="light-content" />
      <View style={styles.island} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.logoArea}>
            <CostarText style={styles.logoIcon}>✧</CostarText>
            <CostarText variant="heading1" serif italic style={styles.appName}>
              Astra
            </CostarText>
            <CostarText style={styles.tagline}>
              The universe, mapped for you.
            </CostarText>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => navigation.navigate('Register')}
            >
              <CostarText style={styles.btnPrimaryText}>Create Account</CostarText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary]}
              onPress={() => navigation.navigate('Login')}
            >
              <CostarText style={styles.btnSecondaryText}>Log In</CostarText>
            </TouchableOpacity>

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

            <CostarText style={styles.legal}>
              By continuing, you agree to our{' '}
              <CostarText style={styles.legalHighlight}>Terms of Service</CostarText> and{' '}
              <CostarText style={styles.legalHighlight}>Privacy Policy</CostarText>.
            </CostarText>
          </View>
        </View>
      </SafeAreaView>

      {/* Subtle Glow Effect */}
      <View style={styles.glow} pointerEvents="none" />
      
      <View style={styles.indicator} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.astraBg,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
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
  logoArea: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoIcon: {
    fontSize: 64,
    color: colors.astraViolet,
    marginBottom: 16,
    textShadowColor: colors.astraViolet,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  appName: {
    fontSize: 52,
    color: colors.astraFg,
    lineHeight: 60,
  },
  tagline: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    color: colors.astraMuted,
    marginTop: 12,
    letterSpacing: 0.32,
  },
  actions: {
    width: '100%',
    gap: 16,
  },
  btn: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  btnPrimary: {
    backgroundColor: colors.astraFg,
  },
  btnPrimaryText: {
    color: colors.astraBg,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'DM Sans',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.astraBorder,
  },
  btnSecondaryText: {
    color: colors.astraFg,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'DM Sans',
  },
  altLogin: {
    alignItems: 'center',
    marginVertical: 12,
  },
  altLoginTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  legal: {
    fontFamily: 'DM Sans',
    fontSize: 11,
    color: colors.astraMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  legalHighlight: {
    color: colors.astraViolet,
  },
  glow: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 300,
    backgroundColor: colors.astraViolet,
    opacity: 0.05,
    borderRadius: 150,
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

export default RegisterStartScreen;
