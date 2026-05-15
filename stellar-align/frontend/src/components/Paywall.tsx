import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StellarText } from './StellarCard';
import { StellarButton } from './StellarButton';
import { colors, spacing } from '../theme/theme';
import { subscriptionService } from '../services/subscriptionService';
import { PurchasesPackage } from 'react-native-purchases';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
}

export const Paywall: React.FC<PaywallProps> = ({ visible, onClose, featureName }) => {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadOfferings();
    }
  }, [visible]);

  const loadOfferings = async () => {
    setLoading(true);
    const available = await subscriptionService.getOfferings();
    setPackages(available);
    setLoading(false);
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    const success = await subscriptionService.purchasePackage(pkg);
    setPurchasing(false);
    if (success) {
      Alert.alert('Welcome to Premium', 'Your subscription is now active! Enjoy full access to Stellar Align.');
      onClose();
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    const success = await subscriptionService.restorePurchases();
    setLoading(false);
    if (success) {
      Alert.alert('Restored', 'Your premium access has been restored.');
      onClose();
    } else {
      Alert.alert('Not Found', 'We couldn\'t find an active subscription for your account.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons 
            name="close" 
            size={28} 
            color={colors.stellarFg} 
            onPress={onClose} 
            style={styles.closeBtn}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.iconContainer}>
            <View style={styles.glow} />
            <Ionicons name="sparkles" size={80} color={colors.stellarViolet} />
          </View>

          <StellarText style={styles.title} serif italic>Stellar Premium</StellarText>
          <StellarText style={styles.subtitle}>
            Unlock {featureName || 'exclusive astrological insights'} and go deeper into your cosmic journey.
          </StellarText>

          <View style={styles.benefits}>
            <BenefitItem icon="calendar" text="Full Month & Year Forecasts" />
            <BenefitItem icon="heart" text="Unlimited Compatibility Checks" />
            <BenefitItem icon="chatbubbles" text="Advanced AI Cosmic Consultations" />
            <BenefitItem icon="star" text="Exclusive Natal Chart Details" />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.stellarViolet} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.purchaseSection}>
              {packages.length > 0 ? (
                packages.map((pkg) => (
                  <StellarButton
                    key={pkg.identifier}
                    title={`${pkg.product.title} - ${pkg.product.priceString}`}
                    onPress={() => handlePurchase(pkg)}
                    loading={purchasing}
                    variant="primary"
                    style={styles.purchaseBtn}
                  />
                ))
              ) : (
                <StellarText style={styles.noOfferings}>
                  No subscription packages found. Please try again later.
                </StellarText>
              )}

              <StellarText style={styles.restoreText} onPress={handleRestore}>
                Already a member? Restore Purchases
              </StellarText>
            </View>
          )}

          <StellarText style={styles.legalText}>
            Subscriptions will automatically renew unless canceled within 24 hours before the end of the current period. You can manage your subscription in your Account Settings.
          </StellarText>
        </ScrollView>
      </View>
    </Modal>
  );
};

const BenefitItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <View style={styles.benefitItem}>
    <Ionicons name={icon as any} size={20} color={colors.stellarPink} style={styles.benefitIcon} />
    <StellarText style={styles.benefitText}>{text}</StellarText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stellarBg,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  closeBtn: {
    padding: 10,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  iconContainer: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.stellarViolet,
    opacity: 0.2,
    blurRadius: 50,
  },
  title: {
    fontSize: 36,
    color: colors.stellarFg,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.stellarMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    fontFamily: 'DM Sans',
  },
  benefits: {
    width: '100%',
    gap: 20,
    marginBottom: 50,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.stellarSurface,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
  },
  benefitIcon: {
    marginRight: 15,
  },
  benefitText: {
    fontSize: 14,
    color: colors.stellarFg,
    fontFamily: 'DM Sans',
  },
  purchaseSection: {
    width: '100%',
    alignItems: 'center',
  },
  purchaseBtn: {
    width: '100%',
    marginBottom: 20,
  },
  noOfferings: {
    color: colors.stellarMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  restoreText: {
    fontSize: 12,
    color: colors.stellarViolet,
    textDecorationLine: 'underline',
    marginTop: 10,
  },
  legalText: {
    fontSize: 10,
    color: colors.stellarMuted,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 16,
    opacity: 0.7,
  },
});
