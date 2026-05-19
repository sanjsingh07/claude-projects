import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';
import { api } from './api';

// RevenueCat Configuration
const REVENUECAT_API_KEY = 'test_LEGbZQobWbZkWUXBbLFasDWNrFC';
const PRO_ENTITLEMENT_ID = 'Stellar Align Pro';

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

  /**
   * Initialize the RevenueCat SDK
   */
  public async initialize() {
    if (this.isInitialized) return;

    // Check if running in Expo Go (Native IAP doesn't work here)
    if (Constants.appOwnership === 'expo') {
      console.warn('SubscriptionService: Running in Expo Go. Native IAP is disabled.');
      return;
    }

    try {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG); // Use DEBUG for integration phase
      
      await Purchases.configure({ 
        apiKey: REVENUECAT_API_KEY,
        // appUserID: useAuthStore.getState().user?.id // Optional: link to your own DB ID
      });

      this.isInitialized = true;
      console.log('SubscriptionService: Configured successfully');
      
      // Initial check of customer info
      this.refreshCustomerInfo();
    } catch (e) {
      console.error('SubscriptionService: Initialization failed', e);
    }
  }

  /**
   * Check current subscription status and sync with local store and backend
   */
  public async refreshCustomerInfo(): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.handleCustomerInfoUpdate(customerInfo);
    } catch (e) {
      console.error('Failed to get customer info', e);
      return false;
    }
  }

  /**
   * Get available offerings (products)
   */
  public async getOfferings() {
    if (!this.isInitialized) return [];

    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        return offerings.current.availablePackages;
      }
    } catch (e) {
      console.error('Failed to get offerings', e);
    }
    return [];
  }

  /**
   * Perform a purchase
   */
  public async purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
    if (!this.isInitialized) {
      Alert.alert('Integration Note', 'Native IAP requires a development build. Expo Go is not supported.');
      return false;
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return this.handleCustomerInfoUpdate(customerInfo);
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('Purchase failed', e);
        Alert.alert('Purchase Error', e.message || 'The purchase could not be completed.');
      }
      return false;
    }
  }

  /**
   * Restore previous purchases
   */
  public async restorePurchases(): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPro = this.checkEntitlement(customerInfo);
      
      if (isPro) {
        Alert.alert('Restored', 'Your Pro access has been restored.');
      } else {
        Alert.alert('Restore Info', 'No active subscriptions were found for this account.');
      }
      
      return this.handleCustomerInfoUpdate(customerInfo);
    } catch (e: any) {
      console.error('Restore failed', e);
      Alert.alert('Restore Error', e.message || 'Failed to restore purchases.');
      return false;
    }
  }

  /**
   * Internal helper to check the Pro entitlement
   */
  private checkEntitlement(customerInfo: CustomerInfo): boolean {
    return typeof customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== 'undefined';
  }

  /**
   * Synchronize RevenueCat status with local State and Remote Backend
   */
  private async handleCustomerInfoUpdate(customerInfo: CustomerInfo): Promise<boolean> {
    const isPremium = this.checkEntitlement(customerInfo);
    
    try {
      // 1. Update local Zustand store
      const { user, isAuthenticated } = useAuthStore.getState();
      
      if (user && user.isPremium !== isPremium) {
        useAuthStore.getState().setUser({ ...user, isPremium });
      }

      // 2. Sync with Backend API - only if authenticated
      if (isAuthenticated) {
        await api.client.patch('/users/profile', { isPremium });
      }
      
      return isPremium;
    } catch (e) {
      console.error('Failed to sync premium status with backend', e);
      return isPremium;
    }
  }
}

export const subscriptionService = SubscriptionService.getInstance();
