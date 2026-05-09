import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@store/authStore';
import { LoginScreen } from '@screens/Auth/LoginScreen';
import { RegisterScreen } from '@screens/Auth/RegisterScreen';
import { RegisterStartScreen } from '@screens/Auth/RegisterStartScreen';
import { MainNavigator } from './MainNavigator';
import { SettingsScreen } from '@screens/SettingsScreen';

export type RootStackParamList = {
  RegisterStart: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  // Use selector to properly subscribe to store changes
  const { isAuthenticated, user } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
  }));

  const isProfileComplete = user?.profileCompleted;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName={isAuthenticated && !isProfileComplete ? 'Register' : undefined}
    >
      {isAuthenticated && isProfileComplete ? (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <>
          {!isAuthenticated && (
            <Stack.Screen name="RegisterStart" component={RegisterStartScreen} />
          )}
          {!isAuthenticated && (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            initialParams={isAuthenticated && !isProfileComplete ? { step: 2, socialUser: user } : undefined}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
