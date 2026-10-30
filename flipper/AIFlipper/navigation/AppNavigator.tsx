import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CaptureScreen from '../screens/CaptureScreen';
import ResultScreen from '../screens/ResultScreen';
import InventoryScreen from '../screens/InventoryScreen';
import LoginScreen from '../screens/LoginScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Colors, Typography } from '../constants/Theme';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ScanStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Capture" component={CaptureScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.glassStroke,
          height: 90,
          paddingBottom: 30,
        },
        tabBarActiveTintColor: Colors.primaryContainer,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarLabelStyle: {
          fontFamily: 'SpaceGrotesk_700Bold',
          fontSize: 10,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }
      }}
    >
      <Tab.Screen 
        name="ScanTab" 
        component={ScanStack} 
        options={{ title: 'SCAN' }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen} 
        options={{ title: 'VAULT' }} 
      />
      <Tab.Screen 
        name="Stats" 
        component={AnalyticsScreen} 
        options={{ title: 'STATS' }} 
      />
      <Tab.Screen 
        name="Config" 
        component={SettingsScreen} 
        options={{ title: 'CONFIG' }} 
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // While we check secure storage for an existing session, hold on a spinner so
  // the login screen doesn't flash for an already-signed-in user.
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // Gate on auth state rather than imperative navigation.replace: mounting only
  // the reachable screens means a signed-out user has no route into the tabs, and
  // logout (which flips isAuthenticated) unmounts them automatically.
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
