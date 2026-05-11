import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, TouchableWithoutFeedback, Keyboard, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';

export interface LocationSuggestion {
  name: string;
  displayName: string;
  lat: string;
  lon: string;
  timezone?: string;
}

export const SettingsHeader: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Settings</Text>
    </View>
  );
};

export const SettingsSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
};

export const SettingsRow: React.FC<{
  label: string;
  sub?: string;
  right?: React.ReactNode;
  isDanger?: boolean;
  onPress?: () => void;
  isLast?: boolean;
}> = ({ label, sub, right, isDanger, onPress, isLast }) => {
  return (
    <TouchableOpacity 
      style={[styles.row, isLast && styles.lastRow]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, isDanger && styles.rowLabelDanger]}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <View style={styles.rowRight}>
        {right}
        {onPress && !right && <Text style={styles.arrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );
};

export const Toggle: React.FC<{ on: boolean; onToggle: () => void }> = ({ on, onToggle }) => {
  return (
    <TouchableOpacity 
      style={[styles.toggle, on && styles.toggleOn]} 
      onPress={onToggle}
    >
      <View style={[styles.toggleCircle, on && styles.toggleCircleOn]} />
    </TouchableOpacity>
  );
};

export const ValueBadge: React.FC<{ val: string }> = ({ val }) => {
  return (
    <View style={styles.valBadge}>
      <Text style={styles.valText}>{val}</Text>
    </View>
  );
};

export const SelectionModal: React.FC<{
  visible: boolean;
  title: string;
  options: Array<{ label: string; value: string }>;
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}> = ({ visible, title, options, selectedValue, onSelect, onClose }) => {
  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.optionsList}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionItem, selectedValue === opt.value && styles.optionSelected]}
                  onPress={() => {
                    onSelect(opt.value);
                    onClose();
                  }}
                >
                  <Text style={[styles.optionLabel, selectedValue === opt.value && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  {selectedValue === opt.value && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

export const LocationSelectionModal: React.FC<{
  visible: boolean;
  onSelect: (location: LocationSuggestion) => void;
  onClose: () => void;
  isLoadingExternal?: boolean;
}> = ({ visible, onSelect, onClose, isLoadingExternal }) => {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const activeLoading = isLoading || isLoadingExternal;

  useEffect(() => {
    const fetchLocations = async () => {
      if (search.trim().length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get(
          'https://nominatim.openstreetmap.org/search',
          {
            params: {
              q: search,
              format: 'json',
              limit: 10,
              addressdetails: 1,
            },
            headers: {
              'Accept-Language': 'en',
            },
          }
        );

        const results: LocationSuggestion[] = response.data.map((item: any) => {
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

        setSuggestions(results);
      } catch (error) {
        console.error('Location search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handler = setTimeout(fetchLocations, 500);
    return () => clearTimeout(handler);
  }, [search]);

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      onClose();
    }}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Location</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search city, state, country..."
                placeholderTextColor={colors.stellarMuted}
                value={search}
                onChangeText={setSearch}
                autoFocus
                keyboardAppearance="dark"
                returnKeyType="search"
              />
              {activeLoading && <ActivityIndicator size="small" color={colors.stellarViolet} style={styles.searchLoader} />}
            </View>
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `${item.lat}-${item.lon}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  disabled={activeLoading}
                >
                  <View>
                    <Text style={styles.optionLabel}>{item.displayName}</Text>
                    <Text style={[styles.rowSub, { marginTop: 4 }]}>{item.name}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                search.length >= 3 && !activeLoading ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.valText}>No locations found</Text>
                  </View>
                ) : null
              }
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

export const BirthDataEditModal: React.FC<{
  visible: boolean;
  date: string;
  time: string;
  timezone: string;
  birthTimeUnknown: boolean;
  onEditDate: () => void;
  onEditTime: () => void;
  onEditTimezone: () => void;
  onToggleUnknownTime: () => void;
  onClose: () => void;
}> = ({ 
  visible, date, time, timezone, birthTimeUnknown, 
  onEditDate, onEditTime, onEditTimezone, onToggleUnknownTime, onClose 
}) => {
  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Birth Data</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.optionsList}>
              <TouchableOpacity style={styles.optionItem} onPress={onEditDate}>
                <View>
                  <Text style={styles.rowSub}>BIRTH DATE</Text>
                  <Text style={[styles.optionLabel, { marginTop: 4 }]}>{date}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionItem, birthTimeUnknown && { opacity: 0.5 }]} 
                onPress={() => !birthTimeUnknown && onEditTime()}
                disabled={birthTimeUnknown}
              >
                <View>
                  <Text style={styles.rowSub}>BIRTH TIME</Text>
                  <Text style={[styles.optionLabel, { marginTop: 4 }]}>
                    {birthTimeUnknown ? '--:--' : time}
                  </Text>
                </View>
                {!birthTimeUnknown && <Text style={styles.arrow}>›</Text>}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionItem} 
                onPress={() => {
                  const action = birthTimeUnknown ? 'disable' : 'enable';
                  Alert.alert(
                    'Birth Time Unknown',
                    `Are you sure you want to ${action} 'Unknown Birth Time'? This will recalculate your Rising sign and house placements.`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: birthTimeUnknown ? 'Show Time' : 'Set Unknown', 
                        onPress: onToggleUnknownTime 
                      },
                    ]
                  );
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                  <View>
                    <Text style={[styles.optionLabel, birthTimeUnknown && { color: colors.stellarViolet }]}>I don't know my birth time</Text>
                    <Text style={[styles.rowSub, { marginTop: 4 }]}>
                      {birthTimeUnknown ? 'Currently estimating placements' : 'Estimates Rising sign & houses'}
                    </Text>
                  </View>
                  <View style={[styles.checkbox, birthTimeUnknown && styles.checkboxChecked]}>
                    {birthTimeUnknown && <Ionicons name="checkmark" size={12} color={colors.white} />}
                  </View>
                </View>
              </TouchableOpacity>

              {birthTimeUnknown && (
                <View style={styles.warningBox}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.stellarViolet} />
                  <Text style={styles.warningText}>
                    Note: Without an exact time, your Rising sign and house placements will be estimated. Readings will be less precise.
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.optionItem} onPress={onEditTimezone}>
                <View>
                  <Text style={styles.rowSub}>TIMEZONE</Text>
                  <Text style={[styles.optionLabel, { marginTop: 4 }]}>{timezone}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

export const TimezoneSelectionModal: React.FC<{
  visible: boolean;
  onSelect: (timezone: string) => void;
  onClose: () => void;
  selectedTimezone?: string;
}> = ({ visible, onSelect, onClose, selectedTimezone }) => {
  const [search, setSearch] = useState('');
  const [allTimezones] = useState(() => {
    try {
      if (typeof (Intl as any).supportedValuesOf === 'function') {
        return (Intl as any).supportedValuesOf('timeZone') as string[];
      }
    } catch (e) {
      console.warn('Intl.supportedValuesOf not supported, using fallback');
    }
    
    const fallbacks = [
      'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
      'America/Anchorage', 'America/Argentina/Buenos_Aires', 'America/Bogota',
      'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Mexico_City',
      'America/New_York', 'America/Phoenix', 'America/Sao_Paulo', 'America/Toronto',
      'America/Vancouver', 'Asia/Bangkok', 'Asia/Dubai', 'Asia/Hong_Kong',
      'Asia/Jakarta', 'Asia/Jerusalem', 'Asia/Kabul', 'Asia/Karachi', 'Asia/Kolkata',
      'Asia/Manila', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Taipei',
      'Asia/Tehran', 'Asia/Tokyo', 'Atlantic/Reykjavik', 'Australia/Adelaide',
      'Australia/Brisbane', 'Australia/Darwin', 'Australia/Melbourne', 'Australia/Perth',
      'Australia/Sydney', 'Europe/Amsterdam', 'Europe/Berlin', 'Europe/Brussels',
      'Europe/Budapest', 'Europe/Copenhagen', 'Europe/Dublin', 'Europe/Helsinki',
      'Europe/Istanbul', 'Europe/Lisbon', 'Europe/London', 'Europe/Madrid',
      'Europe/Moscow', 'Europe/Oslo', 'Europe/Paris', 'Europe/Prague', 'Europe/Rome',
      'Europe/Stockholm', 'Europe/Vienna', 'Europe/Warsaw', 'Europe/Zurich',
      'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Honolulu', 'UTC'
    ];
    
    if (selectedTimezone && !fallbacks.includes(selectedTimezone)) {
      fallbacks.push(selectedTimezone);
      fallbacks.sort();
    }
    
    return fallbacks;
  });

  const filteredTimezones = allTimezones.filter(tz => 
    tz.toLowerCase().includes(search.toLowerCase())
  );

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      onClose();
    }}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Timezone</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search timezone (e.g. London, Kolkata)..."
                placeholderTextColor={colors.stellarMuted}
                value={search}
                onChangeText={setSearch}
                autoFocus
                keyboardAppearance="dark"
                returnKeyType="search"
              />
            </View>
            <FlatList
              data={filteredTimezones}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.optionItem, selectedTimezone === item && styles.optionSelected]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={[styles.optionLabel, selectedTimezone === item && styles.optionLabelSelected]}>
                    {item}
                  </Text>
                  {selectedTimezone === item && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

export const TextInputModal: React.FC<{
  visible: boolean;
  title: string;
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
  onClose: () => void;
}> = ({ visible, title, value, placeholder, onSave, onClose }) => {
  const [text, setText] = useState(value);

  useEffect(() => {
    if (visible) {
      setText(value);
    }
  }, [visible, value]);

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      onClose();
    }}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%' }}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{title}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={text}
                  onChangeText={setText}
                  placeholder={placeholder}
                  placeholderTextColor={colors.stellarMuted}
                  autoFocus
                  keyboardAppearance="dark"
                  selectionColor={colors.stellarViolet}
                  multiline={title.toLowerCase().includes('bio')}
                />
              </View>
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={() => {
                  onSave(text);
                  onClose();
                }}
              >
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.stellarSurface,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  backIcon: {
    fontSize: 18,
    color: colors.stellarFg,
  },
  title: {
    fontFamily: 'InstrumentSerif-Italic',
    fontSize: 22,
    color: colors.stellarFg,
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.stellarViolet,
    paddingVertical: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: colors.stellarFg,
  },
  rowLabelDanger: {
    color: '#FF4444',
  },
  rowSub: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: colors.stellarMuted,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  arrow: {
    fontSize: 14,
    color: colors.stellarMuted,
    marginLeft: 6,
  },
  toggle: {
    width: 48,
    height: 28,
    backgroundColor: colors.stellarSurface,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    borderRadius: 14,
    position: 'relative',
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: colors.stellarViolet,
    borderColor: colors.stellarViolet,
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    position: 'absolute',
    left: 3,
  },
  toggleCircleOn: {
    left: 23,
  },
  valBadge: {
    marginRight: 6,
  },
  valText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: colors.stellarMuted,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.stellarSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.stellarBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder,
  },
  modalTitle: {
    fontFamily: 'InstrumentSerif-Italic',
    fontSize: 20,
    color: colors.stellarFg,
  },
  modalClose: {
    fontSize: 18,
    color: colors.stellarMuted,
  },
  optionsList: {
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder,
  },
  optionSelected: {
    backgroundColor: 'rgba(157, 141, 241, 0.05)',
  },
  optionLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: colors.stellarFg,
  },
  optionLabelSelected: {
    color: colors.stellarViolet,
  },
  checkIcon: {
    fontSize: 16,
    color: colors.stellarViolet,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: colors.stellarFg,
    paddingVertical: 8,
  },
  searchLoader: {
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  inputContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  textInput: {
    fontFamily: 'DMSans-Regular',
    fontSize: 24,
    color: colors.stellarFg,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarViolet,
    paddingBottom: 8,
  },
  saveBtn: {
    marginHorizontal: 24,
    backgroundColor: colors.stellarViolet,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    color: colors.white,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.stellarViolet,
    borderColor: colors.stellarViolet,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: colors.stellarViolet + '10',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 24,
    marginVertical: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    color: colors.stellarMuted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'DMSans-Regular',
  },
});
