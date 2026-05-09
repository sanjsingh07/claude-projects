import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/RootNavigator';
import { CostarText } from '@components/CostarCard';
import { CostarBackground } from '@components/CostarBackground';
import { colors, spacing } from '@theme/theme';

export const RegisterStartScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <CostarBackground />
      <StatusBar barStyle="light-content" />
      
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
    // Note: React Native doesn't have CSS radial-gradient/blur directly on View easily without extra libs, 
    // but we can approximate with shadow or just leave as a subtle circle for now.
    // If react-native-svg or similar is available, we could do more.
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
