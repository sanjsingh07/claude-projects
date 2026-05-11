import React, { useState } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '@services/api';
import { StellarText } from '@components/StellarCard';
import { StellarBackground } from '@components/StellarBackground';
import { colors, spacing } from '@theme/theme';

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any, any>>();
  const route = useRoute<any>();
  const { token: initialToken } = route.params || {};

  const [token, setToken] = useState(initialToken || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!token) {
      Alert.alert('Error', 'Reset token is required. Please check your email link.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword(token, password);
      Alert.alert(
        'Success',
        'Your password has been reset successfully. You can now log in with your new password.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (e: any) {
      Alert.alert('Reset Failed', e.message || 'The reset token may be invalid or expired.');
    } finally {
      setIsLoading(false);
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
              Reset Password
            </StellarText>
            <StellarText style={styles.subtitle}>
              Please enter your new password below.
            </StellarText>
          </View>

          <View style={styles.form}>
            {!initialToken && (
              <View style={styles.inputGroup}>
                <StellarText style={styles.label}>Reset Token</StellarText>
                <TextInput
                  style={styles.input}
                  placeholder="Enter token from email"
                  placeholderTextColor={colors.stellarMuted}
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <StellarText style={styles.label}>New Password</StellarText>
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={colors.stellarMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <StellarText style={styles.label}>Confirm New Password</StellarText>
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={colors.stellarMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={[styles.btn, isLoading && { opacity: 0.7 }]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.stellarBg} />
              ) : (
                <StellarText style={styles.btnText}>Reset Password</StellarText>
              )}
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
    backgroundColor: colors.stellarBg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 24,
    color: colors.stellarFg,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    color: colors.stellarFg,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.stellarMuted,
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.stellarMuted,
    marginBottom: 8,
    fontFamily: 'DM Sans',
  },
  input: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder,
    color: colors.stellarFg,
    fontSize: 16,
    paddingVertical: 8,
  },
  btn: {
    backgroundColor: colors.stellarFg,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  btnText: {
    color: colors.stellarBg,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;
