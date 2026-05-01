import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '@theme/theme';

interface MoonPhaseProps {
  phase: string;
  illumination?: number;
  size?: number;
  showLabel?: boolean;
}

const phasePaths: Record<string, { path: string; label: string }> = {
  new: {
    path: 'M20 2 A18 18 0 1 1 20 38 A18 18 0 1 1 20 2',
    label: 'New Moon',
  },
  'waxing-crescent': {
    path: 'M20 2 A18 18 0 1 1 20 38 A18 18 0 1 1 20 2 M20 6 A14 14 0 1 0 20 34 A10 10 0 1 1 20 6',
    label: 'Waxing Crescent',
  },
  'first-quarter': {
    path: 'M20 2 A18 18 0 1 1 20 38 A18 18 0 1 1 20 2 M20 6 A14 14 0 1 0 20 34',
    label: 'First Quarter',
  },
  'waxing-gibbous': {
    path: 'M20 2 A18 18 0 1 1 20 38 A18 18 0 1 1 20 2 M20 6 A14 14 0 1 0 20 34 A6 14 0 1 1 20 6',
    label: 'Waxing Gibbous',
  },
  full: {
    path: 'M20 2 A18 18 0 1 1 20 38 A18 18 0 1 1 20 2',
    label: 'Full Moon',
  },
  'waning-gibbous': {
    path: 'M20 2 A18 18 0 1 1 20 38 A18 18 0 1 1 20 2 M20 6 A14 14 0 1 1 20 34 A6 14 0 1 0 20 6',
    label: 'Waning Gibbous',
  },
  'last-quarter': {
    path: 'M20 2 A18 18 0 1 1 20 38 A18 18 0 1 1 20 2 M20 6 A14 14 0 1 1 20 34 A0 14 0 1 0 20 6',
    label: 'Last Quarter',
  },
  'waning-crescent': {
    path: 'M20 2 A18 18 0 1 1 20 38 A18 18 0 1 1 20 2 M20 6 A14 14 0 1 1 20 34 A10 10 0 1 0 20 6',
    label: 'Waning Crescent',
  },
};

export const MoonPhase: React.FC<MoonPhaseProps> = ({
  phase,
  illumination,
  size = 60,
  showLabel = true,
}) => {
  const phaseData = phasePaths[phase?.toLowerCase()] || phasePaths['new'];
  const strokeWidth = size / 15;

  return (
    <View style={styles.container}>
      <View style={[styles.moonContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Defs>
            <LinearGradient id="moonGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="1" stopColor="#A0A0A0" />
            </LinearGradient>
          </Defs>
          <G
            stroke={colors.gray700}
            strokeWidth={0.5}
            fill="url(#moonGradient)"
          >
            <Path d={phaseData.path} />
          </G>
          {/* Craters - minimal, subtle */}
          <Circle cx="14" cy="14" r="2" fill={colors.gray800} opacity={0.3} />
          <Circle cx="26" cy="20" r="1.5" fill={colors.gray800} opacity={0.2} />
          <Circle cx="18" cy="28" r="1.8" fill={colors.gray800} opacity={0.25} />
        </Svg>
      </View>
      {showLabel && (
        <View style={styles.labelContainer}>
          <View style={styles.labelDot} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  moonContainer: {
    marginBottom: 8,
  },
  labelContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  labelDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray600,
  },
  label: {
    fontSize: 12,
    color: colors.gray500,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  illumination: {
    fontSize: 10,
    color: colors.gray600,
    marginTop: 2,
  },
});

export default MoonPhase;
