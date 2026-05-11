import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@services/api';
import { colors } from '@theme/theme';
import { useAuthStore } from '@store/authStore';
import { useTransitStore } from '@store/transitStore';
import { UserProfile } from '@types';
import { getSignEmoji, formatSignName } from '@utils/astrology';
import {
  ProfileHero,
  BirthDataGrid,
  ToggleSection,
} from '../components/ProfileComponents';

type RootStackParamList = {
  Settings: undefined;
  Profile: undefined;
};

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { filters, toggleFilter } = useTransitStore();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.getCurrentUser();
      return response.data as UserProfile;
    },
  });

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.getSettings();
      return response.data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (patch: any) => {
      const response = await api.updateSettings(patch);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update settings');
    },
  });

  if (isProfileLoading || isSettingsLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.astraViolet} />
      </View>
    );
  }

  if (!profile || !settings) return null;

  const sunSign = profile.astrology.sun?.sign || '';
  const moonSign = profile.astrology.moon?.sign || '';
  const risingSign = profile.astrology.rising?.sign || '';
  
  const sunEmoji = getSignEmoji(sunSign);
  const moonEmoji = getSignEmoji(moonSign);
  const risingEmoji = getSignEmoji(risingSign);

  const big3 = [
    sunSign ? `${formatSignName(sunSign)} Sun` : '',
    moonSign ? `${formatSignName(moonSign)} Moon` : '',
    risingSign ? `${formatSignName(risingSign)} Rising` : '',
  ].filter(Boolean).join(' · ');

  const birthDataItems = [
    { 
      key: 'Date', 
      val: profile.birthData.formattedDate, 
      sub: sunSign && risingSign 
        ? `${formatSignName(sunSign)} ${sunEmoji} · ${formatSignName(risingSign)} ${risingEmoji}` 
        : sunSign ? `${formatSignName(sunSign)} ${sunEmoji}` : ''
    },
    { key: 'Time', val: profile.birthData.time, sub: profile.birthData.isTimeApproximate ? 'approx' : 'known' },
    { 
      key: 'Place', 
      val: profile.birthData.place.city, 
      sub: `${profile.birthData.place.region || profile.birthData.place.country} · ${Math.abs(profile.birthData.place.latitude).toFixed(2)}°${profile.birthData.place.latitude >= 0 ? 'N' : 'S'}` 
    },
    { 
      key: 'Timezone', 
      val: profile.birthData.timezone.label, 
      sub: `GMT ${profile.birthData.timezone.offset >= 0 ? '+' : ''}${profile.birthData.timezone.offset}` 
    },
  ];

  const notificationItems = [
    {
      k: 'Daily reading',
      sub: `Every morning at ${settings.notifications.dailyReading.time}`,
      on: settings.notifications.dailyReading.enabled,
      onToggle: () => updateSettingsMutation.mutate({
        notifications: { dailyReading: { enabled: !settings.notifications.dailyReading.enabled } }
      })
    },
    {
      k: 'Transit alerts',
      sub: settings.notifications.transitAlerts.level === 'major' ? 'Major aspects only' : 'All aspects',
      on: settings.notifications.transitAlerts.enabled,
      onToggle: () => updateSettingsMutation.mutate({
        notifications: { transitAlerts: { enabled: !settings.notifications.transitAlerts.enabled } }
      })
    },
    {
      k: 'Compatibility updates',
      sub: `Weekly · ${settings.notifications.compatibilityUpdates.frequency}`,
      on: settings.notifications.compatibilityUpdates.enabled,
      onToggle: () => updateSettingsMutation.mutate({
        notifications: { compatibilityUpdates: { enabled: !settings.notifications.compatibilityUpdates.enabled } }
      })
    },
    {
      k: 'Birthday reminders',
      sub: 'Friends · 1 day before',
      on: settings.notifications.birthdayReminders.enabled,
      onToggle: () => updateSettingsMutation.mutate({
        notifications: { birthdayReminders: { enabled: !settings.notifications.birthdayReminders.enabled } }
      })
    },
  ];

  const transitItems = [
    {
      k: 'Major events',
      sub: 'Conjunctions, squares, oppositions, etc.',
      on: filters.showMajor,
      onToggle: () => toggleFilter('showMajor')
    },
    {
      k: 'Minor events',
      sub: 'Sextiles, trines, and subtle aspects',
      on: filters.showMinor,
      onToggle: () => toggleFilter('showMinor')
    },
    {
      k: 'Shadow events',
      sub: 'Pre-retrograde and post-retrograde periods',
      on: filters.showShadow,
      onToggle: () => toggleFilter('showShadow')
    },
    {
      k: 'Real-time events',
      sub: 'Current astronomical alignments',
      on: filters.showRealTime,
      onToggle: () => toggleFilter('showRealTime')
    },
    {
      k: 'Personal events',
      sub: 'Transits specifically affecting your chart',
      on: filters.showPersonal,
      onToggle: () => toggleFilter('showPersonal')
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ProfileHero
        name={profile.name}
        avatarInitial={profile.avatarInitial}
        subtitle={big3 || `Born ${profile.birthData.formattedDate}`}
        badges={profile.badges}
        onSettingsPress={() => navigation.navigate('Settings')}
      />
      <ScrollView 
        style={styles.body} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <BirthDataGrid items={birthDataItems} />
        </View>
        <View style={styles.section}>
          <ToggleSection title="Notifications" items={notificationItems} />
        </View>
        <View style={styles.section}>
          <ToggleSection title="Transit Settings" items={transitItems} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.astraBg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.astraBg,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 100, // Extra padding to avoid footer/tabbar overlap
  },
  section: {
    marginBottom: 16,
  },
});
