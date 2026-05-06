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
import {
  ProfileHero,
  BirthDataGrid,
  NotificationSection,
  SignOutButton,
} from '../components/ProfileComponents';

type RootStackParamList = {
  Settings: undefined;
  Profile: undefined;
};

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.getCurrentUser();
      return (response as any).data;
    },
  });

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.getSettings();
      return (response as any).data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (patch: any) => {
      const response = await api.updateSettings(patch);
      return (response as any).data;
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

  const birthDataItems = [
    { key: 'Date', val: profile.birthData.formattedDate, sub: `${profile.astrology.sun?.sign || ''} · ♓` },
    { key: 'Time', val: profile.birthData.time, sub: profile.birthData.isTimeApproximate ? 'approx' : 'known' },
    { key: 'Place', val: profile.birthData.place.city, sub: `${profile.birthData.place.region} · ${profile.birthData.place.latitude.toFixed(2)}°N` },
    { key: 'Timezone', val: profile.birthData.timezone.label, sub: `UTC ${profile.birthData.timezone.offset >= 0 ? '+' : ''}${profile.birthData.timezone.offset}` },
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

  return (
    <SafeAreaView style={styles.container}>
      <ProfileHero
        name={profile.name}
        avatarInitial={profile.avatarInitial}
        subtitle={`Born ${profile.birthData.formattedDate} · ${profile.birthData.time} · ${profile.birthData.place.city}, ${profile.birthData.place.region}`}
        badges={profile.badges}
        onSettingsPress={() => navigation.navigate('Settings')}
      />
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <BirthDataGrid items={birthDataItems} />
        </View>
        <View style={styles.section}>
          <NotificationSection items={notificationItems} />
        </View>
        <View style={styles.section}>
          <SignOutButton onPress={() => logout()} />
        </View>
        <View style={{ height: 40 }} />
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
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
});
