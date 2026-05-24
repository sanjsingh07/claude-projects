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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '@hooks/useAuth';
import { useAuthStore } from '@store/authStore';
import { api } from '@services/api';
import { 
  StellarText, 
  StellarButton, 
  StellarBackground, 
  SignIcon,
  TimezoneSelectionModal
} from '@components';
import { colors, spacing } from '@theme/theme';
import { GOOGLE_AUTH, isGoogleAuthConfigured } from '@config/googleAuth';

WebBrowser.maybeCompleteAuthSession();

interface BirthDataStep {
  date: string;
  time: string;
  birthTimeUnknown: boolean;
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
  const { register, socialLogin, isLoginPending, updateProfile, logout } = useAuth();
  const { setUser, isAuthenticated, user } = useAuthStore();
  const route = useRoute<any>();

  const googleRedirectUri = AuthSession.makeRedirectUri({
    scheme: Platform.OS === 'ios' ? GOOGLE_AUTH.iosRedirectScheme : 'stellar-align',
  });

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    iosClientId: GOOGLE_AUTH.iosClientId,
    androidClientId: GOOGLE_AUTH.androidClientId,
    webClientId: GOOGLE_AUTH.webClientId,
    redirectUri: googleRedirectUri,
  });

  useEffect(() => {
    console.log('Google Auth Config (Register):', {
      redirectUri: googleRedirectUri,
    });
  }, []);

  const initialStep = route.params?.step || 1;
  const socialUser = route.params?.socialUser || null;

  const [step, setStep] = useState(initialStep);
  const [email, setEmail] = useState(socialUser?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState(socialUser?.displayName || '');
  const [gender, setGender] = useState('Female');
  const genderOptions = ['Female', 'Male', 'Non-Binary', 'Prefer not to say'];
  
  const [birthData, setBirthData] = useState<BirthDataStep>({
    date: '',
    time: '',
    birthTimeUnknown: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    locationName: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerDate, setTimePickerDate] = useState(new Date(2000, 0, 1, 12, 0, 0));
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);

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
      if (user?.profileCompleted) {
        navigation.replace('Main');
      } else if (step === 1) {
        setStep(2);
      }
    }
  }, [isAuthenticated, user?.profileCompleted, navigation, step]);

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

  useEffect(() => {
    if (response?.type === 'success' && response.params?.id_token) {
      socialLogin({ provider: 'google', idToken: response.params.id_token }).catch(() => {
        Alert.alert('Google Sign-In Failed', 'Please try again');
      });
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign-In Failed', 'An error occurred');
    }
  }, [response]);

  const handleGoogleLogin = async () => {
    if (!isGoogleAuthConfigured) {
      Alert.alert('Coming Soon', 'Google Sign-In requires configuration. Please use email/password for now.');
      return;
    }
    await promptAsync();
  };

  const handleAppleLogin = async () => {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('Not Available', 'Apple Sign-In is only available on iOS devices.');
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        await socialLogin({ provider: 'apple', idToken: credential.identityToken });
      }
    } catch (e: any) {
      if (e.code === 'ERR_CANCELED') return;
      Alert.alert('Apple Sign-In Failed', 'An error occurred. Please try again.');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDatePickerDate(selectedDate);
      // Use local date parts to avoid timezone shifts with toISOString()
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      setBirthData({ ...birthData, date: dateStr });
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
      const response = await api.getTimezone(location.lat, location.lon);
      const data = (response as any).data;
      if (data?.timezone) {
        setBirthData(prev => ({
          ...prev,
          locationName: location.displayName,
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
          timezone: data.timezone,
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
    if (step > 1 && !isAuthenticated) {
      setStep(step - 1);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (isAuthenticated) {
      // If we're authenticated but at the root of the Register stack, 
      // "Back" should probably log out to let the user restart or change accounts
      Alert.alert(
        'Exit Registration?',
        'Going back will log you out. You can complete your profile later.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: () => logout() },
        ]
      );
    } else {
      // Fallback for non-authenticated root
      navigation.navigate('RegisterStart' as any);
    }
  };

  const handleSubmit = async () => {
    try {
      const data = {
        displayName: fullName,
        gender: gender.toUpperCase().replace(/[\s-]/g, '_'),
        birthDate: birthData.date,
        birthTime: birthData.birthTimeUnknown ? '12:00' : (birthData.time || undefined),
        birthTimeUnknown: birthData.birthTimeUnknown,
        birthTimezone: birthData.timezone,
        ...(birthData.locationName && { birthLocationName: birthData.locationName }),
        ...(birthData.latitude && { birthLatitude: birthData.latitude }),
        ...(birthData.longitude && { birthLongitude: birthData.longitude }),
      };

      if (socialUser) {
        await updateProfile(data);
      } else {
        await register({
          ...data,
          email: email.toLowerCase().trim(),
          password,
        });
      }
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message || 'Please try again');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    let date: Date;
    // If it's in YYYY-MM-DD format
    if (dateString.length === 10 && dateString.includes('-')) {
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateString);
    }

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
        <StellarBackground />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {step === 1 ? (
            <View style={styles.step1Container}>
              <TouchableOpacity 
                style={styles.backBtn}
                onPress={handleBack}
              >
                <StellarText style={styles.backBtnText}>←</StellarText>
              </TouchableOpacity>

              <View style={styles.progressContainer}>
                <View style={[styles.dot, styles.activeDot]} />
                <View style={styles.line} />
                <View style={styles.dot} />
              </View>

              <View style={styles.header}>
                <View style={styles.logoRow}>
                  <StellarText style={styles.logoSym}>☉</StellarText>
                  <StellarText style={[styles.logoSym, { opacity: 0.4 }]}>☽</StellarText>
                </View>
                <StellarText variant="heading1" serif italic style={styles.title}>
                  Create Account
                </StellarText>
                <StellarText style={styles.subtitle}>
                  Begin your cosmic journey
                </StellarText>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <StellarText style={styles.label}>Email</StellarText>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.stellarMuted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <StellarText style={styles.label}>Password</StellarText>
                  <TextInput
                    style={styles.input}
                    placeholder="Min 8 characters"
                    placeholderTextColor={colors.stellarMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <StellarText style={styles.label}>Confirm Password</StellarText>
                  <TextInput
                    style={styles.input}
                    placeholder="Repeat password"
                    placeholderTextColor={colors.stellarMuted}
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
                    <ActivityIndicator color={colors.stellarBg} />
                  ) : (
                    <StellarText style={styles.btnText}>Continue</StellarText>
                  )}
                </TouchableOpacity>

                <View style={styles.altLogin}>
                  <View style={styles.altLoginTextContainer}>
                    <View style={styles.altLine} />
                    <StellarText style={styles.altLoginText}>Or continue with</StellarText>
                    <View style={styles.altLine} />
                  </View>
                  
                  <View style={styles.socialBtns}>
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity 
                        style={styles.socialBtn}
                        onPress={handleAppleLogin}
                      >
                        <StellarText style={styles.socialIcon}></StellarText>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={styles.socialBtn}
                      onPress={handleGoogleLogin}
                      disabled={!request}
                    >
                      <StellarText style={styles.socialIcon}>G</StellarText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {!isAuthenticated && (
                <View style={styles.footer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <StellarText style={styles.footerText}>Already have an account? </StellarText>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                      <StellarText style={[styles.footerText, styles.footerLink]}>Log In</StellarText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.stellarScreen}>
              <View style={styles.island} />
              
              <View style={styles.stepHeader}>
                <StellarText variant="bodySmall" style={styles.stepNum}>
                  Step 1 of 2
                </StellarText>
                <StellarText variant="heading1" serif italic style={styles.stepMainTitle}>
                  When and where were you born?
                </StellarText>
              </View>

              <View style={styles.stellarForm}>
                <View style={styles.inputGroup}>
                  <StellarText variant="label" style={styles.label}>
                    Full Name
                  </StellarText>
                  <TextInput
                    style={[styles.stellarInput, styles.stellarInputText]}
                    placeholder="Eleanor Vance"
                    placeholderTextColor={colors.stellarMuted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <StellarText variant="label" style={styles.label}>
                    Birth Date
                  </StellarText>
                  <TouchableOpacity
                    style={styles.stellarInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <StellarText variant="body" style={styles.stellarInputText}>
                      {birthData.date ? formatDate(birthData.date) : 'Select date'}
                    </StellarText>
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <StellarText variant="label" style={styles.label}>
                      Time
                    </StellarText>
                    <TouchableOpacity
                      style={[styles.stellarInput, birthData.birthTimeUnknown && { opacity: 0.5 }]}
                      onPress={() => !birthData.birthTimeUnknown && setShowTimePicker(true)}
                      disabled={birthData.birthTimeUnknown}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <StellarText variant="body" style={styles.stellarInputText}>
                          {birthData.birthTimeUnknown ? '--:--' : (birthData.time ? formatTime(birthData.time).split(' ')[0] : 'Select time')}
                        </StellarText>
                        {!birthData.birthTimeUnknown && birthData.time && (
                          <StellarText variant="body" style={[styles.stellarInputText, { color: colors.stellarMuted, marginLeft: 4 }]}>
                            {formatTime(birthData.time).split(' ')[1]}
                          </StellarText>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <StellarText variant="label" style={styles.label}>
                      Gender
                    </StellarText>
                    <TouchableOpacity 
                      style={styles.stellarInput}
                      onPress={() => {
                        const currentIndex = genderOptions.indexOf(gender);
                        const nextIndex = (currentIndex + 1) % genderOptions.length;
                        setGender(genderOptions[nextIndex]);
                      }}
                    >
                      <StellarText variant="body" style={styles.stellarInputText}>
                        {gender}
                      </StellarText>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.unknownTimeRow}
                  onPress={() => setBirthData({ ...birthData, birthTimeUnknown: !birthData.birthTimeUnknown })}
                >
                  <View style={[styles.checkbox, birthData.birthTimeUnknown && styles.checkboxChecked]}>
                    {birthData.birthTimeUnknown && <Ionicons name="checkmark" size={12} color={colors.stellarBg} />}
                  </View>
                  <StellarText variant="bodySmall" style={styles.unknownTimeText}>
                    I don't know my birth time
                  </StellarText>
                </TouchableOpacity>

                {birthData.birthTimeUnknown && (
                  <View style={styles.warningBox}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.stellarViolet} />
                    <StellarText variant="bodySmall" style={styles.warningText}>
                      Note: Without an exact time, your Rising sign and house placements will be estimated. Readings will be less precise.
                    </StellarText>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <StellarText variant="label" style={styles.label}>
                    Birth Location
                  </StellarText>
                  <TouchableOpacity
                    style={styles.stellarInput}
                    onPress={handleOpenLocationModal}
                  >
                    <StellarText variant="body" style={[styles.stellarInputText, { flexShrink: 1 }]}>
                      {birthData.locationName || 'Select location'}
                    </StellarText>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <StellarText variant="label" style={styles.label}>
                    Timezone
                  </StellarText>
                  <TouchableOpacity
                    style={styles.stellarInput}
                    onPress={() => setShowTimezoneModal(true)}
                  >
                    <StellarText variant="body" style={[styles.stellarInputText, { flexShrink: 1 }]}>
                      {birthData.timezone}
                    </StellarText>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleNext}
                  disabled={isLoginPending}
                  style={[styles.stellarButton, isLoginPending && { opacity: 0.7 }]}
                >
                  {isLoginPending ? (
                    <ActivityIndicator color={colors.stellarBg} />
                  ) : (
                    <StellarText variant="body" style={styles.stellarButtonText}>
                      Calculate Natal Chart
                    </StellarText>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleBack}
                  style={styles.stellarBackButton}
                >
                  <StellarText variant="bodySmall" style={{ textAlign: 'center', color: colors.stellarMuted }}>
                    Go Back
                  </StellarText>
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

      <TimezoneSelectionModal
        visible={showTimezoneModal}
        selectedTimezone={birthData.timezone}
        onSelect={(tz) => setBirthData({ ...birthData, timezone: tz })}
        onClose={() => setShowTimezoneModal(false)}
      />

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
              <StellarText variant="heading3" uppercase>
                Select Date
              </StellarText>
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
              <StellarText variant="label" style={styles.modalConfirmText}>
                Done
              </StellarText>
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
              <StellarText variant="heading3" uppercase>
                Select Time
              </StellarText>
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
              <StellarText variant="label" style={styles.modalConfirmText}>
                Done
              </StellarText>
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
              <View style={[styles.modalContent, { height: '80%', backgroundColor: colors.stellarSurface }]}>
                <View style={styles.modalHeader}>
                  <StellarText variant="heading3" uppercase>
                    Select Location
                  </StellarText>
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
                    <StellarText variant="body" color={colors.error} style={styles.errorText}>
                      {locationError}
                    </StellarText>
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
                        <StellarText variant="body" style={styles.locationName}>
                          {item.displayName}
                        </StellarText>
                        <StellarText variant="bodySmall" color={colors.gray500}>
                          {item.name}
                        </StellarText>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    !isLoadingLocations && locationSearchInput.trim().length > 0 ? (
                      <View style={styles.emptyContainer}>
                        <Ionicons name="search-outline" size={40} color={colors.gray600} />
                        <StellarText variant="body" color={colors.gray500} style={styles.emptyText}>
                          No locations found
                        </StellarText>
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
    backgroundColor: colors.stellarBg,
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
  backBtn: {
    width: 40,
    marginBottom: 5,
  },
  backBtnText: {
    fontSize: 24,
    color: colors.stellarFg,
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
    backgroundColor: colors.stellarBorder,
  },
  activeDot: {
    backgroundColor: colors.stellarViolet,
    shadowColor: colors.stellarViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  line: {
    width: 40,
    height: 1,
    backgroundColor: colors.stellarBorder,
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
    lineHeight: 40,
    color: colors.stellarFg,
  },
  title: {
    fontSize: 36,
    color: colors.stellarFg,
    lineHeight: 40,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    color: colors.stellarMuted,
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
    color: colors.stellarMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  input: {
    height: 52,
    backgroundColor: colors.stellarSurface,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: colors.stellarFg,
    fontSize: 15,
    fontFamily: 'DM Sans',
    justifyContent: 'center',
  },
  btn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.stellarFg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  btnText: {
    color: colors.stellarBg,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'DM Sans',
  },
  altLogin: {
    marginTop: 24,
    alignItems: 'center',
  },
  altLoginTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  altLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.stellarBorder,
  },
  altLoginText: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    color: colors.stellarMuted,
    marginHorizontal: 16,
  },
  socialBtns: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  socialBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    backgroundColor: colors.stellarSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    fontSize: 20,
    color: colors.stellarFg,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: colors.stellarMuted,
  },
  footerLink: {
    color: colors.stellarViolet,
    fontWeight: '500',
  },
  stellarScreen: {
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
  stellarForm: {
    flex: 1,
    gap: 20,
  },
  stepHeader: {
    marginBottom: 32,
  },
  stepNum: {
    color: colors.stellarViolet,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 10,
    fontFamily: 'DM Sans',
    marginBottom: 8,
  },
  stepMainTitle: {
    color: colors.stellarFg,
    fontSize: 32,
    lineHeight: 36,
  },
  stellarInput: {
    height: 52,
    backgroundColor: colors.stellarSurface,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  stellarInputText: {
    color: colors.stellarFg,
    fontSize: 15,
    fontFamily: 'DM Sans',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  stellarButton: {
    marginTop: 24,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.stellarFg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stellarButtonText: {
    color: colors.stellarBg,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'DM Sans',
  },
  stellarBackButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  unknownTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.stellarViolet,
    borderColor: colors.stellarViolet,
  },
  unknownTimeText: {
    color: colors.stellarMuted,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: colors.stellarViolet + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    gap: 10,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    color: colors.stellarMuted,
    lineHeight: 18,
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
  indicator: {
    height: 0,
  },
});

export default RegisterScreen;
