import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@navigation/RootNavigator';
import { useAuthStore } from '@store/authStore';
import { configureForegroundNotifications, registerForPushNotificationsAsync } from '@utils/notifications';
import { subscriptionService } from '@services/subscriptionService';
import { queryClient } from '@services/queryClient';

export default function App() {
  const { isAuthenticated, user, setLoading } = useAuthStore();

  useEffect(() => {
    // App startup logic
    configureForegroundNotifications();
    subscriptionService.initialize();
    setLoading(false);
  }, [setLoading]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      registerForPushNotificationsAsync(user.id);
    }
  }, [isAuthenticated, user?.id]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </QueryClientProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
