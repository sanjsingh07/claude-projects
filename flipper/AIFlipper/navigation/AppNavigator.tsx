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
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
