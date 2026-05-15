import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';
import { api } from './api';

const API_KEYS = {
  apple: 'goog_EXAMPLE_REVENUECAT_APPLE_KEY', // Replace with actual keys from RevenueCat
  google: 'goog_EXAMPLE_REVENUECAT_GOOGLE_KEY',
};

// Toggle this to true to bypass RevenueCat and test Premium features locally
const IS_DEV_BYPASS = true;

class SubscriptionService {
  private static instance: SubscriptionService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  public async initialize() {
    if (this.isInitialized) return;

    // Check if running in Expo Go (IAP doesn't work here)
    if (Constants.appOwnership === 'expo') {
      console.warn('SubscriptionService: Running in Expo Go. Native IAP is disabled.');
      if (IS_DEV_BYPASS) {
        console.log('SubscriptionService: Dev Bypass is active.');
      }
      return;
    }

    try {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

      if (Platform.OS === 'ios') {
        await Purchases.configure({ apiKey: API_KEYS.apple });
      } else if (Platform.OS === 'android') {
        await Purchases.configure({ apiKey: API_KEYS.google });
      }

      this.isInitialized = true;
      this.updateCustomerInfo();
    } catch (e) {
      console.error('SubscriptionService: Initialization failed', e);
    }
  }

  public async getOfferings() {
    if (IS_DEV_BYPASS) {
      // Mocked packages for testing the UI
      return [
        {
          identifier: 'stellar_premium_monthly',
          packageType: 'MONTHLY',
          product: {
            identifier: 'monthly_subscription',
            description: 'Full access to all cosmic insights',
            title: 'Stellar Monthly',
            price: 9.99,
            priceString: '$9.99',
            currencyCode: 'USD',
          },
        }
      ] as any[];
    }

    if (!this.isInitialized) return [];

    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        return offerings.current.availablePackages;
      }
    } catch (e) {
      console.error('Failed to get offerings', e);
    }
    return [];
  }

  public async purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
    if (IS_DEV_BYPASS) {
      // Simulate a successful purchase
      console.log('SubscriptionService: Mocking successful purchase of', pkg.identifier);
      return new Promise((resolve) => {
        setTimeout(async () => {
          const success = await this.syncWithBackend(true);
          resolve(success);
        }, 1500);
      });
    }

    if (!this.isInitialized) {
      Alert.alert('Error', 'Subscription service not initialized. Use a development build.');
      return false;
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return this.handleCustomerInfo(customerInfo);
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('Purchase failed', e);
        Alert.alert('Error', e.message || 'Purchase failed');
      }
      return false;
    }
  }

  public async restorePurchases(): Promise<boolean> {
    if (IS_DEV_BYPASS) return this.syncWithBackend(true);

    if (!this.isInitialized) return false;

    try {
      const customerInfo = await Purchases.restorePurchases();
      return this.handleCustomerInfo(customerInfo);
    } catch (e) {
      console.error('Restore failed', e);
      return false;
    }
  }

  public async updateCustomerInfo(): Promise<boolean> {
    if (IS_DEV_BYPASS) return true;
    if (!this.isInitialized) return false;

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.handleCustomerInfo(customerInfo);
    } catch (e) {
      console.error('Failed to get customer info', e);
      return false;
    }
  }

  private async handleCustomerInfo(customerInfo: CustomerInfo): Promise<boolean> {
    const isPremium = typeof customerInfo.entitlements.active['premium'] !== 'undefined';
    return this.syncWithBackend(isPremium);
  }

  private async syncWithBackend(isPremium: boolean): Promise<boolean> {
    try {
      // Update local store first for immediate UI feedback
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().setUser({ ...user, isPremium });
      }

      // Sync with server
      await api.client.patch('/users/profile', { isPremium });
      return true;
    } catch (e) {
      console.error('Failed to sync premium status with backend', e);
      return IS_DEV_BYPASS; // If bypass is on, treat as success locally
    }
  }
}

export const subscriptionService = SubscriptionService.getInstance();
