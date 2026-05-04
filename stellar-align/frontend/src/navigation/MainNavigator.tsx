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
  Daily: undefined;
  Chart: undefined;
  Transits: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
  const renderTabIcon = (icon: string, color: string) => (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.tabRule, { opacity: color === colors.astraFg ? 1 : 0 }]} />
      <CostarText style={{ fontSize: 20, color, marginTop: 2 }}>{icon}</CostarText>
    </View>
  );

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
        name="Daily"
        component={TodayScreen}
        options={{
          tabBarIcon: ({ color }) => renderTabIcon('✦', color),
          tabBarLabel: 'Daily',
        }}
      />
      <Tab.Screen
        name="Transits"
        component={TransitsScreen}
        options={{
          tabBarIcon: ({ color }) => renderTabIcon('☇', color),
          tabBarLabel: 'Transits',
        }}
      />
      <Tab.Screen
        name="Chart"
        component={ChartScreen}
        options={{
          tabBarIcon: ({ color }) => renderTabIcon('⊙', color),
          tabBarLabel: 'Chart',
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color }) => renderTabIcon('💬', color),
          tabBarLabel: 'Chat',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => renderTabIcon('◎', color),
          tabBarLabel: 'Profile',
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
