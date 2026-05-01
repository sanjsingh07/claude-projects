import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { colors } from '@theme/theme';

const signPaths: Record<string, string[]> = {
  aries: [
    'M 16 8 C 18 4, 24 4, 26 10 L 26 28 M 16 8 C 14 4, 8 4, 6 10 L 6 28',
  ],
  taurus: [
    'M 12 16 A 8 8 0 1 1 28 16 A 8 8 0 1 1 12 16 M 20 24 L 20 32',
  ],
  gemini: [
    'M 14 8 L 14 32 M 26 8 L 26 32 M 14 12 L 26 12 M 14 28 L 26 28 M 14 20 L 26 20',
  ],
  cancer: [
    'M 8 16 A 4 4 0 1 1 16 16 A 4 4 0 1 1 24 16 A 4 4 0 1 1 32 16 M 20 20 Q 20 32, 28 32',
  ],
  leo: [
    'M 20 12 A 8 8 0 1 1 20 28 A 8 8 0 1 1 20 12 M 16 18 Q 8 18, 8 24 Q 8 30, 20 30',
  ],
  virgo: [
    'M 8 8 L 8 24 Q 8 32, 16 32 M 16 8 L 16 28 M 24 8 L 24 24 Q 24 32, 32 32 M 32 24 L 32 8',
  ],
  libra: [
    'M 8 24 L 32 24 M 6 20 L 34 20 M 20 20 L 20 8 M 12 8 A 8 2 0 1 1 28 8 A 8 2 0 1 1 12 8',
  ],
  scorpio: [
    'M 8 24 L 8 16 M 16 24 L 16 16 M 24 24 L 24 12 Q 24 8, 28 8 M 28 24 Q 28 32, 36 32',
  ],
  sagittarius: [
    'M 8 24 L 28 4 M 20 4 L 28 4 L 28 12 M 8 12 L 8 28 L 24 28',
  ],
  capricorn: [
    'M 8 28 L 16 8 L 20 16 L 24 20 Q 32 24, 32 16 Q 32 8, 24 8',
  ],
  aquarius: [
    'M 6 14 L 10 18 L 14 14 L 18 18 L 22 14 L 26 18 L 30 14 M 6 22 L 10 26 L 14 22 L 18 26 L 22 22 L 26 26 L 30 22',
  ],
  pisces: [
    'M 12 8 C 18 8, 22 16, 28 16 M 12 24 C 18 24, 22 16, 28 16 M 12 8 L 12 24 M 28 8 L 28 24',
  ],
};

interface SignIconProps {
  sign: string;
  size?: number;
  color?: string;
  style?: any;
  strokeWidth?: number;
}

export const SignIcon: React.FC<SignIconProps> = ({
  sign,
  size = 40,
  color = colors.white,
  style,
  strokeWidth,
}) => {
  const paths = signPaths[sign?.toLowerCase()] || signPaths.aries;
  const defaultStrokeWidth = strokeWidth || size / 20;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <G
          stroke={color}
          strokeWidth={defaultStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          {paths.map((d, i) => (
            <Path key={i} d={d} />
          ))}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SignIcon;
