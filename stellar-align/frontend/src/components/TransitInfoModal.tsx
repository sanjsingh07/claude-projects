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
import { StellarText } from './StellarCard';
import { colors } from '@theme/theme';

const { height } = Dimensions.get('window');

interface TransitInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TransitInfoModal: React.FC<TransitInfoModalProps> = ({
  visible,
  onClose,
}) => {
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
            <StellarText style={styles.title} serif>Transit Methodology</StellarText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <StellarText style={styles.closeIcon}>✕</StellarText>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <StellarText style={styles.description}>
              Our transit engine uses high-precision astronomical data to calculate real-time planetary movements against your specific birth coordinates.
            </StellarText>

            <View style={styles.section}>
              <StellarText style={styles.sectionTitle}>CALCULATION LAYERS</StellarText>
              <View style={styles.layerItem}>
                <StellarText style={styles.layerTitle}>1. Geometric Precision</StellarText>
                <StellarText style={styles.layerDesc}>We calculate the exact mathematical angle between planets using high-fidelity ephemeris data.</StellarText>
              </View>
              <View style={styles.layerItem}>
                <StellarText style={styles.layerTitle}>2. Personal Resonance</StellarText>
                <StellarText style={styles.layerDesc}>We map "hits" to your specific birth chart degrees (Sun, Moon, Rising, and all major planets).</StellarText>
              </View>
              <View style={[styles.layerItem, { borderBottomWidth: 0 }]}>
                <StellarText style={styles.layerTitle}>3. Temporal Depth</StellarText>
                <StellarText style={styles.layerDesc}>We calculate the entire window of influence, tracking a transit from its first stirrings to its final resolution. Detailed Month and Year forecasts are available for Premium subscribers.</StellarText>
              </View>
            </View>

            <View style={styles.section}>
              <StellarText style={styles.sectionTitle}>DUAL SYSTEM ANALYSIS</StellarText>
              <StellarText style={styles.bodyText}>
                Stellar Align calculates transits for both major astrological systems simultaneously to give you the most complete picture.
              </StellarText>
              
              <View style={styles.layerItem}>
                <StellarText style={styles.layerTitle}>Western (Tropical)</StellarText>
                <StellarText style={styles.layerDesc}>Aligned with the seasons. Focuses on psychological evolution and internal shifts.</StellarText>
              </View>
              
              <View style={[styles.layerItem, { borderBottomWidth: 0 }]}>
                <StellarText style={styles.layerTitle}>Vedic (Sidereal)</StellarText>
                <StellarText style={styles.layerDesc}>Aligned with fixed stars. Focuses on physical manifestations, karma, and external events.</StellarText>
              </View>
            </View>

            <View style={styles.section}>
              <StellarText style={styles.sectionTitle}>WHY TWO DATES FOR ONE EVENT?</StellarText>
              <StellarText style={styles.bodyText}>
                You may see "Moon enters Taurus (Western)" on one day and "(Vedic)" a day later. 
              </StellarText>
              <StellarText style={styles.bodyText}>
                This is due to the <StellarText style={{fontWeight: '700'}}>precession of the equinoxes</StellarText>. The Western zodiac shifts ahead of the physical constellations by about 24°. We show both hit points so you can track when the energy enters your psychological field vs. your physical reality.
              </StellarText>
            </View>

            <View style={styles.section}>
              <StellarText style={styles.sectionTitle}>TRANSIT CLASSIFICATION</StellarText>
              <View style={styles.layerItem}>
                <StellarText style={styles.layerTitle}>Major Transits</StellarText>
                <StellarText style={styles.layerDesc}>Slow-moving outer planets (Saturn, Pluto, etc.) or "tight" hits from fast inner planets. These define your current life chapters.</StellarText>
              </View>
              <View style={styles.layerItem}>
                <StellarText style={styles.layerTitle}>Minor Transits</StellarText>
                <StellarText style={styles.layerDesc}>Daily planetary connections that flavor your mood and short-term interactions.</StellarText>
              </View>
              <View style={[styles.layerItem, { borderBottomWidth: 0 }]}>
                <StellarText style={styles.layerTitle}>Shadow Influence</StellarText>
                <StellarText style={styles.layerDesc}>Felt as a planet approaches or leaves an exact hit. It's the "background noise" or the anticipation of a shift.</StellarText>
              </View>
            </View>

            <View style={styles.section}>
              <StellarText style={styles.sectionTitle}>FLOW OF ENERGY</StellarText>
              <View style={styles.layerItem}>
                <StellarText style={styles.layerTitle}>Applying (Building)</StellarText>
                <StellarText style={styles.layerDesc}>The planet is moving towards an exact hit. The energy is intensifying and often feels most potent here.</StellarText>
              </View>
              <View style={[styles.layerItem, { borderBottomWidth: 0 }]}>
                <StellarText style={styles.layerTitle}>Separating (Waning)</StellarText>
                <StellarText style={styles.layerDesc}>The peak has passed. The energy is integrating, resolving, or moving into the "rear-view mirror."</StellarText>
              </View>
            </View>

            <View style={styles.footer}>
              <StellarText style={styles.footerText}>
                All transits use the Lahiri Ayanamsa for Sidereal calculations and standard Tropical degrees for Western.
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
  bodyText: {
    fontSize: 14,
    color: colors.stellarFg,
    lineHeight: 20,
    marginBottom: 16,
    opacity: 0.8,
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
