import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CostarCard, CostarText } from '@components/CostarCard';
import { CostarBackground } from '@components/CostarBackground';
import { SignIcon } from '@components/SignIcon';
import { VedicChartCard, VedicChartSelector } from '@components/VedicChartCard';
import { useAuthStore } from '@store/authStore';
import { colors, spacing } from '@theme/theme';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@services/api';
import { useVedicChart } from '@hooks/useVedicChart';
import { DivisionalChartType } from '@types';

// Planet configuration
const PLANETS = [
  { name: 'Sun', key: 'sun' },
  { name: 'Moon', key: 'moon' },
  { name: 'Mercury', key: 'mercury' },
  { name: 'Venus', key: 'venus' },
  { name: 'Mars', key: 'mars' },
  { name: 'Jupiter', key: 'jupiter' },
  { name: 'Saturn', key: 'saturn' },
  { name: 'Uranus', key: 'uranus' },
  { name: 'Neptune', key: 'neptune' },
  { name: 'Pluto', key: 'pluto' },
] as const;

interface PlanetPosition {
  planet: string;
  sign: string;
  degree: number;
  retrograde: boolean;
  house?: number;
}

interface NatalChartData {
  sunSign: string;
  moonSign: string;
  risingSign: string;
  planetaryPositions: PlanetPosition[];
  houses: any[];
  aspects: any[];
}

