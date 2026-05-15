import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { api } from './api';

const API_KEYS = {
  apple: 'goog_EXAMPLE_REVENUECAT_APPLE_KEY', // Replace with actual keys
  google: 'goog_EXAMPLE_REVENUECAT_GOOGLE_KEY',
};

class SubscriptionService {
  private static instance: SubscriptionService;

  private constructor() {}

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  public async initialize() {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    if (Platform.OS === 'ios') {
      await Purchases.configure({ apiKey: API_KEYS.apple });
    } else if (Platform.OS === 'android') {
      await Purchases.configure({ apiKey: API_KEYS.google });
    }

    // Sync with backend on init
    this.updateCustomerInfo();
  }

  public async getOfferings() {
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
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return this.handleCustomerInfo(customerInfo);
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('Purchase failed', e);
      }
      return false;
    }
  }

  public async restorePurchases(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return this.handleCustomerInfo(customerInfo);
    } catch (e) {
      console.error('Restore failed', e);
      return false;
    }
  }

  public async updateCustomerInfo(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.handleCustomerInfo(customerInfo);
    } catch (e) {
      console.error('Failed to get customer info', e);
      return false;
    }
  }

  private async handleCustomerInfo(customerInfo: CustomerInfo): Promise<boolean> {
    // RevenueCat "entitlement" check. We'll use "premium" as the ID.
    const isPremium = typeof customerInfo.entitlements.active['premium'] !== 'undefined';
    
    // Sync with our own backend
    try {
      await api.updateProfile({ isPremium });
      // Update local store
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().setUser({ ...user, isPremium });
      }
    } catch (e) {
      console.error('Failed to sync premium status with backend', e);
    }

    return isPremium;
  }
}

export const subscriptionService = SubscriptionService.getInstance();
