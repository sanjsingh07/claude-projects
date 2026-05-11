import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { StellarText } from '@components/StellarCard';
import { colors } from '@theme/theme';

interface CompatibilityRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export const CompatibilityRing: React.FC<CompatibilityRingProps> = ({
  score,
  size = 100,
  strokeWidth = 4,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 100) * circumference;

  const getLabel = (s: number): string => {
    if (s >= 80) return 'HARMONIOUS';
    if (s >= 60) return 'COMPATIBLE';
    if (s >= 40) return 'MIXED';
    if (s >= 20) return 'CHALLENGING';
    return 'COMPLEX';
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.gray800}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.white}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
          />
        </G>
      </Svg>
      <View style={[styles.textContainer, { width: size, height: size }]}>
        <StellarText variant="heading2" style={styles.score}>
          {Math.round(score)}
        </StellarText>
        <StellarText variant="caption" color={colors.gray500} style={styles.label}>
          {getLabel(score)}
        </StellarText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    marginTop: 4,
  },
  label: {
    marginTop: 2,
  },
});

export default CompatibilityRing;
