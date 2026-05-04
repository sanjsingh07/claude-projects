import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { colors } from '../theme/theme';

export interface LocationSuggestion {
  name: string;
  displayName: string;
  lat: string;
  lon: string;
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
    <View style={styles.modalOverlay}>
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
    </View>
  );
};

export const LocationSelectionModal: React.FC<{
  visible: boolean;
  onSelect: (location: LocationSuggestion) => void;
  onClose: () => void;
}> = ({ visible, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    <View style={styles.modalOverlay}>
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
            placeholderTextColor={colors.astraMuted}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          {isLoading && <ActivityIndicator size="small" color={colors.astraViolet} style={styles.searchLoader} />}
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
            >
              <View>
                <Text style={styles.optionLabel}>{item.displayName}</Text>
                <Text style={[styles.rowSub, { marginTop: 4 }]}>{item.name}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            search.length >= 3 && !isLoading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.valText}>No locations found</Text>
              </View>
            ) : null
          }
        />
      </View>
    </View>
  );
};

export const BirthDataEditModal: React.FC<{
  visible: boolean;
  date: string;
  time: string;
  onEditDate: () => void;
  onEditTime: () => void;
  onClose: () => void;
}> = ({ visible, date, time, onEditDate, onEditTime, onClose }) => {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
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
          <TouchableOpacity style={styles.optionItem} onPress={onEditTime}>
            <View>
              <Text style={styles.rowSub}>BIRTH TIME</Text>
              <Text style={[styles.optionLabel, { marginTop: 4 }]}>{time}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    if (visible) setText(value);
  }, [visible, value]);

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
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
            placeholderTextColor={colors.astraMuted}
            autoFocus
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
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.astraBorder,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.astraSurface,
    borderWidth: 1,
    borderColor: colors.astraBorder,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  backIcon: {
    fontSize: 18,
    color: colors.astraFg,
  },
  title: {
    fontFamily: 'InstrumentSerif-Italic',
    fontSize: 22,
    color: colors.astraFg,
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.astraViolet,
    paddingVertical: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.astraBorder,
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
    color: colors.astraFg,
  },
  rowLabelDanger: {
    color: '#FF4444',
  },
  rowSub: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: colors.astraMuted,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  arrow: {
    fontSize: 14,
    color: colors.astraMuted,
    marginLeft: 6,
  },
  toggle: {
    width: 48,
    height: 28,
    backgroundColor: colors.astraSurface,
    borderWidth: 1,
    borderColor: colors.astraBorder,
    borderRadius: 14,
    position: 'relative',
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: colors.astraViolet,
    borderColor: colors.astraViolet,
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
    color: colors.astraMuted,
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
    backgroundColor: colors.astraSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.astraBorder,
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
    color: colors.astraMuted,
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
    borderBottomColor: colors.astraBorder,
  },
  optionSelected: {
    backgroundColor: 'rgba(157, 141, 241, 0.05)',
  },
  optionLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: colors.astraFg,
  },
  optionLabelSelected: {
    color: colors.astraViolet,
  },
  checkIcon: {
    fontSize: 16,
    color: colors.astraViolet,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.astraBorder,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: colors.astraFg,
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
    color: colors.astraFg,
    borderBottomWidth: 1,
    borderBottomColor: colors.astraViolet,
    paddingBottom: 8,
  },
  saveBtn: {
    marginHorizontal: 24,
    backgroundColor: colors.astraViolet,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    color: colors.white,
  },
});

