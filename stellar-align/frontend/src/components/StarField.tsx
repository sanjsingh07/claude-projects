import React, { memo, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { colors } from '@theme/theme';

interface Star {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

interface StarFieldProps {
  starCount?: number;
  animated?: boolean;
}

// Generate deterministic pseudo-random stars
const generateStars = (count: number = 100): Star[] => {
  const stars: Star[] = [];
  const seed = 42;

  const pseudoRandom = (index: number) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < count; i++) {
    stars.push({
      id: `star-${i}`,
      x: pseudoRandom(i) * 100,
      y: pseudoRandom(i + 500) * 100,
      size: pseudoRandom(i + 1000) * 2 + 0.5,
      opacity: pseudoRandom(i + 2000) * 0.6 + 0.2,
    });
  }

  return stars;
};

export const StarField: React.FC<StarFieldProps> = memo(({ starCount = 100 }) => {
  const stars = useMemo(() => generateStars(starCount), [starCount]);

  return (
    <View style={styles.container}>
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
    backgroundColor: colors.black,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: 9999,
  },
});

export default StarField;
