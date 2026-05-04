import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CostarText } from './CostarCard';
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
    badge === 'major' ? colors.astraPink :
    badge === 'minor' ? colors.astraViolet :
    badge === 'shadow' ? colors.astraAmber :
    colors.astraPink;

  const renderBody = (text: string) => {
    const parts = text.split(/(<em>.*?<\/em>)/g);
    return (
      <CostarText style={styles.body}>
        {parts.map((part, index) => {
          if (part.startsWith('<em>') && part.endsWith('</em>')) {
            return (
              <CostarText key={index} style={[styles.bodyEm, { color: badgeColor }]}>
                {part.slice(4, -5)}
              </CostarText>
            );
          }
          return part;
        })}
      </CostarText>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CostarText style={styles.title} serif italic>{title}</CostarText>
        <View style={[styles.badge, { borderColor: badgeColor }]}>
          <CostarText style={[styles.badgeText, { color: badgeColor }]}>{badge}</CostarText>
        </View>
      </View>
      <CostarText style={styles.planets}>{planets}</CostarText>
      {renderBody(body)}
      <View style={styles.footer}>
        <CostarText style={styles.source}>{source}</CostarText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.astraSurface,
    borderWidth: 1,
    borderColor: colors.astraBorder,
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
    color: colors.astraFg,
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
    color: colors.astraMuted,
    marginBottom: 10,
    fontFamily: 'DM Sans',
  },
  body: {
    fontSize: 14,
    lineHeight: 23,
    color: colors.astraFg,
    fontFamily: 'DM Sans',
  },
  bodyEm: {
    fontStyle: 'italic',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.astraBorder,
    marginTop: 10,
    paddingTop: 8,
  },
  source: {
    fontSize: 10,
    letterSpacing: 1,
    color: colors.astraMuted,
    fontFamily: 'DM Sans',
  },
});
