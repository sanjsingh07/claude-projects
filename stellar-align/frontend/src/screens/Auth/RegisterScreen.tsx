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
  TouchableWithoutFeedback,
  Keyboard,
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
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Female');
  const genderOptions = ['Female', 'Male', 'Non-Binary', 'Prefer not to say'];
  
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

  const maxDate = React.useMemo(() => new Date(), []);
  const farFuture = React.useMemo(() => new Date(2100, 0, 1), []);
  const farPast = React.useMemo(() => new Date(1900, 0, 1), []);

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
      // Normalize to Jan 1, 2000 to avoid any boundary issues
      const normalizedTime = new Date(selectedTime);
      normalizedTime.setFullYear(2000, 0, 1);
      setTimePickerDate(normalizedTime);
      
      const hours = normalizedTime.getHours().toString().padStart(2, '0');
      const minutes = normalizedTime.getMinutes().toString().padStart(2, '0');
      setBirthData({ ...birthData, time: `${hours}:${minutes}` });
    }
  };

  const handleLocationSelect = async (location: LocationSuggestion) => {
    setBirthData({
      ...birthData,
      locationName: location.displayName,
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
    });
    
    setIsLoadingLocations(true);
    try {
      const response = await axios.get(
        `https://www.timeapi.io/api/TimeZone/coordinate?latitude=${location.lat}&longitude=${location.lon}`
      );
      if (response.data && response.data.timeZone) {
        setBirthData(prev => ({
          ...prev,
          locationName: location.displayName,
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
          timezone: response.data.timeZone,
        }));
      }
    } catch (error) {
      console.error('Timezone lookup error:', error);
      // Fallback is handled by keeping the previous or default timezone
    } finally {
      setIsLoadingLocations(false);
      setShowLocationModal(false);
      setLocationSearch('');
      setLocationSuggestions([]);
    }
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
    if (!fullName) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!birthData.date) {
      Alert.alert('Error', 'Please select your birth date');
      return false;
    }
    if (!birthData.locationName) {
      Alert.alert('Error', 'Please select your birth location');
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
        displayName: fullName,
        gender: gender.toUpperCase().replace(/[\s-]/g, '_'),
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <CostarBackground />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {step === 1 ? (
            <View style={styles.step1Container}>
              <View style={styles.progressContainer}>
                <View style={[styles.dot, styles.activeDot]} />
                <View style={styles.line} />
                <View style={styles.dot} />
              </View>

              <View style={styles.header}>
                <View style={styles.logoRow}>
                  <CostarText style={styles.logoSym}>☉</CostarText>
                  <CostarText style={[styles.logoSym, { opacity: 0.4 }]}>☽</CostarText>
                </View>
                <CostarText variant="heading1" serif italic style={styles.title}>
                  Create Account
                </CostarText>
                <CostarText style={styles.subtitle}>
                  Begin your cosmic journey
                </CostarText>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <CostarText style={styles.label}>Email</CostarText>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.astraMuted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <CostarText style={styles.label}>Password</CostarText>
                  <TextInput
                    style={styles.input}
                    placeholder="Min 8 characters"
                    placeholderTextColor={colors.astraMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <CostarText style={styles.label}>Confirm Password</CostarText>
                  <TextInput
                    style={styles.input}
                    placeholder="Repeat password"
                    placeholderTextColor={colors.astraMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.btn, isLoginPending && { opacity: 0.7 }]}
                  onPress={handleNext}
                  disabled={isLoginPending}
                >
                  {isLoginPending ? (
                    <ActivityIndicator color={colors.astraBg} />
                  ) : (
                    <CostarText style={styles.btnText}>Continue</CostarText>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <CostarText style={styles.footerText}>Already have an account? </CostarText>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <CostarText style={[styles.footerText, styles.footerLink]}>Log In</CostarText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.astraScreen}>
              <View style={styles.island} />
              
              <View style={styles.stepHeader}>
                <CostarText variant="bodySmall" style={styles.stepNum}>
                  Step 1 of 2
                </CostarText>
                <CostarText variant="heading1" serif italic style={styles.stepMainTitle}>
                  When and where were you born?
                </CostarText>
              </View>

              <View style={styles.astraForm}>
                <View style={styles.inputGroup}>
                  <CostarText variant="label" style={styles.label}>
                    Full Name
                  </CostarText>
                  <TextInput
                    style={[styles.astraInput, styles.astraInputText]}
                    placeholder="Eleanor Vance"
                    placeholderTextColor={colors.astraMuted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <CostarText variant="label" style={styles.label}>
                    Birth Date
                  </CostarText>
                  <TouchableOpacity
                    style={styles.astraInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <CostarText variant="body" style={styles.astraInputText}>
                      {birthData.date ? formatDate(birthData.date) : 'Select date'}
                    </CostarText>
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <CostarText variant="label" style={styles.label}>
                      Time
                    </CostarText>
                    <TouchableOpacity
                      style={styles.astraInput}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <CostarText variant="body" style={styles.astraInputText}>
                          {birthData.time ? formatTime(birthData.time).split(' ')[0] : 'Select time'}
                        </CostarText>
                        {birthData.time && (
                          <CostarText variant="body" style={[styles.astraInputText, { color: colors.astraMuted, marginLeft: 4 }]}>
                            {formatTime(birthData.time).split(' ')[1]}
                          </CostarText>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <CostarText variant="label" style={styles.label}>
                      Gender
                    </CostarText>
                    <TouchableOpacity 
                      style={styles.astraInput}
                      onPress={() => {
                        const currentIndex = genderOptions.indexOf(gender);
                        const nextIndex = (currentIndex + 1) % genderOptions.length;
                        setGender(genderOptions[nextIndex]);
                      }}
                    >
                      <CostarText variant="body" style={styles.astraInputText}>
                        {gender}
                      </CostarText>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <CostarText variant="label" style={styles.label}>
                    Birth Location
                  </CostarText>
                  <TouchableOpacity
                    style={styles.astraInput}
                    onPress={handleOpenLocationModal}
                  >
                    <CostarText variant="body" style={[styles.astraInputText, { flexShrink: 1 }]}>
                      {birthData.locationName || 'Select location'}
                    </CostarText>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleNext}
                  disabled={isLoginPending}
                  style={[styles.astraButton, isLoginPending && { opacity: 0.7 }]}
                >
                  {isLoginPending ? (
                    <ActivityIndicator color={colors.astraBg} />
                  ) : (
                    <CostarText variant="body" style={styles.astraButtonText}>
                      Calculate Natal Chart
                    </CostarText>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleBack}
                  style={styles.astraBackButton}
                >
                  <CostarText variant="bodySmall" style={{ textAlign: 'center', color: colors.astraMuted }}>
                    Go Back
                  </CostarText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker
              key="date-picker-android"
              value={datePickerDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={maxDate}
            />
          )}
          {Platform.OS === 'android' && showTimePicker && (
            <DateTimePicker
              key="time-picker-android"
              value={timePickerDate}
              mode="time"
              display="default"
              onChange={handleTimeChange}
              maximumDate={farFuture}
              minimumDate={farPast}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.indicator} />

      {/* Modals for iOS/Logic */}
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
                key="date-picker-ios"
                value={datePickerDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={maxDate}
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
                key="time-picker-ios"
                value={timePickerDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                maximumDate={farFuture}
                minimumDate={farPast}
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

      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { height: '80%', backgroundColor: colors.astraSurface }]}>
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
                  keyboardShouldPersistTaps="handled"
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
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  </TouchableWithoutFeedback>
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
    backgroundColor: colors.astraBg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  step1Container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 60,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 48,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.astraBorder,
  },
  activeDot: {
    backgroundColor: colors.astraViolet,
    shadowColor: colors.astraViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  line: {
    width: 40,
    height: 1,
    backgroundColor: colors.astraBorder,
  },
  header: {
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  logoSym: {
    fontSize: 32,
    color: colors.astraFg,
  },
  title: {
    fontSize: 36,
    color: colors.astraFg,
    lineHeight: 40,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    color: colors.astraMuted,
  },
  form: {
    flex: 1,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontFamily: 'DM Sans',
    fontSize: 11,
    color: colors.astraMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  input: {
    height: 52,
    backgroundColor: colors.astraSurface,
    borderWidth: 1,
    borderColor: colors.astraBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: colors.astraFg,
    fontSize: 15,
    fontFamily: 'DM Sans',
    justifyContent: 'center',
  },
  btn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.astraFg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  btnText: {
    color: colors.astraBg,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'DM Sans',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: colors.astraMuted,
  },
  footerLink: {
    color: colors.astraViolet,
    fontWeight: '500',
  },
  astraScreen: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  island: {
    position: 'absolute',
    top: 12,
    left: '50%',
    marginLeft: -63,
    width: 126,
    height: 37,
    backgroundColor: colors.black,
    borderRadius: 20,
    zIndex: 10,
  },
  astraForm: {
    flex: 1,
    gap: 20,
  },
  stepHeader: {
    marginBottom: 32,
  },
  stepNum: {
    color: colors.astraViolet,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 10,
    fontFamily: 'DM Sans',
    marginBottom: 8,
  },
  stepMainTitle: {
    color: colors.astraFg,
    fontSize: 32,
    lineHeight: 36,
  },
  astraInput: {
    height: 52,
    backgroundColor: colors.astraSurface,
    borderWidth: 1,
    borderColor: colors.astraBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  astraInputText: {
    color: colors.astraFg,
    fontSize: 15,
    fontFamily: 'DM Sans',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  astraButton: {
    marginTop: 24,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.astraFg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  astraButtonText: {
    color: colors.astraBg,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'DM Sans',
  },
  astraBackButton: {
    marginTop: 16,
    paddingVertical: 12,
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
een;
