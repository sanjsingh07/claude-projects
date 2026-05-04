import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@theme/theme';
import { TodayScreen } from '@screens/TodayScreen';
import { ProfileScreen } from '@screens/ProfileScreen';
import { ChartScreen } from '@screens/ChartScreen';
import { ChatScreen } from '@screens/ChatScreen';
import { TransitsScreen } from '@screens/TransitsScreen';
import { CostarText } from '@components';

export type MainTabParamList = {
  Today: undefined;
  Chart: undefined;
  Transits: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.astraFg,
        tabBarInactiveTintColor: colors.astraMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.tabRule, { opacity: color === colors.astraFg ? 1 : 0 }]} />
              <CostarText style={{ fontSize: 20, color, marginTop: 2 }}>✦</CostarText>
            </View>
          ),
          tabBarLabel: 'DAILY',
        }}
      />
      <Tab.Screen
        name="TRANSITS"
        component={TransitsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <CostarText style={{ fontSize: 20, color }}>☇</CostarText>
          ),
          tabBarLabel: 'TRANSITS',
        }}
      />
      <Tab.Screen
        name="Chart"
        component={ChartScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <CostarText style={{ fontSize: 20, color }}>⊙</CostarText>
          ),
          tabBarLabel: 'CHART',
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen} // Placeholder
        options={{
          tabBarIcon: ({ color }) => (
            <CostarText style={{ fontSize: 20, color }}>💬</CostarText>
          ),
          tabBarLabel: 'CHAT',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <CostarText style={{ fontSize: 20, color }}>◎</CostarText>
          ),
          tabBarLabel: 'PROFILE',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.astraBg,
    borderTopColor: colors.astraBorder,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 5,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    fontFamily: 'DM Sans',
  },
  tabRule: {
    width: 16,
    height: 2,
    backgroundColor: colors.astraViolet,
    borderRadius: 1,
    position: 'absolute',
    top: -10,
  },
});

export default MainNavigator;
