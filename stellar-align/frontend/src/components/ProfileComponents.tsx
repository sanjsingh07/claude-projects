import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/theme';

export const ProfileHero: React.FC<{
  name: string;
  avatarInitial: string;
  subtitle: string;
  badges: Array<{ label: string; type: 'accent' | 'pink' | 'default' }>;
  onSettingsPress: () => void;
}> = ({ name, avatarInitial, subtitle, badges, onSettingsPress }) => {
  return (
    <View style={styles.hero}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarInitial}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.badges}>
          {badges.map((badge, i) => (
            <View 
              key={i} 
              style={[
                styles.badge, 
                badge.type === 'accent' && styles.badgeAccent,
                badge.type === 'pink' && styles.badgePink
              ]}
            >
              <Text style={[
                styles.badgeText,
                badge.type === 'accent' && styles.badgeTextAccent,
                badge.type === 'pink' && styles.badgeTextPink
              ]}>
                {badge.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <TouchableOpacity style={styles.settingsBtn} onPress={onSettingsPress}>
        <Text style={styles.settingsIcon}>⚙</Text>
      </TouchableOpacity>
    </View>
  );
};

export const BirthDataGrid: React.FC<{
  items: Array<{ key: string; val: string; sub?: string }>;
}> = ({ items }) => {
  return (
    <View style={styles.grid}>
      {items.map((item, i) => (
        <View key={i} style={styles.dataItem}>
          <Text style={styles.dataKey}>{item.key}</Text>
          <Text style={styles.dataVal}>{item.val}</Text>
          {item.sub && <Text style={styles.dataSub}>{item.sub}</Text>}
        </View>
      ))}
    </View>
  );
};

export const ToggleSection: React.FC<{
  title: string;
  items: Array<{ k: string; sub: string; on: boolean; onToggle: () => void }>;
}> = ({ title, items }) => {
  return (
    <View style={styles.notifSection}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {items.map((item, i) => (
        <View key={i} style={[styles.notifRow, i === items.length - 1 && styles.lastRow]}>
          <View>
            <Text style={styles.notifK}>{item.k}</Text>
            <Text style={styles.notifSub}>{item.sub}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.toggle, item.on && styles.toggleOn]} 
            onPress={item.onToggle}
          >
            <View style={[styles.toggleCircle, item.on && styles.toggleCircleOn]} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

export const NotificationSection = ToggleSection;

export const SignOutButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.signoutBtn} onPress={onPress}>
      <Text style={styles.signoutText}>Sign out</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.astraBorder,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.astraViolet, // Simplified from gradient for now
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'InstrumentSerif-Italic',
    fontSize: 26,
    color: colors.astraFg,
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontFamily: 'InstrumentSerif-Italic',
    fontSize: 24,
    color: colors.astraFg,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: colors.astraMuted,
    marginTop: 4,
  },
  badges: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.astraBorder,
    marginRight: 6,
    marginBottom: 4,
  },
  badgeAccent: {
    borderColor: colors.astraViolet,
  },
  badgePink: {
    borderColor: colors.astraPink,
  },
  badgeText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.astraMuted,
  },
  badgeTextAccent: {
    color: colors.astraViolet,
  },
  badgeTextPink: {
    color: colors.astraPink,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.astraSurface,
    borderWidth: 1,
    borderColor: colors.astraBorder,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 16,
    color: colors.astraFg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
  },
  dataItem: {
    width: '48.5%',
    backgroundColor: colors.astraSurface,
    borderWidth: 1,
    borderColor: colors.astraBorder,
    borderRadius: 10,
    padding: 12,
  },
  dataKey: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.astraMuted,
  },
  dataVal: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 16,
    color: colors.astraFg,
    marginTop: 4,
  },
  dataSub: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: colors.astraMuted,
    marginTop: 2,
  },
  notifSection: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  sectionLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.astraViolet,
    marginBottom: 10,
  },
  notifRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.astraBorder,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  notifK: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: colors.astraFg,
  },
  notifSub: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: colors.astraMuted,
    marginTop: 2,
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
  signoutBtn: {
    width: '100%',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  signoutText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: colors.astraMuted,
    letterSpacing: 0.5,
  },
});
