import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '@hooks/useAuth';
import { useAuthStore } from '@store/authStore';
import { CostarText } from '@components/CostarCard';
import { CostarButton } from '@components/CostarButton';
import { CostarBackground } from '@components/CostarBackground';
import { SignIcon } from '@components/SignIcon';
import { colors, spacing } from '@theme/theme';

interface BirthDataStep {
  date: string;
  time: string;
  timezone: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
}

interface LocationSuggestion {
  name: string;
  displayName: string;
  lat: string;
  lon: string;
}

const TIMEZONES = [
  { label: 'IST (UTC+5:30)', value: 'Asia/Kolkata' },
  { label: 'EST (UTC-5:00)', value: 'America/New_York' },
  { label: 'PST (UTC-8:00)', value: 'America/Los_Angeles' },
  { label: 'GMT (UTC+0:00)', value: 'Europe/London' },
  { label: 'CET (UTC+1:00)', value: 'Europe/Paris' },
  { label: 'JST (UTC+9:00)', value: 'Asia/Tokyo' },
  { label: 'AEST (UTC+10:00)', value: 'Australia/Sydney' },
];

const commonLocations = [
  'New York, USA',
  'Los Angeles, USA',
  'London, UK',
  'Paris, France',
  'Tokyo, Japan',
  'Sydney, Australia',
  'Mumbai, India',
  'Delhi, India',
  'Bangalore, India',
  'Chennai, India',
  'Kolkata, India',
  'Pune, India',
  'Hyderabad, India',
];

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any, any>>();
  const { register, isLoginPending } = useAuth();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthData, setBirthData] = useState<BirthDataStep>({
    date: '',
    time: '',
    timezone: 'Asia/Kolkata',
    locationName: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerDate, setTimePickerDate] = useState(new Date(2000, 0, 1, 12, 0, 0));
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationError, setLocationError] = useState('');

  const [locationSearchInput, setLocationSearchInput] = useState('');
  const debouncedSearch = useDebounce(locationSearchInput, 500);

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Main');
    }
  }, [isAuthenticated, navigation]);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!debouncedSearch.trim()) {
        setLocationSuggestions([]);
        return;
      }

      setIsLoadingLocations(true);
      setLocationError('');

      try {
        const response = await axios.get(
          'https://nominatim.openstreetmap.org/search',
          {
            params: {
              q: debouncedSearch,
              format: 'json',
              limit: 10,
              addressdetails: 1,
            },
            headers: {
              'Accept-Language': 'en',
            },
          }
        );

        const suggestions: LocationSuggestion[] = response.data.map((item: any) => {
          const addr = item.address || {};
          const parts = [
            addr.city || addr.town || addr.village || addr.county || '',
            addr.state || '',
            addr.country || '',
          ].filter(Boolean);

          return {
            name: item.display_name,
            displayName: parts.length > 0 ? parts.join(', ') : item.display_name,
            lat: item.lat,
            lon: item.lon,
          };
        });

        setLocationSuggestions(suggestions);
      } catch (error: any) {
        console.error('Location search error:', error);
        setLocationError('Failed to fetch locations');
      } finally {
        setIsLoadingLocations(false);
      }
    };

    if (debouncedSearch.trim()) {
      fetchLocations();
    } else {
      setLocationSuggestions([]);
    }
  }, [debouncedSearch]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDatePickerDate(selectedDate);
      setBirthData({ ...birthData, date: selectedDate.toISOString() });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setTimePickerDate(selectedTime);
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setBirthData({ ...birthData, time: `${hours}:${minutes}` });
    }
  };

  const handleLocationSelect = (location: LocationSuggestion) => {
    setBirthData({
      ...birthData,
      locationName: location.displayName,
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
    });
    setShowLocationModal(false);
    setLocationSearch('');
    setLocationSuggestions([]);
  };

  const handleLocationSearchChange = (text: string) => {
    setLocationSearchInput(text);
    setLocationError('');
  };

  const validateStep1 = (): boolean => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!birthData.date) {
      Alert.alert('Error', 'Please select your birth date');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    try {
      await register({
        email: email.toLowerCase().trim(),
        password,
        birthDate: birthData.date,
        birthTime: birthData.time || undefined,
        birthTimezone: birthData.timezone,
        ...(birthData.locationName && { birthLocationName: birthData.locationName }),
        ...(birthData.latitude && { birthLatitude: birthData.latitude }),
        ...(birthData.longitude && { birthLongitude: birthData.longitude }),
      });
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message || 'Please try again');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';

    let hours: number, minutes: number;

    if (timeString.includes('T')) {
      const date = new Date(timeString);
      hours = date.getUTCHours();
      minutes = date.getUTCMinutes();
    } else {
      const [h, m] = timeString.split(':');
      hours = parseInt(h, 10);
      minutes = parseInt(m, 10);
    }

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHour}:${displayMinutes} ${ampm}`;
  };

  const handleOpenLocationModal = () => {
    setShowLocationModal(true);
    setLocationSearchInput('');
    setLocationSuggestions([]);
  };

  return (
    <View style={styles.container}>
      <CostarBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, step >= 1 && styles.activeDot]} />
            <View style={[styles.progressLine, step >= 2 && styles.activeLine]} />
            <View style={[styles.progressDot, step >= 2 && styles.activeDot]} />
          </View>

          <View style={styles.logoContainer}>
            <View style={styles.logoRow}>
              <SignIcon sign="sun" size={36} color={colors.white} />
              <SignIcon sign="moon" size={30} color={colors.gray400} />
            </View>
          </View>

          {step === 1 ? (
            <View style={styles.stepContent}>
              <CostarText variant="heading3" uppercase style={styles.stepTitle}>
                Create Account
              </CostarText>
              <CostarText variant="bodySmall" color={colors.gray500} style={styles.stepDescription}>
                Begin your cosmic journey
              </CostarText>

              <View style={styles.inputContainer}>
                <CostarText variant="label" color={colors.gray400} style={styles.inputLabel}>
                  Email
                </CostarText>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.gray600}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <CostarText variant="label" color={colors.gray400} style={styles.inputLabel}>
                  Password
                </CostarText>
                <TextInput
                  style={styles.input}
                  placeholder="Min 8 characters"
                  placeholderTextColor={colors.gray600}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <CostarText variant="label" color={colors.gray400} style={styles.inputLabel}>
                  Confirm Password
                </CostarText>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.gray600}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>
          ) : (
            <View style={styles.stepContent}>
              <CostarText variant="heading3" uppercase style={styles.stepTitle}>
                Birth Data
              </CostarText>
              <CostarText variant="bodySmall" color={colors.gray500} style={styles.stepDescription}>
                Your unique astrological fingerprint
              </CostarText>

              <View style={styles.inputContainer}>
                <CostarText variant="label" color={colors.gray400} style={styles.inputLabel}>
                  Birth Date
                </CostarText>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.gray400} />
                  <CostarText variant="body" style={styles.pickerButtonText}>
                    {birthData.date ? formatDate(birthData.date) : 'Select date'}
                  </CostarText>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <CostarText variant="label" color={colors.gray400} style={styles.inputLabel}>
                  Birth Time
                </CostarText>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={colors.gray400} />
                  <CostarText variant="body" style={styles.pickerButtonText}>
                    {birthData.time ? formatTime(birthData.time) : 'Select time'}
                  </CostarText>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <CostarText variant="label" color={colors.gray400} style={styles.inputLabel}>
                  Birth Location
                </CostarText>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={handleOpenLocationModal}
                >
                  <Ionicons name="location-outline" size={20} color={colors.gray400} />
                  <CostarText variant="body" style={styles.pickerButtonText}>
                    {birthData.locationName || 'Select location'}
                  </CostarText>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <CostarText variant="label" color={colors.gray400} style={styles.inputLabel}>
                  Timezone
                </CostarText>
                <View style={styles.timezoneContainer}>
                  {TIMEZONES.map((tz) => (
                    <TouchableOpacity
                      key={tz.value}
                      style={birthData.timezone === tz.value ? styles.timezoneButtonActive : styles.timezoneButton}
                      onPress={() => setBirthData({ ...birthData, timezone: tz.value })}
                    >
                      <CostarText
                        variant="bodySmall"
                        style={birthData.timezone === tz.value ? styles.timezoneTextActive : styles.timezoneText}
                      >
                        {tz.label}
                      </CostarText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <CostarButton
              onPress={handleBack}
              variant="outline"
              style={styles.backButton}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </CostarButton>

            <CostarButton
              onPress={handleNext}
              loading={isLoginPending}
              style={styles.nextButton}
            >
              {step === 1 ? 'Continue' : 'Create Account'}
            </CostarButton>
          </View>

          <Modal
            visible={showDatePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <CostarText variant="heading3" uppercase>
                    Select Date
                  </CostarText>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Ionicons name="close" size={24} color={colors.white} />
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerWrapper}>
                  <DateTimePicker
                    value={datePickerDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                </View>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <CostarText variant="label" style={styles.modalConfirmText}>
                    Done
                  </CostarText>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={showTimePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <CostarText variant="heading3" uppercase>
                    Select Time
                  </CostarText>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Ionicons name="close" size={24} color={colors.white} />
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerWrapper}>
                  <DateTimePicker
                    value={timePickerDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                  />
                </View>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={() => setShowTimePicker(false)}
                >
                  <CostarText variant="label" style={styles.modalConfirmText}>
                    Done
                  </CostarText>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker
              value={datePickerDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
          {Platform.OS === 'android' && showTimePicker && (
            <DateTimePicker
              value={timePickerDate}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <CostarText variant="heading3" uppercase>
                Select Location
              </CostarText>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.locationSearchContainer}>
              <Ionicons name="search" size={20} color={colors.gray500} style={styles.searchIcon} />
              <TextInput
                style={styles.locationSearch}
                placeholder="Search city, state, country..."
                placeholderTextColor={colors.gray600}
                value={locationSearchInput}
                onChangeText={handleLocationSearchChange}
                autoCapitalize="words"
              />
              {isLoadingLocations && (
                <ActivityIndicator size="small" color={colors.gray500} style={styles.searchLoader} />
              )}
            </View>

            {locationError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={24} color={colors.error} />
                <CostarText variant="body" color={colors.error} style={styles.errorText}>
                  {locationError}
                </CostarText>
              </View>
            ) : null}

            <FlatList
              data={locationSuggestions}
              keyExtractor={(item, index) => `${item.lat}-${item.lon}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.locationItem}
                  onPress={() => handleLocationSelect(item)}
                >
                  <Ionicons name="location" size={20} color={colors.gray400} />
                  <View style={styles.locationTextContainer}>
                    <CostarText variant="body" style={styles.locationName}>
                      {item.displayName}
                    </CostarText>
                    <CostarText variant="bodySmall" color={colors.gray500}>
                      {item.name}
                    </CostarText>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                !isLoadingLocations && locationSearchInput.trim().length > 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={40} color={colors.gray600} />
                    <CostarText variant="body" color={colors.gray500} style={styles.emptyText}>
                      No locations found
                    </CostarText>
                  </View>
                ) : null
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const useDebounce = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray600,
  },
  activeDot: {
    backgroundColor: colors.white,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.gray800,
    marginHorizontal: spacing.sm,
  },
  activeLine: {
    backgroundColor: colors.white,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepContent: {
    paddingHorizontal: spacing.lg,
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepDescription: {
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray700,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.white,
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray700,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.gray900,
    gap: spacing.sm,
  },
  pickerButtonText: {
    color: colors.white,
    flex: 1,
  },
  timezoneContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timezoneButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray700,
  },
  timezoneButtonActive: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.white,
    backgroundColor: colors.white + '20',
  },
  timezoneText: {
    color: colors.gray400,
  },
  timezoneTextActive: {
    color: colors.white,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.gray900,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray800,
  },
  pickerWrapper: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  modalConfirmButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
  },
  modalConfirmText: {
    color: colors.white,
  },
  locationSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray700,
    borderRadius: 8,
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray800,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  locationSearch: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.white,
    fontSize: 16,
  },
  searchLoader: {
    marginLeft: spacing.sm,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray800,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  locationName: {
    color: colors.white,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.error + '10',
    borderRadius: 8,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  errorText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyText: {
    marginTop: spacing.md,
  },
});

export default RegisterScreen;
