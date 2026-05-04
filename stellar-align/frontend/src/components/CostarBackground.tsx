import React, { memo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { colors } from '@theme/theme';

interface Star {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

interface ConstellationLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Generate deterministic pseudo-random stars based on position
const generateStars = (count: number = 50): Star[] => {
  const stars: Star[] = [];
  const seed = 12345; // Fixed seed for consistency

  const pseudoRandom = (index: number) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < count; i++) {
    stars.push({
      id: `star-${i}`,
      x: pseudoRandom(i) * 100,
      y: pseudoRandom(i + 1000) * 100,
      size: pseudoRandom(i + 2000) * 2 + 1,
      opacity: pseudoRandom(i + 3000) * 0.5 + 0.2,
    });
  }

  return stars;
};

export const CostarBackground: React.FC<{ style?: any }> = memo(({ style }) => {
  const stars = React.useMemo(() => generateStars(60), []);

  return (
    <View style={[styles.container, style]}>
      {stars.map((star) => (
        <View
          key={star.id}
          style={[
            styles.star,
            {
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            },
          ]}
        />
      ))}
      {/* Constellation lines - subtle connecting lines */}
      <View style={styles.constellationLine1} />
      <View style={styles.constellationLine2} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.astraBg,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: 9999,
  },
  constellationLine1: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 1,
    height: 100,
    backgroundColor: colors.gray800,
    transform: [{ rotate: '45deg' }],
  },
  constellationLine2: {
    position: 'absolute',
    top: '60%',
    left: '50%',
    width: 1,
    height: 80,
    backgroundColor: colors.gray800,
    transform: [{ rotate: '-30deg' }],
  },
});

export default CostarBackground;
