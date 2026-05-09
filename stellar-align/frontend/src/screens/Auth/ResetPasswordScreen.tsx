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
import { CostarText } from '@components/CostarCard';
import { CostarBackground } from '@components/CostarBackground';
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
              Reset Password
            </CostarText>
            <CostarText style={styles.subtitle}>
              Please enter your new password below.
            </CostarText>
          </View>

          <View style={styles.form}>
            {!initialToken && (
              <View style={styles.inputGroup}>
                <CostarText style={styles.label}>Reset Token</CostarText>
                <TextInput
                  style={styles.input}
                  placeholder="Enter token from email"
                  placeholderTextColor={colors.astraMuted}
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <CostarText style={styles.label}>New Password</CostarText>
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={colors.astraMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <CostarText style={styles.label}>Confirm New Password</CostarText>
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={colors.astraMuted}
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
                <ActivityIndicator color={colors.astraBg} />
              ) : (
                <CostarText style={styles.btnText}>Reset Password</CostarText>
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
    backgroundColor: colors.astraBg,
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
    color: colors.astraFg,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    color: colors.astraFg,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.astraMuted,
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
    color: colors.astraMuted,
    marginBottom: 8,
    fontFamily: 'DM Sans',
  },
  input: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.astraBorder,
    color: colors.astraFg,
    fontSize: 16,
    paddingVertical: 8,
  },
  btn: {
    backgroundColor: colors.astraFg,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  btnText: {
    color: colors.astraBg,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;
