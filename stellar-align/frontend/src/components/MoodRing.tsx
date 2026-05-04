import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { CostarText } from './CostarCard';
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
      <CostarText style={styles.label}>{label}</CostarText>
      <View style={styles.content}>
        <View style={styles.ringContainer}>
          <Svg width={68} height={68} viewBox="0 0 50 50">
            <Circle
              cx="25"
              cy="25"
              r={radius}
              stroke={colors.astraBorder}
              strokeWidth="5"
              fill="none"
            />
            <Circle
              cx="25"
              cy="25"
              r={radius}
              stroke={colors.astraAmber}
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="none"
              transform="rotate(-90 25 25)"
            />
          </Svg>
          <View style={styles.scoreContainer}>
            <CostarText style={styles.scoreText}>{score}</CostarText>
            <CostarText style={styles.scoreSubtext}>energy</CostarText>
          </View>
        </View>
        <View style={styles.aspectsContainer}>
          {aspects.map((aspect, index) => (
            <View key={index} style={styles.aspect}>
              <CostarText style={styles.aspectKey}>{aspect.key}</CostarText>
              <CostarText
                style={[
                  styles.aspectVal,
                  aspect.highlight && { color: colors.astraAmber },
                ]}
              >
                {aspect.val}
              </CostarText>
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
    color: colors.astraViolet,
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
    color: colors.astraFg,
    fontWeight: '500',
    fontFamily: 'Instrument Serif',
  },
  scoreSubtext: {
    fontSize: 9,
    color: colors.astraMuted,
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
    color: colors.astraFg,
    fontFamily: 'DM Sans',
  },
  aspectVal: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.astraMuted,
    fontFamily: 'DM Sans',
  },
});
