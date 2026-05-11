import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CostarText } from './CostarCard';
import { colors } from '@theme/theme';

interface AspectItem {
  symbol: string;
  name: string;
  description: string;
  quality: string;
}

interface AspectListProps {
  label: string;
  aspects: AspectItem[];
}

export const AspectList: React.FC<AspectListProps> = ({ label, aspects }) => {
  return (
    <View style={styles.container}>
      <CostarText style={styles.label}>{label}</CostarText>
      <View style={styles.list}>
        {aspects.map((item, index) => (
          <View key={index} style={[styles.item, index === aspects.length - 1 && styles.lastItem]}>
            <CostarText style={styles.symbol}>{item.symbol}</CostarText>
            <View style={styles.body}>
              <CostarText style={styles.name}>{item.name}</CostarText>
              <CostarText style={styles.description}>{item.description}</CostarText>
            </View>
            <View style={[styles.quality, getQualityStyle(item.quality)]}>
              <CostarText style={[styles.qualityText, getQualityTextStyle(item.quality)]}>
                {item.quality}
              </CostarText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

function getQualityStyle(quality: string) {
  const q = quality.toLowerCase();
  if (q.includes('opp')) return { backgroundColor: 'rgba(255, 141, 161, 0.15)' }; // stellarPink with alpha
  if (q.includes('sq')) return { backgroundColor: 'rgba(157, 141, 241, 0.2)' }; // stellarViolet with alpha
  if (q.includes('tr')) return { backgroundColor: 'rgba(92, 184, 92, 0.15)' }; // green fallback
  if (q.includes('sext') || q.includes('quin')) return { backgroundColor: 'rgba(255, 193, 94, 0.15)' }; // stellarAmber with alpha
  return { backgroundColor: colors.stellarBorder };
}

function getQualityTextStyle(quality: string) {
  const q = quality.toLowerCase();
  if (q.includes('opp')) return { color: colors.stellarPink };
  if (q.includes('sq')) return { color: colors.stellarViolet };
  if (q.includes('tr')) return { color: '#5cb85c' };
  if (q.includes('sext') || q.includes('quin')) return { color: colors.stellarAmber };
  return { color: colors.stellarMuted };
}

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.stellarViolet,
    marginBottom: 8,
    fontFamily: 'DM Sans',
  },
  list: {
    flexDirection: 'column',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  symbol: {
    fontSize: 18,
    color: colors.stellarFg,
    width: 30,
    textAlign: 'center',
    marginRight: 12,
  },
  body: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    color: colors.stellarFg,
    fontFamily: 'DM Sans',
  },
  description: {
    fontSize: 11,
    color: colors.stellarMuted,
    marginTop: 2,
    fontFamily: 'DM Sans',
  },
  quality: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  qualityText: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'lowercase',
    fontFamily: 'DM Sans',
  },
});
