import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
  Platform,
  TouchableOpacity,
  Modal,
} from 'react-native';
import axios from 'axios';
import { DateTime } from 'luxon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@services/api';
import { colors } from '@theme/theme';
import { useAuthStore } from '@store/authStore';
import {
  SettingsHeader,
  SettingsSection,
  SettingsRow,
  Toggle,
  ValueBadge,
  SelectionModal,
  LocationSelectionModal,
  LocationSuggestion,
  BirthDataEditModal,
  TextInputModal,
  TimezoneSelectionModal,
} from '../components/SettingsComponents';
import { CustomScrollerPicker } from '../components/CustomScrollerPicker';

import { useTransitStore } from '@store/transitStore';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const { filters: transitFilters, toggleFilter: toggleTransitFilter } = useTransitStore();

  const [activeModal, setActiveModal] = useState<'chartStyle' | 'divisionalChart' | 'accentColor' | 'location' | 'birthData' | 'name' | 'bio' | 'alertLevel' | 'compFreq' | 'timezone' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDailyTimePicker, setShowDailyTimePicker] = useState(false);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [pickerInitialValue, setPickerInitialValue] = useState<Date | null>(null);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.getCurrentUser();
      return (response as any).data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.getSettings();
      return (response as any).data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
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

  const updateProfileMutation = useMutation({
    mutationFn: async (patch: any) => {
      const response = await api.updateProfile(patch);
      return (response as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      Alert.alert('Success', 'Profile updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update profile');
    },
  });

  if (isProfileLoading || isSettingsLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.stellarViolet} />
      </View>
    );
  }

  if (!profile || !settings) return null;

  const chartStyleOptions = [
    { label: 'Western', value: 'western' },
    { label: 'Vedic', value: 'vedic' },
  ];

  const divisionalChartOptions = [
    { label: 'D1 (Rashi)', value: 'D1' },
    { label: 'D2 (Hora)', value: 'D2' },
    { label: 'D4 (Chaturthamsa)', value: 'D4' },
    { label: 'D9 (Navamsa)', value: 'D9' },
    { label: 'D10 (Dasamsa)', value: 'D10' },
  ];

  const accentColorOptions = [
    { label: 'Violet', value: 'violet' },
    { label: 'Pink', value: 'pink' },
    { label: 'Amber', value: 'amber' },
  ];

  const alertLevelOptions = [
    { label: 'Major aspects only', value: 'major' },
    { label: 'All aspects', value: 'all' },
  ];

  const compFreqOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  const getBirthDate = () => {
    if (!profile?.birthData?.date) return new Date();
    
    const dateStr = profile.birthData.date;
    if (dateStr.length === 10 && dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateStr);
  };

  const getBirthTimeDate = () => {
    const fallback = new Date(1970, 0, 1, 12, 0, 0);
    if (!profile?.birthData?.time) {
      return fallback;
    }
    
    // Parse 'h:mm a' format (e.g., '11:30 AM')
    const dt = DateTime.fromFormat(profile.birthData.time, 'h:mm a');
    if (dt.isValid) {
      const date = new Date(1970, 0, 1);
      date.setHours(dt.hour, dt.minute, 0, 0);
      return date;
    }
    
    return fallback;
  };

  const getDailyNotificationDate = () => {
    const fallback = new Date(1970, 0, 1, 8, 0, 0);
    if (!settings?.notifications?.dailyReading?.time) {
      return fallback;
    }
    
    let dt = DateTime.fromFormat(settings.notifications.dailyReading.time, 'HH:mm');
    if (!dt.isValid) {
      dt = DateTime.fromFormat(settings.notifications.dailyReading.time, 'h:mm a');
    }

    if (dt.isValid) {
      const date = new Date(1970, 0, 1);
      date.setHours(dt.hour, dt.minute, 0, 0);
      return date;
    }
    
    return fallback;
  };

  const handleLocationSelect = async (location: LocationSuggestion) => {
    setIsLookupLoading(true);
    try {
      const response = await api.getTimezone(location.lat, location.lon);
      const timezone = response.data?.timezone;
      
      updateProfileMutation.mutate({
        birthLocationName: location.displayName,
        birthLatitude: parseFloat(location.lat),
        birthLongitude: parseFloat(location.lon),
        birthTimezone: timezone,
      });
    } catch (error) {
      console.error('Timezone lookup error:', error);
      updateProfileMutation.mutate({
        birthLocationName: location.displayName,
        birthLatitude: parseFloat(location.lat),
        birthLongitude: parseFloat(location.lon),
      });
    } finally {
      setIsLookupLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SettingsHeader onBack={() => navigation.goBack()} />
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <SettingsSection label="Profile">
          <SettingsRow
            label="Name"
            sub={profile.name}
            onPress={() => setActiveModal('name')}
          />
          <SettingsRow
            label="Bio"
            sub={profile.bio || 'Add a bio...'}
            onPress={() => setActiveModal('bio')}
          />
          <SettingsRow
            label="Birth Data"
            sub={`${profile.birthData.formattedDate}${profile.birthTimeUnknown ? '' : ' at ' + profile.birthData.time}${profile.birthTimeUnknown ? ' (Time Unknown)' : ''}`}
            onPress={() => setActiveModal('birthData')}
          />
          <SettingsRow
            label="Birth Location"
            sub={`${profile.birthData.place.city}${profile.birthData.place.region ? ', ' + profile.birthData.place.region : ''}`}
            onPress={() => setActiveModal('location')}
            isLast
          />
        </SettingsSection>

        {/* Display */}
        <SettingsSection label="Display">
          <SettingsRow
            label="Chart style"
            right={<ValueBadge val={settings.display.chartStyle.charAt(0).toUpperCase() + settings.display.chartStyle.slice(1)} />}
            onPress={() => setActiveModal('chartStyle')}
          />
          <SettingsRow
            label="Default divisional chart"
            right={<ValueBadge val={settings.display.defaultDivisionalChart} />}
            onPress={() => setActiveModal('divisionalChart')}
          />
          <SettingsRow
            label="Dark mode"
            right={
              <Toggle
                on={settings.display.darkMode}
                onToggle={() => updateSettingsMutation.mutate({ display: { darkMode: !settings.display.darkMode } })}
              />
            }
          />
          <SettingsRow
            label="Accent color"
            right={<ValueBadge val={settings.display.accentColor.charAt(0).toUpperCase() + settings.display.accentColor.slice(1)} />}
            onPress={() => setActiveModal('accentColor')}
            isLast
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection label="Notifications">
          <SettingsRow
            label="Daily reading"
            sub={`Every morning at ${settings.notifications.dailyReading.time}`}
            onPress={() => {
              setPickerInitialValue(getDailyNotificationDate());
              setShowDailyTimePicker(true);
            }}
            right={
              <Toggle
                on={settings.notifications.dailyReading.enabled}
                onToggle={() => updateSettingsMutation.mutate({
                  notifications: { dailyReading: { enabled: !settings.notifications.dailyReading.enabled } }
                })}
              />
            }
          />
          <SettingsRow
            label="Transit alerts"
            sub={settings.notifications.transitAlerts.level === 'major' ? 'Major aspects only' : 'All aspects'}
            onPress={() => setActiveModal('alertLevel')}
            right={
              <Toggle
                on={settings.notifications.transitAlerts.enabled}
                onToggle={() => updateSettingsMutation.mutate({
                  notifications: { transitAlerts: { enabled: !settings.notifications.transitAlerts.enabled } }
                })}
              />
            }
          />
          <SettingsRow
            label="Vedic transits"
            sub="Show Sidereal/Indian events"
            right={
              <Toggle
                on={transitFilters.showVedic}
                onToggle={() => toggleTransitFilter('showVedic')}
              />
            }
          />
          <SettingsRow
            label="Western transits"
            sub="Show Tropical/Western events"
            right={
              <Toggle
                on={transitFilters.showWestern}
                onToggle={() => toggleTransitFilter('showWestern')}
              />
            }
          />
          <SettingsRow
            label="Compatibility updates"
            sub={`${settings.notifications.compatibilityUpdates.frequency.charAt(0).toUpperCase() + settings.notifications.compatibilityUpdates.frequency.slice(1)} updates`}
            onPress={() => setActiveModal('compFreq')}
            right={
              <Toggle
                on={settings.notifications.compatibilityUpdates.enabled}
                onToggle={() => updateSettingsMutation.mutate({
                  notifications: { compatibilityUpdates: { enabled: !settings.notifications.compatibilityUpdates.enabled } }
                })}
              />
            }
          />
          <SettingsRow
            label="Birthday reminders"
            sub="Friends · 1 day before"
            right={
              <Toggle
                on={settings.notifications.birthdayReminders.enabled}
                onToggle={() => updateSettingsMutation.mutate({
                  notifications: { birthdayReminders: { enabled: !settings.notifications.birthdayReminders.enabled } }
                })}
              />
            }
            isLast
          />
        </SettingsSection>

        {/* Account & Privacy */}
        <SettingsSection label="Privacy">
          <SettingsRow
            label="Share birth data"
            sub="Allow compatibility matching"
            right={
              <Toggle
                on={settings.privacy.shareBirthData}
                onToggle={() => updateSettingsMutation.mutate({ privacy: { shareBirthData: !settings.privacy.shareBirthData } })}
              />
            }
          />
          <SettingsRow
            label="Analytics"
            sub="Help improve Stellar Align"
            right={
              <Toggle
                on={settings.privacy.analytics}
                onToggle={() => updateSettingsMutation.mutate({ privacy: { analytics: !settings.privacy.analytics } })}
              />
            }
            isLast
          />
        </SettingsSection>

        <SettingsSection label="Data">
          <SettingsRow
            label="Export chart data"
            sub="PDF · CSV · JSON"
            onPress={() => Alert.alert('Export', 'Chart data export started. You will receive an email shortly.')}
            isLast
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection label="Support">
          <SettingsRow label="Rate Stellar Align" onPress={() => Alert.alert('Rate', 'Redirecting to App Store...')} />
          <SettingsRow label="Send feedback" onPress={() => Alert.alert('Feedback', 'Opening email client...')} />
          <SettingsRow
            label="About"
            right={<ValueBadge val="v1.0.0" />}
            onPress={() => Alert.alert('About', 'Stellar Align v1.0.0\nBuilt with ❤️ by Stellar Align')}
            isLast
          />
        </SettingsSection>

        {/* Danger zone */}
        <SettingsSection label="Danger zone">
          <SettingsRow
            label="Sign out"
            isDanger
            onPress={() => Alert.alert('Sign out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: () => logout() }
            ])}
            isLast
          />
          {/* <SettingsRow
            label="Delete account"
            sub="Permanent · unrecoverable"
            isDanger
            onPress={() => Alert.alert('Delete Account', 'This action is permanent and cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => { } }
            ])}
            isLast
          /> */}
        </SettingsSection>

        <View style={styles.footer}>
          <Text style={styles.ver}>STELLAR ALIGN V1.0.0 (BETA)</Text>
          <Text style={styles.copy}>© 2026 STELLAR ALIGN INC.</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <TextInputModal
        visible={activeModal === 'name'}
        title="Edit Name"
        value={profile.name}
        onSave={(val) => updateProfileMutation.mutate({ displayName: val })}
        onClose={() => setActiveModal(null)}
      />

      <TextInputModal
        visible={activeModal === 'bio'}
        title="Edit Bio"
        value={profile.bio || ''}
        placeholder="Tell us about yourself..."
        onSave={(val) => updateProfileMutation.mutate({ bio: val })}
        onClose={() => setActiveModal(null)}
      />

      <BirthDataEditModal
        visible={activeModal === 'birthData'}
        date={profile.birthData.formattedDate}
        time={profile.birthData.time}
        timezone={profile.birthData.timezone?.label || profile.birthTimezone}
        birthTimeUnknown={profile.birthTimeUnknown || false}
        onEditDate={() => {
          setPickerInitialValue(getBirthDate());
          setActiveModal(null);
          setShowDatePicker(true);
        }}
        onEditTime={() => {
          setPickerInitialValue(getBirthTimeDate());
          setActiveModal(null);
          setShowTimePicker(true);
        }}
        onEditTimezone={() => {
          setActiveModal('timezone');
        }}
        onToggleUnknownTime={() => {
          const isUnknown = !profile.birthTimeUnknown;
          updateProfileMutation.mutate({ 
            birthTimeUnknown: isUnknown,
            // If switching to unknown, default to 12:00 internally
            ...(isUnknown && { birthTime: '12:00' })
          });
        }}
        onClose={() => setActiveModal(null)}
      />

      <TimezoneSelectionModal
        visible={activeModal === 'timezone'}
        selectedTimezone={profile.birthTimezone}
        onSelect={(val) => updateProfileMutation.mutate({ birthTimezone: val })}
        onClose={() => setActiveModal('birthData')}
      />

      <SelectionModal
        visible={activeModal === 'chartStyle'}
        title="Chart Style"
        options={chartStyleOptions}
        selectedValue={settings.display.chartStyle}
        onSelect={(val) => updateSettingsMutation.mutate({ display: { chartStyle: val } })}
        onClose={() => setActiveModal(null)}
      />

      <SelectionModal
        visible={activeModal === 'divisionalChart'}
        title="Default Divisional Chart"
        options={divisionalChartOptions}
        selectedValue={settings.display.defaultDivisionalChart}
        onSelect={(val) => updateSettingsMutation.mutate({ display: { defaultDivisionalChart: val } })}
        onClose={() => setActiveModal(null)}
      />

      <SelectionModal
        visible={activeModal === 'accentColor'}
        title="Accent Color"
        options={accentColorOptions}
        selectedValue={settings.display.accentColor}
        onSelect={(val) => updateSettingsMutation.mutate({ display: { accentColor: val } })}
        onClose={() => setActiveModal(null)}
      />

      <SelectionModal
        visible={activeModal === 'alertLevel'}
        title="Transit Alert Level"
        options={alertLevelOptions}
        selectedValue={settings.notifications.transitAlerts.level}
        onSelect={(val) => updateSettingsMutation.mutate({ notifications: { transitAlerts: { level: val } } })}
        onClose={() => setActiveModal(null)}
      />

      <SelectionModal
        visible={activeModal === 'compFreq'}
        title="Compatibility Updates"
        options={compFreqOptions}
        selectedValue={settings.notifications.compatibilityUpdates.frequency}
        onSelect={(val) => updateSettingsMutation.mutate({ notifications: { compatibilityUpdates: { frequency: val } } })}
        onClose={() => setActiveModal(null)}
      />

      <LocationSelectionModal
        visible={activeModal === 'location'}
        onSelect={handleLocationSelect}
        onClose={() => setActiveModal(null)}
        isLoadingExternal={isLookupLoading}
      />

      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <CustomScrollerPicker
            mode="date"
            value={pickerInitialValue || getBirthDate()}
            title="Select Birth Date"
            onSave={(d) => {
              // Use local date parts to avoid timezone shifts with toISOString()
              const year = d.getFullYear();
              const month = (d.getMonth() + 1).toString().padStart(2, '0');
              const day = d.getDate().toString().padStart(2, '0');
              const newDateISO = `${year}-${month}-${day}`;
              
              const currentDateISO = profile?.birthData?.date;
              
              if (currentDateISO === newDateISO) return;
              
              updateProfileMutation.mutate({ birthDate: newDateISO });
            }}
            onClose={() => setShowDatePicker(false)}
          />
        </Modal>
      )}

      {showTimePicker && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <CustomScrollerPicker
            mode="time"
            value={pickerInitialValue || getBirthTimeDate()}
            title="Select Birth Time"
            onSave={(d) => {
              const timeStr = d.getHours().toString().padStart(2, '0') + ':' +
                d.getMinutes().toString().padStart(2, '0');
              
              let currentTimeStr = '';
              if (profile?.birthData?.time) {
                const dt = DateTime.fromFormat(profile.birthData.time, 'h:mm a');
                if (dt.isValid) {
                  currentTimeStr = dt.toFormat('HH:mm');
                }
              }

              if (timeStr === currentTimeStr) return;
              
              updateProfileMutation.mutate({ birthTime: timeStr });
            }}
            onClose={() => setShowTimePicker(false)}
          />
        </Modal>
      )}

      {showDailyTimePicker && (
        <Modal
          visible={showDailyTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDailyTimePicker(false)}
        >
          <CustomScrollerPicker
            mode="time"
            value={pickerInitialValue || getDailyNotificationDate()}
            title="Select Notification Time"
            onSave={(d) => {
              const timeStr = d.getHours().toString().padStart(2, '0') + ':' +
                d.getMinutes().toString().padStart(2, '0');
              
              let currentTimeStr = settings?.notifications?.dailyReading?.time || '';
              if (currentTimeStr.includes('AM') || currentTimeStr.includes('PM')) {
                const dt = DateTime.fromFormat(currentTimeStr, 'h:mm a');
                if (dt.isValid) currentTimeStr = dt.toFormat('HH:mm');
              }

              if (timeStr === currentTimeStr) return;

              updateSettingsMutation.mutate({ notifications: { dailyReading: { time: timeStr } } });
            }}
            onClose={() => setShowDailyTimePicker(false)}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stellarBg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.stellarBg,
  },
  body: {
    flex: 1,
    paddingVertical: 8,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.stellarBorder,
    marginTop: 16,
  },
  ver: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: colors.stellarMuted,
    letterSpacing: 1,
  },
  copy: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    color: colors.stellarMuted,
    opacity: 0.6,
    marginTop: 3,
  },
});
