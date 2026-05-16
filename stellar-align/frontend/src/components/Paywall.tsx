import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
} from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import Purchases from 'react-native-purchases';
import { colors } from '../theme/theme';
import { subscriptionService } from '../services/subscriptionService';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
}

/**
 * Modern RevenueCat Paywall Implementation
 * This component uses the native RevenueCatUI to present a paywall configured in the dashboard.
 */
export const Paywall: React.FC<PaywallProps> = ({ visible, onClose }) => {
  const [isReady, setIsInitialized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if SDK is configured before showing UI
    const checkConfig = async () => {
      setIsChecking(true);
      const configured = await Purchases.isConfigured();
      setIsInitialized(configured);
      setIsChecking(false);
    };
    if (visible) {
      checkConfig();
    }
  }, [visible]);

  if (!visible) return null;

  // Fallback if SDK isn't ready (e.g. still in Expo Go)
  if (isChecking) {
    return (
      <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.fallbackContainer}>
          <ActivityIndicator size="large" color={colors.stellarViolet} />
        </View>
      </Modal>
    );
  }

  if (!isReady) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.fallbackContainer}>
          <Text style={styles.errorTitle}>Native SDK Required</Text>
          <Text style={styles.errorText}>
            Subscription features require a development build to interact with the App Store or Google Play. 
            {"\n\n"}
            Please run the app using:{"\n"}
            <Text style={{ fontWeight: '700' }}>npx expo run:ios</Text> or <Text style={{ fontWeight: '700' }}>android</Text>
          </Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <RevenueCatUI.Paywall
      onDismiss={onClose}
      onPurchaseCompleted={() => {
        subscriptionService.refreshCustomerInfo();
        onClose();
      }}
      onRestoreCompleted={() => {
        subscriptionService.refreshCustomerInfo();
        onClose();
      }}
    />
  );
};

/**
 * Helper to show the Customer Center for managing subscriptions
 */
export const showCustomerCenter = async () => {
  try {
    const configured = await Purchases.isConfigured();
    if (!configured) {
      Alert.alert("Native SDK Required", "Subscription management is only available in a development build.");
      return;
    }
    await RevenueCatUI.presentCustomerCenter();
  } catch (e) {
    console.error('Failed to present customer center', e);
    Alert.alert('Error', 'Could not open subscription management.');
  }
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    backgroundColor: colors.stellarBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    color: colors.stellarFg,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.stellarMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  closeBtn: {
    backgroundColor: colors.stellarViolet,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  closeBtnText: {
    color: colors.stellarFg,
    fontWeight: '600',
  },
});
