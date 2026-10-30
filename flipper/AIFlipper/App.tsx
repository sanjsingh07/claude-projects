import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './context/AuthContext';
import { useFonts, SpaceGrotesk_700Bold, SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk';
import { Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from './constants/Theme';
import { View, ActivityIndicator } from 'react-native';

SplashScreen.preventAutoHideAsync();

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.onSurface,
    border: Colors.outline,
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold,
    SpaceGrotesk_600SemiBold,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer theme={AppTheme}>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
