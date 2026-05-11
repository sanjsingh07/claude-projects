import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StellarText } from './StellarCard';
import { colors } from '@theme/theme';

interface TransitCardProps {
  title: string;
  badge: string;
  planets: string;
  body: string;
  source: string;
}

export const TransitCard: React.FC<TransitCardProps> = ({
  title,
  badge,
  planets,
  body,
  source,
}) => {
  const badgeColor = 
    badge === 'major' ? colors.stellarPink :
    badge === 'minor' ? colors.stellarViolet :
    badge === 'shadow' ? colors.stellarAmber :
    colors.stellarPink;

  const renderBody = (text: string) => {
    const parts = text.split(/(<em>.*?<\/em>)/g);
    return (
      <StellarText style={styles.body}>
        {parts.map((part, index) => {
          if (part.startsWith('<em>') && part.endsWith('</em>')) {
            return (
              <StellarText key={index} style={[styles.bodyEm, { color: badgeColor }]}>
                {part.slice(4, -5)}
              </StellarText>
            );
          }
          return part;
        })}
      </StellarText>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <StellarText style={styles.title} serif italic>{title}</StellarText>
        <View style={[styles.badge, { borderColor: badgeColor }]}>
          <StellarText style={[styles.badgeText, { color: badgeColor }]}>{badge}</StellarText>
        </View>
      </View>
      <StellarText style={styles.planets}>{planets}</StellarText>
      {renderBody(body)}
      <View style={styles.footer}>
        <StellarText style={styles.source}>{source}</StellarText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.stellarSurface,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    borderRadius: 14,
    padding: 16,
    marginBottom: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    color: colors.stellarFg,
    lineHeight: 22,
    flex: 1,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontFamily: 'DM Sans',
  },
  planets: {
    fontSize: 12,
    color: colors.stellarMuted,
    marginBottom: 10,
    fontFamily: 'DM Sans',
  },
  body: {
    fontSize: 14,
    lineHeight: 23,
    color: colors.stellarFg,
    fontFamily: 'DM Sans',
  },
  bodyEm: {
    fontStyle: 'italic',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.stellarBorder,
    marginTop: 10,
    paddingTop: 8,
  },
  source: {
    fontSize: 10,
    letterSpacing: 1,
    color: colors.stellarMuted,
    fontFamily: 'DM Sans',
  },
});
