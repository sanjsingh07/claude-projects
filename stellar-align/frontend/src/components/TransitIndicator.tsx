import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StellarText } from '@components/StellarCard';
import { colors, spacing, theme } from '@theme/theme';

interface TransitIndicatorProps {
  count: number;
  highlightedPlanets?: string[];
}

const planetColors: Record<string, string> = {
  sun: '#FFD700',
  moon: '#C0C0C0',
  mercury: '#9ACD32',
  venus: '#FF69B4',
  mars: '#FF4500',
  jupiter: '#DAA520',
  saturn: '#708090',
  uranus: '#00CED1',
  neptune: '#4169E1',
  pluto: '#8B008B',
};

const planetSymbols: Record<string, string> = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '⛢',
  neptune: '♆',
  pluto: '♇',
};

export const TransitIndicator: React.FC<TransitIndicatorProps> = ({
  count,
  highlightedPlanets = [],
}) => {
  const mainPlanets = highlightedPlanets.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StellarText variant="heading2" style={styles.count}>
          {count}
        </StellarText>
        <StellarText variant="caption" color={colors.gray500} style={styles.label}>
          active transit{count !== 1 ? 's' : ''}
        </StellarText>
      </View>
      {mainPlanets.length > 0 && (
        <View style={styles.planetsRow}>
          {mainPlanets.map((planet) => (
            <View
              key={planet}
              style={[
                styles.planetBadge,
                { borderColor: planetColors[planet] || colors.gray500 },
              ]}
            >
              <StellarText
                variant="body"
                style={{ color: planetColors[planet] || colors.gray500 }}
              >
                {planetSymbols[planet] || planet.charAt(0).toUpperCase()}
              </StellarText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: colors.gray700,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    marginRight: spacing.sm,
  },
  label: {
    marginLeft: 4,
  },
  planetsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  planetBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray800,
  },
  planetSymbol: {
    fontSize: 18,
  },
});

export default TransitIndicator;
