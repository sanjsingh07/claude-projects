import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors, Typography } from '../constants/Theme';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Mock login for now
    navigation.replace('Main');
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

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={[styles.loginButtonText, Typography.labelBold]}>INITIALIZE SESSION</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupLink}>
            <Text style={[styles.signupText, Typography.bodyMd, { color: Colors.onSurfaceVariant }]}>
              New operator? <Text style={{ color: Colors.secondary }}>Request Access</Text>
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
  loginButtonText: {
    color: Colors.onPrimary,
    fontSize: 16,
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
