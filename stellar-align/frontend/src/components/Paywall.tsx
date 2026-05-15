import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import Purchases from 'react-native-purchases';
import { colors } from '../theme/theme';
import { subscriptionService } from '../services/subscriptionService';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string; // Kept for API compatibility, though RevenueCat UI uses dashboard copy
}

/**
 * Modern RevenueCat Paywall Implementation
 * This component uses the native RevenueCatUI to present a paywall configured in the dashboard.
 */
export const Paywall: React.FC<PaywallProps> = ({ visible, onClose }) => {
  const [isReady, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if SDK is configured before showing UI
    const checkConfig = async () => {
      const configured = await Purchases.isConfigured();
      setIsInitialized(configured);
    };
    if (visible) {
      checkConfig();
    }
  }, [visible]);

  if (!visible) return null;

  // Fallback if SDK isn't ready (e.g. still in Expo Go)
  if (!isReady) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.fallbackContainer}>
          <ActivityIndicator size="large" color={colors.stellarViolet} />
          <View style={{ height: 20 }} />
          <Alert.alert(
            "Native SDK Required",
            "Subscription features require a development build. Please run the app on a simulator or device using 'npx expo run:ios' or 'android'.",
            [{ text: "OK", onPress: onClose }]
          );
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
});
