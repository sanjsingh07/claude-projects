import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Colors, Typography } from '../constants/Theme';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/ApiClient';

const LoginScreen = () => {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No navigation.replace here anymore: a successful login/register flips the
  // AuthContext, and AppNavigator swaps Login out for Main on its own. The screen
  // only has to report progress and errors.
  const handleSubmit = async () => {
    if (submitting) return;
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (mode === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(trimmedEmail, password);
      } else {
        await register(trimmedEmail, password);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError(null);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={[styles.logoText, Typography.displayProfit, { color: Colors.primary }]}>AI</Text>
          <Text style={[styles.logoText, Typography.displayProfit, { color: '#fff' }]}>FLIPPER</Text>
          <Text style={[styles.subtitle, Typography.bodyMd]}>Your Pocket Buying Agent</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, Typography.labelBold]}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="operator@velocity.io"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, Typography.labelBold]}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error && (
            <Text style={[styles.errorText, Typography.bodyMd]}>{error}</Text>
          )}

          <TouchableOpacity
            style={[styles.loginButton, submitting && styles.loginButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <Text style={[styles.loginButtonText, Typography.labelBold]}>
                {mode === 'login' ? 'INITIALIZE SESSION' : 'CREATE ACCOUNT'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupLink} onPress={toggleMode} disabled={submitting}>
            <Text style={[styles.signupText, Typography.bodyMd, { color: Colors.onSurfaceVariant }]}>
              {mode === 'login' ? (
                <>New operator? <Text style={{ color: Colors.secondary }}>Create Account</Text></>
              ) : (
                <>Already registered? <Text style={{ color: Colors.secondary }}>Sign In</Text></>
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 60,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    lineHeight: 45,
  },
  subtitle: {
    marginTop: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    color: Colors.outline,
    marginBottom: 10,
  },
  input: {
    height: 60,
    backgroundColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 20,
    color: '#fff',
    borderWidth: 1,
    borderColor: Colors.outlineVariant || '#3b4a3d',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: Colors.onPrimary,
    fontSize: 16,
  },
  errorText: {
    color: Colors.error || '#ff6b6b',
    marginTop: 4,
    textAlign: 'center',
  },
  signupLink: {
    marginTop: 30,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
  },
});

export default LoginScreen;
