import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { DivisionalChart, DivisionalChartPosition, Nakshatra } from '@types';

interface VedicChartCardProps {
  chart: DivisionalChart;
  nakshatra?: Nakshatra | null;
}

const CHART_INFO: Record<string, { name: string; purpose: string }> = {
  D1: { name: 'Rashi', purpose: 'Main Chart - Life & Personality' },
  D2: { name: 'Hora', purpose: 'Wealth & Finances' },
  D4: { name: 'Chaturthamsa', purpose: 'Fortune & Property' },
  D9: { name: 'Navamsa', purpose: 'Spouse, Dharma & Strength' },
  D10: { name: 'Dasamsa', purpose: 'Career & Profession' },
  D11: { name: 'Ekadasamsa', purpose: 'Gains & Losses' },
};

const SIGN_ICONS: Record<string, string> = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
  leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
  sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
};

const SIGN_ORDER = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

function normalizeSign(sign: string): string {
  return sign?.toLowerCase?.().replace(/_/g, ' ') || '';
}

function formatSign(sign: string): string {
  const normalized = normalizeSign(sign);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function oppositeSign(sign: string): string {
  const index = SIGN_ORDER.indexOf(normalizeSign(sign));
  return index >= 0 ? SIGN_ORDER[(index + 6) % 12] : sign;
}

function oppositeHouse(house: number): number {
  return ((house + 5) % 12) + 1;
}

function displayPlanetName(planet: string): string {
  const normalized = planet?.toLowerCase?.() || '';
  if (['node', 'true_node', 'mean_node', 'north_node', 'northnode', 'rahu'].includes(normalized)) {
    return 'Rahu';
  }
  if (['south_node', 'southnode', 'ketu'].includes(normalized)) {
    return 'Ketu';
  }
  return normalized.replace(/_/g, ' ');
}

function withRahuKetu(positions: DivisionalChartPosition[]): DivisionalChartPosition[] {
  const hasKetu = positions.some((position) =>
    ['south_node', 'southnode', 'ketu'].includes(position.planet?.toLowerCase?.() || '')
  );
  const rahu = positions.find((position) =>
    ['node', 'true_node', 'mean_node', 'north_node', 'northnode', 'rahu'].includes(position.planet?.toLowerCase?.() || '')
  );

  if (!rahu || hasKetu) {
    return positions;
  }

  return [
    ...positions,
    {
      ...rahu,
      planet: 'ketu',
      sign: oppositeSign(rahu.sign),
      house: rahu.house ? oppositeHouse(rahu.house) : rahu.house,
    },
  ];
}

export const VedicChartCard: React.FC<VedicChartCardProps> = ({ chart, nakshatra }) => {
  const chartInfo = CHART_INFO[chart.chartType] || { name: chart.chartType, purpose: '' };

  const renderPlanetList = () => {
    const planetsBySign: Record<string, DivisionalChartPosition[]> = {};

    withRahuKetu(chart.planetaryPositions).forEach((planet) => {
      const sign = normalizeSign(planet.sign);
      if (!planetsBySign[sign]) {
        planetsBySign[sign] = [];
      }
      planetsBySign[sign].push(planet);
    });

    return Object.entries(planetsBySign).map(([sign, planets]) => (
      <View key={sign} style={styles.signGroup}>
        <View style={styles.signHeader}>
          <Text style={styles.signIcon}>{SIGN_ICONS[sign] || sign}</Text>
          <Text style={styles.signName}>{formatSign(sign)}</Text>
        </View>
        {planets.map((planet) => (
          <View key={planet.planet} style={styles.planetRow}>
            <Text style={styles.planetName}>{displayPlanetName(planet.planet)}</Text>
            <Text style={styles.planetDegree}>
              {planet.degree}°{planet.house ? ` H${planet.house}` : ''}
            </Text>
          </View>
        ))}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.chartType}>{chart.chartType}</Text>
          <Text style={styles.chartName}>{chartInfo.name}</Text>
          <Text style={styles.chartPurpose}>{chartInfo.purpose}</Text>
        </View>
        <View style={styles.ascendantBox}>
          <Text style={styles.ascendantLabel}>Ascendant</Text>
          <Text style={styles.ascendantValue}>
            {SIGN_ICONS[normalizeSign(chart.ascendant)]} {formatSign(chart.ascendant)}
          </Text>
          <Text style={styles.ascendantDegree}>{chart.ascendantDegree}°</Text>
        </View>
      </View>

      {nakshatra && (
        <View style={styles.nakshatraBox}>
          <Text style={styles.nakshatraLabel}>Nakshatra</Text>
          <Text style={styles.nakshatraValue}>{nakshatra.name}</Text>
          <Text style={styles.nakshatraPada}>Pada {nakshatra.pada}</Text>
          <Text style={styles.nakshatraLord}>Lord: {nakshatra.lord}</Text>
        </View>
      )}

      <ScrollView style={styles.chartContent} showsVerticalScrollIndicator={false}>
        {renderPlanetList()}
      </ScrollView>
    </View>
  );
};

export const VedicChartSelector: React.FC<{
  selectedChart: string | null;
  onSelectChart: (type: 'D1' | 'D2' | 'D4' | 'D9' | 'D10' | 'D11') => void;
}> = ({ selectedChart, onSelectChart }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selector}>
      {Object.entries(CHART_INFO).map(([type, info]) => (
        <TouchableOpacity
          key={type}
          onPress={() => onSelectChart(type as 'D1' | 'D2' | 'D4' | 'D9' | 'D10' | 'D11')}
          style={[
            styles.selectorButton,
            selectedChart === type && styles.selectorButtonSelected,
          ]}
        >
          <Text
            style={[
              styles.selectorType,
              selectedChart === type && styles.selectorTypeSelected,
            ]}
          >
            {type}
          </Text>
          <Text
            style={[
              styles.selectorName,
              selectedChart === type && styles.selectorNameSelected,
            ]}
          >
            {info.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  chartType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#a855f7',
  },
  chartName: {
    fontSize: 16,
    color: '#e0e0e0',
    marginTop: 4,
  },
  chartPurpose: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  ascendantBox: {
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  ascendantLabel: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
  },
  ascendantValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginTop: 4,
  },
  ascendantDegree: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  nakshatraBox: {
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  nakshatraLabel: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
  },
  nakshatraValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e0e0e0',
  },
  nakshatraPada: {
    fontSize: 12,
    color: '#a855f7',
  },
  nakshatraLord: {
    fontSize: 12,
    color: '#aaa',
  },
  chartContent: {
    maxHeight: 300,
  },
  signGroup: {
    marginBottom: 16,
  },
  signHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a4e',
  },
  signIcon: {
    fontSize: 20,
    color: '#a855f7',
    marginRight: 8,
  },
  signName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e0e0e0',
    textTransform: 'capitalize',
  },
  planetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  planetName: {
    fontSize: 14,
    color: '#e0e0e0',
    textTransform: 'uppercase',
  },
  planetDegree: {
    fontSize: 12,
    color: '#888',
  },
  selector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  selectorButton: {
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  selectorButtonSelected: {
    backgroundColor: '#a855f7',
  },
  selectorType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a855f7',
  },
  selectorTypeSelected: {
    color: '#fff',
  },
  selectorName: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  selectorNameSelected: {
    color: '#e0e0e0',
  },
});
