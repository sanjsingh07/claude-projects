import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { StellarText } from './StellarCard';
import { colors } from '@theme/theme';

interface MoodRingProps {
  score: number;
  label: string;
  aspects: {
    key: string;
    val: string;
    highlight?: boolean;
  }[];
}

export const MoodRing: React.FC<MoodRingProps> = ({ score, label, aspects }) => {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <View style={styles.container}>
      <StellarText style={styles.label}>{label}</StellarText>
      <View style={styles.content}>
        <View style={styles.ringContainer}>
          <Svg width={68} height={68} viewBox="0 0 50 50">
            <Circle
              cx="25"
              cy="25"
              r={radius}
              stroke={colors.stellarBorder}
              strokeWidth="5"
              fill="none"
            />
            <Circle
              cx="25"
              cy="25"
              r={radius}
              stroke={colors.stellarAmber}
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="none"
              transform="rotate(-90 25 25)"
            />
          </Svg>
          <View style={styles.scoreContainer}>
            <StellarText style={styles.scoreText}>{score}</StellarText>
            <StellarText style={styles.scoreSubtext}>energy</StellarText>
          </View>
        </View>
        <View style={styles.aspectsContainer}>
          {aspects.map((aspect, index) => (
            <View key={index} style={styles.aspect}>
              <StellarText style={styles.aspectKey}>{aspect.key}</StellarText>
              <StellarText
                style={[
                  styles.aspectVal,
                  aspect.highlight && { color: colors.stellarAmber },
                ]}
              >
                {aspect.val}
              </StellarText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.stellarViolet,
    marginBottom: 12,
    fontFamily: 'DM Sans', // Assuming DM Sans is available or falls back
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  ringContainer: {
    width: 68,
    height: 68,
    position: 'relative',
  },
  scoreContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    color: colors.stellarFg,
    fontWeight: '500',
    fontFamily: 'Instrument Serif',
  },
  scoreSubtext: {
    fontSize: 9,
    color: colors.stellarMuted,
    letterSpacing: 1,
    fontFamily: 'DM Sans',
  },
  aspectsContainer: {
    flex: 1,
    gap: 6,
  },
  aspect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aspectKey: {
    fontSize: 13,
    color: colors.stellarFg,
    fontFamily: 'DM Sans',
  },
  aspectVal: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.stellarMuted,
    fontFamily: 'DM Sans',
  },
});
