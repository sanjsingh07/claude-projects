import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme/theme';
import { subscriptionService } from '../services/subscriptionService';
import { 
  StellarText, 
  StellarButton, 
  StellarBackground,
} from '@components';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
}

export const Paywall: React.FC<PaywallProps> = ({ visible, onClose, featureName }) => {
  const [isReady, setIsInitialized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    const checkConfig = async () => {
      setIsChecking(true);
      const configured = await Purchases.isConfigured();
      setIsInitialized(configured);
      
      if (configured) {
        const available = await subscriptionService.getOfferings();
        setPackages(available);
        
        // Default to yearly if available, otherwise monthly
        const yearly = available.find(p => p.packageType === 'ANNUAL');
        const monthly = available.find(p => p.packageType === 'MONTHLY');
        setSelectedPackage(yearly || monthly || available[0] || null);
      }
      
      setIsChecking(false);
    };

    if (visible) {
      checkConfig();
    }
  }, [visible]);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setIsPurchasing(true);
    const success = await subscriptionService.purchasePackage(selectedPackage);
    setIsPurchasing(false);
    
    if (success) {
      onClose();
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    const success = await subscriptionService.restorePurchases();
    setIsPurchasing(false);
    
    if (success) {
      onClose();
    }
  };

  const handleOpenUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Could not open the link. Please try again later.');
    }
  };

  if (!visible) return null;

  // Fallback if SDK isn't ready (e.g. still in Expo Go)
  if (isChecking) {
    return (
      <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.fallbackContainer}>
          <StellarBackground />
          <ActivityIndicator size="large" color={colors.stellarViolet} />
        </View>
      </Modal>
    );
  }

  if (!isReady) {
    return (
      <Modal visible={visible} animationType="slide">
        <SafeAreaView style={styles.fallbackContainer}>
          <StellarBackground />
          <View style={styles.errorContent}>
            <Ionicons name="construct-outline" size={64} color={colors.stellarViolet} />
            <StellarText variant="heading3" align="center" style={styles.errorTitle}>
              Native SDK Required
            </StellarText>
            <StellarText variant="body" align="center" style={styles.errorText}>
              Subscription features require a development build to interact with the App Store or Google Play. 
              {"\n\n"}
              Please run the app using:{"\n"}
              <StellarText variant="body" bold color={colors.stellarViolet}>npx expo run:ios</StellarText> or <StellarText variant="body" bold color={colors.stellarViolet}>android</StellarText>
            </StellarText>
            <StellarButton variant="primary" onPress={onClose} fullWidth>
              Return to App
            </StellarButton>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  const features = [
    { id: '1', text: 'Daily Personalized Insights', icon: 'sparkles' },
    { id: '2', text: 'Unlimited AI Astrologer Chat', icon: 'chatbubbles' },
    { id: '3', text: 'Deep Transit & Aspect Forecasts', icon: 'planet' },
    { id: '4', text: 'Sync with Lunar Cycles', icon: 'moon' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <StellarBackground />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
            <Ionicons name="close" size={28} color={colors.stellarFg} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <StellarText variant="heading1" align="center" serif italic style={styles.title}>
              Unlock the Stars
            </StellarText>
            <StellarText variant="heading4" align="center" color={colors.stellarMuted} style={styles.subtitle}>
              Full access to your cosmic journey
            </StellarText>
          </View>

          <View style={styles.featureList}>
            {features.map(f => (
              <View key={f.id} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon as any} size={20} color={colors.stellarViolet} />
                </View>
                <StellarText variant="body" style={styles.featureText}>{f.text}</StellarText>
              </View>
            ))}
          </View>

          <View style={styles.packagesContainer}>
            {packages.length === 0 ? (
              <View style={styles.emptyPackages}>
                <ActivityIndicator color={colors.stellarViolet} />
                <StellarText variant="bodySmall" align="center" style={{marginTop: 10}}>
                  Loading offerings...
                </StellarText>
              </View>
            ) : (
              packages.map(pkg => (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.packageCard,
                    selectedPackage?.identifier === pkg.identifier && styles.selectedPackageCard
                  ]}
                  onPress={() => setSelectedPackage(pkg)}
                  activeOpacity={0.8}
                >
                  <View style={styles.packageInfo}>
                    <StellarText variant="label" color={selectedPackage?.identifier === pkg.identifier ? colors.stellarViolet : colors.stellarFg}>
                      {pkg.packageType === 'ANNUAL' ? 'Yearly Access' : pkg.packageType === 'MONTHLY' ? 'Monthly Plan' : pkg.product.title}
                    </StellarText>
                    {pkg.packageType === 'ANNUAL' && (
                      <View style={styles.bestValueBadge}>
                        <StellarText variant="caption" color={colors.black} bold>Best Value</StellarText>
                      </View>
                    )}
                  </View>
                  <View style={styles.priceInfo}>
                    <StellarText variant="heading4" color={colors.stellarFg}>
                      {pkg.product.priceString}
                    </StellarText>
                    <StellarText variant="caption" color={colors.stellarMuted}>
                      {pkg.packageType === 'ANNUAL' ? '/year' : '/month'}
                    </StellarText>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.actionSection}>
            <StellarButton 
              onPress={handlePurchase} 
              fullWidth 
              size="large"
              loading={isPurchasing}
              disabled={!selectedPackage || isPurchasing}
              style={styles.mainButton}
            >
              Unlock Premium Access
            </StellarButton>
            
            <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
              <StellarText variant="caption" align="center" color={colors.stellarMuted}>
                Restore Purchases
              </StellarText>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <StellarText variant="caption" align="center" color={colors.stellarMuted} style={styles.footerText}>
              Recurring billing. Cancel anytime in Store settings.{'\n'}
              By continuing, you agree to our{' '}
              <StellarText 
                variant="caption" 
                color={colors.stellarViolet}
                onPress={() => handleOpenUrl('https://stellaralign.com/terms')}
              >
                Terms
              </StellarText>{' '}
              and{' '}
              <StellarText 
                variant="caption" 
                color={colors.stellarViolet}
                onPress={() => handleOpenUrl('https://stellaralign.com/privacy')}
              >
                Privacy Policy
              </StellarText>.
            </StellarText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stellarBg,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 10,
  },
  heroSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 38,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  featureList: {
    marginBottom: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(157, 141, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 15,
    color: colors.stellarFg,
  },
  packagesContainer: {
    marginBottom: 30,
    gap: 12,
  },
  packageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.stellarSurface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.stellarBorder,
  },
  selectedPackageCard: {
    borderColor: colors.stellarViolet,
    backgroundColor: 'rgba(157, 141, 241, 0.05)',
  },
  packageInfo: {
    flex: 1,
  },
  bestValueBadge: {
    backgroundColor: colors.stellarAmber,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  actionSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  mainButton: {
    backgroundColor: colors.stellarViolet,
    borderColor: colors.stellarViolet,
    height: 60,
    borderRadius: 30,
  },
  restoreButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  footer: {
    marginTop: 10,
  },
  footerText: {
    fontSize: 10,
    lineHeight: 16,
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: colors.stellarBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    padding: 30,
    alignItems: 'center',
    width: '100%',
  },
  errorTitle: {
    marginTop: 20,
    marginBottom: 16,
  },
  errorText: {
    marginBottom: 40,
    lineHeight: 24,
    opacity: 0.8,
  },
  emptyPackages: {
    padding: 40,
    alignItems: 'center',
  }
});