export const ChartScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const {
    natalChart: vedicNatalChart,
    selectedDivisionalChart,
    divisionalCharts,
    nakshatra,
    calculateVedicChart,
    getVedicChart,
    selectDivisionalChart,
  } = useVedicChart();
  const [showVedic, setShowVedic] = useState(false);

  // Query for Western natal chart
  const {
    data: chart,
    isLoading: isChartLoading,
    error: chartError,
    refetch: refetchChart,
  } = useQuery<NatalChartData>({
    queryKey: ['natalChart', user?.id],
    queryFn: async () => {
      const response = await api.getNatalChart();
      return response.data as NatalChartData;
    },
    enabled: !!user?.id,
    retry: false,
  });

  // Mutation to calculate Western chart
  const calculateWesternChart = useMutation({
    mutationFn: async () => {
      const response = await api.recalculateChart();
      return response.data as NatalChartData;
    },
    onSuccess: () => {
      refetchChart();
    },
  });

  // Mutation to calculate Vedic chart
  const calculateVedic = useMutation({
    mutationFn: async (ayanamsa: 'lahiri' | 'raman' | 'krishnamurti' | 'fagan-bradley' = 'lahiri') => {
      const response = await calculateVedicChart(ayanamsa);
      return response;
    },
  });

  // Auto-calculate Western chart if missing
  useEffect(() => {
    if (user?.id && !chart && !isChartLoading && !calculateWesternChart.isPending) {
      Alert.alert(
        'No Natal Chart',
        'Your natal chart has not been calculated yet. Would you like to calculate it now?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Calculate',
            onPress: () => calculateWesternChart.mutate(),
          },
        ]
      );
    }
  }, [user?.id, chart, isChartLoading]);

  const handleToggleVedic = async () => {
    if (showVedic) {
      setShowVedic(false);
    } else {
      try {
        await calculateVedic.mutateAsync('lahiri');
        setShowVedic(true);
      } catch (err: any) {
        Alert.alert('Error', 'Failed to calculate Vedic chart. Please try again.');
      }
    }
  };

  const handleSelectChart = (type: DivisionalChartType) => {
    selectDivisionalChart(type);
  };

  const isLoading = isChartLoading || calculateWesternChart.isPending;
  const isVedicLoadingState = calculateVedic.isPending;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <CostarBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.white} />
          <CostarText variant="body" style={{ marginTop: spacing.md, color: colors.gray400 }}>
            Loading your natal chart...
          </CostarText>
        </View>
      </SafeAreaView>
    );
  }

  if (chartError || !chart) {
    return (
      <SafeAreaView style={styles.container}>
        <CostarBackground />
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-outline" size={64} color={colors.gray600} />
          <CostarText variant="heading3" style={{ marginTop: spacing.lg, color: colors.gray400 }}>
            No Natal Chart
          </CostarText>
          <CostarText variant="body" style={{ marginTop: spacing.sm, color: colors.gray500, textAlign: 'center' }}>
            Your natal chart hasn't been calculated yet.
          </CostarText>
          <TouchableOpacity
            style={styles.calculateButton}
            onPress={() => calculateWesternChart.mutate()}
          >
            <CostarText style={styles.calculateButtonText}>Calculate Chart</CostarText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Get planet position from array
  const getPlanetPosition = (planetKey: string): PlanetPosition | undefined => {
    if (!Array.isArray(chart.planetaryPositions)) {
      return undefined;
    }
    return chart.planetaryPositions.find(
      (p) => p.planet?.toLowerCase() === planetKey.toLowerCase()
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CostarBackground />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <CostarText variant="heading2" uppercase>
            {showVedic ? 'Vedic Chart' : 'Your Natal Chart'}
          </CostarText>
          <TouchableOpacity style={styles.toggleButton} onPress={handleToggleVedic}>
            <CostarText variant="body" style={styles.toggleButtonText}>
              {showVedic ? 'Show Western' : 'Show Vedic'}
            </CostarText>
            <Ionicons
              name={showVedic ? 'ellipse-outline' : 'analytics-outline'}
              size={20}
              color={colors.white}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>

        {showVedic ? (
          // Vedic Chart View
          <View>
            {isVedicLoadingState && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent} />
                <CostarText variant="body" style={{ marginTop: spacing.sm, color: colors.gray400 }}>
                  Calculating Vedic chart...
                </CostarText>
              </View>
            )}

            <VedicChartSelector
              selectedChart={selectedDivisionalChart}
              onSelectChart={handleSelectChart}
            />

            {selectedDivisionalChart && divisionalCharts[selectedDivisionalChart] ? (
              <VedicChartCard
                key={selectedDivisionalChart}
                chart={divisionalCharts[selectedDivisionalChart]!}
                nakshatra={nakshatra}
              />
            ) : vedicNatalChart?.divisionalCharts?.[0] ? (
              <VedicChartCard
                chart={vedicNatalChart.divisionalCharts[0] as any}
                nakshatra={nakshatra}
              />
            ) : !isVedicLoadingState ? (
              <CostarCard variant="bordered">
                <CostarText>Tap a chart type above to view</CostarText>
              </CostarCard>
            ) : null}

            {nakshatra && (
              <CostarCard variant="bordered" style={styles.card}>
                <CostarText variant="label" style={styles.cardTitle}>
                  Your Nakshatra
                </CostarText>
                <View style={styles.nakshatraInfo}>
                  <View style={styles.nakshatraRow}>
                    <CostarText variant="body" style={styles.nakshatraLabel}>Name:</CostarText>
                    <CostarText variant="body" style={styles.nakshatraValue}>{nakshatra.name}</CostarText>
                  </View>
                  <View style={styles.nakshatraRow}>
                    <CostarText variant="body" style={styles.nakshatraLabel}>Pada:</CostarText>
                    <CostarText variant="body" style={styles.nakshatraValue}>{nakshatra.pada}</CostarText>
                  </View>
                  <View style={styles.nakshatraRow}>
                    <CostarText variant="body" style={styles.nakshatraLabel}>Lord:</CostarText>
                    <CostarText variant="body" style={styles.nakshatraValue}>{nakshatra.lord}</CostarText>
                  </View>
                </View>
              </CostarCard>
            )}
          </View>
        ) : (
          // Western Chart View
          <>
            {/* Big Three Card */}
            <CostarCard variant="bordered" style={styles.card}>
              <CostarText variant="label" style={styles.cardTitle}>
                The Big Three
              </CostarText>
              <View style={styles.bigThree}>
                <View style={styles.bigThreeItem}>
                  <SignIcon sign={chart.sunSign?.toLowerCase() as any} size={32} color={colors.white} />
                  <CostarText variant="caption" color={colors.gray500} style={{ marginTop: spacing.xs }}>
                    Sun
                  </CostarText>
                  <CostarText variant="body" style={{ marginTop: spacing.sm, textTransform: 'capitalize' }}>
                    {chart.sunSign}
                  </CostarText>
                </View>
                <View style={styles.bigThreeItem}>
                  <SignIcon sign={chart.moonSign?.toLowerCase() as any} size={32} color={colors.white} />
                  <CostarText variant="caption" color={colors.gray500} style={{ marginTop: spacing.xs }}>
                    Moon
                  </CostarText>
                  <CostarText variant="body" style={{ marginTop: spacing.sm, textTransform: 'capitalize' }}>
                    {chart.moonSign}
                  </CostarText>
                </View>
                <View style={styles.bigThreeItem}>
                  <SignIcon sign={chart.risingSign?.toLowerCase() as any} size={32} color={colors.white} />
                  <CostarText variant="caption" color={colors.gray500} style={{ marginTop: spacing.xs }}>
                    Rising
                  </CostarText>
                  <CostarText variant="body" style={{ marginTop: spacing.sm, textTransform: 'capitalize' }}>
                    {chart.risingSign}
                  </CostarText>
                </View>
              </View>
            </CostarCard>

            {/* Planetary Positions Card */}
            <CostarCard variant="bordered" style={styles.card}>
              <CostarText variant="label" style={styles.cardTitle}>
                Planetary Positions
              </CostarText>
              {PLANETS.map((planet) => {
                const position = getPlanetPosition(planet.key);
                if (!position) return null;
                return (
                  <View key={planet.key} style={styles.planetRow}>
                    <CostarText variant="body" style={styles.planetName}>
                      {planet.name}
                    </CostarText>
                    <View style={styles.planetSign}>
                      <SignIcon sign={position.sign?.toLowerCase() as any} size={16} color={colors.gray400} />
                      <CostarText variant="bodySmall" style={{ marginLeft: spacing.sm, textTransform: 'capitalize' }}>
                        {position.sign} {position.degree}°
                      </CostarText>
                    </View>
                  </View>
                );
              })}
            </CostarCard>
          </>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  header: {
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray900,
    borderRadius: 20,
  },
  toggleButtonText: {
    color: colors.white,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray800,
  },
  bigThree: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bigThreeItem: {
    alignItems: 'center',
  },
  planetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray800,
  },
  planetName: {
    color: colors.white,
  },
  planetSign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nakshatraInfo: {
    paddingVertical: spacing.sm,
  },
  nakshatraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  nakshatraLabel: {
    color: colors.gray500,
  },
  nakshatraValue: {
    color: colors.white,
    textTransform: 'capitalize',
  },
  bottomSpacing: {
    height: spacing['3xl'],
  },
  calculateButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: 8,
  },
  calculateButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default ChartScreen;
