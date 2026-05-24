import 'react-native-url-polyfill/auto';
import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { 
  DMSans_400Regular, 
  DMSans_500Medium, 
  DMSans_700Bold 
} from '@expo-google-fonts/dm-sans';
import { 
  InstrumentSerif_400Regular, 
  InstrumentSerif_400Regular_Italic 
} from '@expo-google-fonts/instrument-serif';

import { RootNavigator } from '@navigation/RootNavigator';
import { useAuthStore } from '@store/authStore';
import { configureForegroundNotifications, registerForPushNotificationsAsync } from '@utils/notifications';
import { subscriptionService } from '@services/subscriptionService';
import { queryClient } from '@services/queryClient';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const { isAuthenticated, user, setLoading } = useAuthStore();

  const [fontsLoaded, fontError] = useFonts({
    'DM Sans': DMSans_400Regular,
    'DMSans-Regular': DMSans_400Regular,
    'DMSans-Medium': DMSans_500Medium,
    'DMSans-Bold': DMSans_700Bold,
    'Instrument Serif': InstrumentSerif_400Regular,
    'InstrumentSerif-Regular': InstrumentSerif_400Regular,
    'InstrumentSerif-Italic': InstrumentSerif_400Regular_Italic,
  });

  useEffect(() => {
    // App startup logic
    configureForegroundNotifications();
    subscriptionService.initialize();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      subscriptionService.identifyCurrentUser();
      registerForPushNotificationsAsync(user.id);
    }
  }, [isAuthenticated, user?.id]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
      setLoading(false);
    }
  }, [fontsLoaded, fontError, setLoading]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </QueryClientProvider>
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}
