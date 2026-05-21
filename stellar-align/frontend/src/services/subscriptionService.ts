import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';
import { api } from './api';
import { queryClient } from './queryClient';

// RevenueCat Configuration
// const REVENUECAT_API_KEY = 'test_LEGbZQobWbZkWUXBbLFasDWNrFC'; // This is a public test key for the RevenueCat sandbox environment. It can be safely included in the app code. For production, you would use your actual API key, but it should still be safe to include in the app since it's not a secret key. The security of your RevenueCat account relies more on your backend and how you manage entitlements than on keeping the API key secret.
const REVENUECAT_API_KEY = 'appl_AGVMGiUHvPhDlAwZGsuSAqfIlHV';
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
      if (e.userCancelled) {
        return false;
      }

      console.error('Purchase failed', e);
      
      // Better feedback for simulated failures or standard errors
      const isSimulated = e.message?.includes('simulated') || e.code === 'PURCHASE_CANCELLED';
      const title = isSimulated ? 'Sandbox Test' : 'Purchase Error';
      const message = e.message || 'The purchase could not be completed at this time. Please try again later.';
      
      Alert.alert(title, message);
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
      if (e.userCancelled) return false;
      
      console.error('Restore failed', e);
      const message = e.message || 'Failed to restore purchases. Please ensure you are logged into the correct App Store account.';
      Alert.alert('Restore Error', message);
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
        
        // 3. Invalidate relevant queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['transits'] });
        queryClient.invalidateQueries({ queryKey: ['horoscope'] });
      }
      
      return isPremium;
    } catch (e) {
      console.error('Failed to sync premium status with backend', e);
      return isPremium;
    }
  }
}

export const subscriptionService = SubscriptionService.getInstance();
