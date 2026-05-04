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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
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
} from '../components/SettingsComponents';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  const [activeModal, setActiveModal] = useState<'chartStyle' | 'divisionalChart' | 'accentColor' | 'location' | 'birthData' | 'name' | 'alertLevel' | 'compFreq' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDailyTimePicker, setShowDailyTimePicker] = useState(false);

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

  const updateProfileMutation = useMutation({
    mutationFn: async (patch: any) => {
      const response = await api.updateProfile(patch);
      return (response as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update profile');
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
    { label: 'D11 (Ekadasamsa)', value: 'D11' },
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      updateProfileMutation.mutate({ birthDate: selectedDate.toISOString() });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selectedTime) {
      const timeStr = selectedTime.getHours().toString().padStart(2, '0') + ':' + 
                      selectedTime.getMinutes().toString().padStart(2, '0');
      updateProfileMutation.mutate({ birthTime: timeStr });
    }
  };

  const handleDailyTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') setShowDailyTimePicker(false);
    if (selectedTime) {
      const timeStr = selectedTime.getHours().toString().padStart(2, '0') + ':' + 
                      selectedTime.getMinutes().toString().padStart(2, '0');
      updateSettingsMutation.mutate({ notifications: { dailyReading: { time: timeStr } } });
    }
  };

  const handleLocationSelect = (location: LocationSuggestion) => {
    updateProfileMutation.mutate({
      birthLocationName: location.displayName,
      birthLatitude: parseFloat(location.lat),
      birthLongitude: parseFloat(location.lon),
    });
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
            sub={`${profile.birthData.formattedDate} at ${profile.birthData.time}`}
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
            onPress={() => setShowDailyTimePicker(true)}
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
            sub="Help improve Astra"
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
          <SettingsRow label="Rate Astra" onPress={() => Alert.alert('Rate', 'Redirecting to App Store...')} />
          <SettingsRow label="Send feedback" onPress={() => Alert.alert('Feedback', 'Opening email client...')} />
          <SettingsRow
            label="About"
            right={<ValueBadge val="v1.0.0" />}
            onPress={() => Alert.alert('About', 'Astra v1.0.0\nBuilt with ❤️ by Stellar Align')}
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
          />
          <SettingsRow
            label="Delete account"
            sub="Permanent · unrecoverable"
            isDanger
            onPress={() => Alert.alert('Delete Account', 'This action is permanent and cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => {} }
            ])}
            isLast
          />
        </SettingsSection>

        <View style={styles.footer}>
          <Text style={styles.ver}>ASTRA V1.0.0 (BETA)</Text>
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
        onEditDate={() => {
          setActiveModal(null);
          setShowDatePicker(true);
        }}
        onEditTime={() => {
          setActiveModal(null);
          setShowTimePicker(true);
        }}
        onClose={() => setActiveModal(null)}
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
      />

      {showDatePicker && (
        <View style={Platform.OS === 'ios' ? styles.pickerModalOverlay : null}>
          {Platform.OS === 'ios' && (
            <View style={styles.pickerModalContent}>
               <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalClose}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={new Date(profile.birthData.date)}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            </View>
          )}
          {Platform.OS === 'android' && (
            <DateTimePicker
              value={new Date(profile.birthData.date)}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
      )}

      {(showTimePicker || showDailyTimePicker) && (
        <View style={Platform.OS === 'ios' ? styles.pickerModalOverlay : null}>
          {Platform.OS === 'ios' && (
            <View style={styles.pickerModalContent}>
               <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => {
                  setShowTimePicker(false);
                  setShowDailyTimePicker(false);
                }}>
                  <Text style={styles.modalClose}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={new Date()}
                mode="time"
                display="spinner"
                onChange={showTimePicker ? handleTimeChange : handleDailyTimeChange}
              />
            </View>
          )}
          {Platform.OS === 'android' && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="default"
              onChange={showTimePicker ? handleTimeChange : handleDailyTimeChange}
            />
          )}
        </View>
      )}
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
    paddingVertical: 8,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.astraBorder,
    marginTop: 16,
  },
  ver: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: colors.astraMuted,
    letterSpacing: 1,
  },
  copy: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    color: colors.astraMuted,
    opacity: 0.6,
    marginTop: 3,
  },
  pickerModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
    zIndex: 2000,
  },
  pickerModalContent: {
    backgroundColor: colors.astraSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.astraBorder,
  },
  modalTitle: {
    fontFamily: 'InstrumentSerif-Italic',
    fontSize: 20,
    color: colors.astraFg,
  },
  modalClose: {
    fontSize: 18,
    color: colors.astraViolet,
  },
});

