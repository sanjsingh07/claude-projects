import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { StellarText, StellarCard } from './StellarCard';
import { colors } from '@theme/theme';
import { DailyHoroscope } from '@types';

const { height } = Dimensions.get('window');

interface GenerationInfoModalProps {
  visible: boolean;
  onClose: () => void;
  horoscope: DailyHoroscope | null;
}

export const GenerationInfoModal: React.FC<GenerationInfoModalProps> = ({
  visible,
  onClose,
  horoscope,
}) => {
  if (!horoscope) return null;

  const meta = horoscope.generationMeta;
  const isVedic = meta?.zodiacType === 'SIDEREAL';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.dismissArea} 
          onPress={onClose} 
        />

        <View style={styles.modalContent}>
          <View style={styles.header}>
            <StellarText style={styles.title} serif>Calculation Method</StellarText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <StellarText style={styles.closeIcon}>✕</StellarText>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <StellarText style={styles.description}>
              Your horoscope is synthesized by an expert astrologer using a multi-layered analysis of your unique celestial signature against the current sky.
            </StellarText>

            <View style={styles.section}>
              <StellarText style={styles.sectionTitle}>ANALYSIS LAYERS</StellarText>
              <View style={styles.layerItem}>
                <StellarText style={styles.layerTitle}>1. Natal Integration</StellarText>
                <StellarText style={styles.layerDesc}>We cross-reference the 10 active planets against your specific birth degrees (Sun, Moon, and Rising) to find exact hits to your energy.</StellarText>
              </View>
              <View style={styles.layerItem}>
                <StellarText style={styles.layerTitle}>2. Collective Weather</StellarText>
                <StellarText style={styles.layerDesc}>We analyze mundane aspects—major planetary connections in the sky today that affect the global energetic field.</StellarText>
              </View>
              <View style={[styles.layerItem, { borderBottomWidth: 0 }]}>
                <StellarText style={styles.layerTitle}>3. Intuitive Synthesis</StellarText>
                <StellarText style={styles.layerDesc}>These technical factors are woven into a narrative focused on your personal growth and practical navigation.</StellarText>
              </View>
            </View>

            <View style={styles.section}>
              <StellarText style={styles.sectionTitle}>ASTRONOMICAL ANCHOR</StellarText>
              <View style={styles.infoRow}>
                <StellarText style={styles.label}>Calculation System</StellarText>
                <StellarText style={styles.value}>{meta?.system || (isVedic ? 'Vedic (Sidereal)' : 'Western (Tropical)')}</StellarText>
              </View>
              <View style={styles.infoRow}>
                <StellarText style={styles.label}>Today's Moon Sign</StellarText>
                <StellarText style={styles.value}>{horoscope.moonSign}</StellarText>
              </View>
              <View style={styles.infoRow}>
                <StellarText style={styles.label}>Current Moon Phase</StellarText>
                <StellarText style={styles.value}>{horoscope.moonPhase}</StellarText>
              </View>
              {meta?.ayanamsa && (
                <View style={styles.infoRow}>
                  <StellarText style={styles.label}>Ayanamsa</StellarText>
                  <StellarText style={styles.value}>{meta.ayanamsa}</StellarText>
                </View>
              )}
            </View>

            {isVedic && meta?.vedicDetails && (
              <View style={styles.section}>
                <StellarText style={styles.sectionTitle}>VEDIC SPECIFICS</StellarText>
                <View style={styles.infoRow}>
                  <StellarText style={styles.label}>Nakshatra</StellarText>
                  <StellarText style={styles.value}>{meta.vedicDetails.nakshatra} (Pada {meta.vedicDetails.pada})</StellarText>
                </View>
                <View style={styles.infoRow}>
                  <StellarText style={styles.label}>Ruling Lord</StellarText>
                  <StellarText style={styles.value}>{meta.vedicDetails.lord}</StellarText>
                </View>
                <View style={styles.infoRow}>
                  <StellarText style={styles.label}>Active Dasha</StellarText>
                  <StellarText style={styles.value}>{meta.vedicDetails.dasha}</StellarText>
                </View>
                {meta.vedicDetails.yogas && meta.vedicDetails.yogas.length > 0 && (
                  <View style={styles.yogaContainer}>
                    <StellarText style={styles.label}>Present Yogas</StellarText>
                    <View style={styles.tagCloud}>
                      {meta.vedicDetails.yogas.map((yoga, i) => (
                        <View key={i} style={styles.tag}>
                          <StellarText style={styles.tagText}>{yoga}</StellarText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {meta?.personalTransits && meta.personalTransits.length > 0 && (
              <View style={styles.section}>
                <StellarText style={styles.sectionTitle}>PERSONAL TRANSITS</StellarText>
                <StellarText style={styles.subDescription}>Specific pressure points affecting your natal placements today.</StellarText>
                {meta.personalTransits.slice(0, 5).map((t, i) => (
                  <View key={i} style={styles.transitItem}>
                    <StellarText style={styles.transitTitle}>{t.symbols} {t.title}</StellarText>
                  </View>
                ))}
              </View>
            )}

            {meta?.mundaneTransits && meta.mundaneTransits.length > 0 && (
              <View style={styles.section}>
                <StellarText style={styles.sectionTitle}>COLLECTIVE WEATHER</StellarText>
                <StellarText style={styles.subDescription}>General influences affecting the global energetic field.</StellarText>
                {meta.mundaneTransits.slice(0, 5).map((t, i) => (
                  <View key={i} style={styles.transitItem}>
                    <StellarText style={styles.transitTitle}>{t.symbols} {t.title}</StellarText>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.footer}>
              <StellarText style={styles.footerText}>
                The reading is generated by synthesizing these technical factors into an intuitive narrative for your personal growth.
              </StellarText>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  dismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.stellarBg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
    paddingHorizontal: 24,
    maxHeight: height * 0.85,
    borderTopWidth: 1,
    borderTopColor: colors.stellarBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: colors.stellarFg,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.stellarSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.stellarBorder,
  },
  closeIcon: {
    fontSize: 12,
    color: colors.stellarFg,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  description: {
    fontSize: 15,
    color: colors.stellarFg,
    lineHeight: 22,
    marginBottom: 24,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
    backgroundColor: colors.stellarSurface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.stellarMuted,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  layerItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder + '40',
  },
  layerTitle: {
    fontSize: 14,
    color: colors.stellarFg,
    fontWeight: '600',
    marginBottom: 4,
  },
  layerDesc: {
    fontSize: 13,
    color: colors.stellarMuted,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    color: colors.stellarMuted,
  },
  value: {
    fontSize: 14,
    color: colors.stellarFg,
    fontWeight: '500',
  },
  yogaContainer: {
    marginTop: 8,
  },
  tagCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: colors.stellarViolet + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.stellarViolet + '40',
  },
  tagText: {
    fontSize: 12,
    color: colors.stellarViolet,
  },
  subDescription: {
    fontSize: 12,
    color: colors.stellarMuted,
    marginBottom: 12,
  },
  transitItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder,
  },
  transitTitle: {
    fontSize: 13,
    color: colors.stellarFg,
  },
  footer: {
    paddingHorizontal: 8,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: colors.stellarMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
});
