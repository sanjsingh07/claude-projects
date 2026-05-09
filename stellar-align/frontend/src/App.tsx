import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@navigation/RootNavigator';
import { useAuthStore } from '@store/authStore';
import { configureForegroundNotifications, registerForPushNotificationsAsync } from '@utils/notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function App() {
  const { isAuthenticated, user, setLoading } = useAuthStore();

  useEffect(() => {
    // App startup logic
    configureForegroundNotifications();
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
