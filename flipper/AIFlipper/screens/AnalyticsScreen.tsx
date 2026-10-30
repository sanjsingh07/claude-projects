import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';
import { api } from '../services/ApiClient';
import { useIsFocused } from '@react-navigation/native';
import { percentWidth, formatCompactCurrency, formatPercent } from '../utils/format';

interface AnalyticsData {
  hero: {
    totalProfit: number;
    trendPercentage: number;
    sparkline: number[];
  };
  secondary: {
    grossInventoryValue: number;
    avgRoi: number;
    sellThroughRate: number;
  };
  profitByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  topSourcing: Array<{
    rank: string;
    location: string;
    activePickups: number;
    amount: string;
  }>;
  highMarginFlips: Array<{
    name: string;
    imageUrl: string;
    margin: string;
    trend: string;
  }>;
}

const AnalyticsScreen = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchAnalytics();
    }
  }, [isFocused]);

  const fetchAnalytics = async () => {
    try {
      setLoadState('loading');
      const json = await api.get<AnalyticsData>('/analytics');
      setData(json);
      setLoadState('ready');
    } catch (error) {
      // A failed load used to leave this screen spinning forever, identical to a
      // slow network — the user could never tell the backend was unreachable.
      console.warn('Failed to load analytics from backend:', error);
      setLoadState('error');
    }
  };

  if (loadState === 'loading') {
    return (
      <View style={[styles.container, styles.centerFill]}>
        <ActivityIndicator color={Colors.primaryContainer} size="large" />
      </View>
    );
  }

  if (loadState === 'error' || !data) {
    return (
      <View style={[styles.container, styles.centerFill, { paddingHorizontal: Spacing.lg }]}>
        <Text style={[Typography.headlineMd, { color: Colors.error }]}>CAN'T REACH SERVER</Text>
        <Text style={[Typography.bodyMd, { color: Colors.outline, marginTop: 8, textAlign: 'center' }]}>
          Analytics couldn't be loaded. This is a connection problem, not a lack of data.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAnalytics}>
          <Text style={[Typography.labelBold, { color: Colors.onPrimary }]}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Distinguish "connected, but nothing sold yet" from "can't reach server". A
  // new account has no realized profit, no sold_at history, no category or
  // sourcing data — every derived series is empty. That is the honest state, and
  // showing it plainly is what makes the numbers trustworthy once they appear,
  // rather than the old dashboard that seeded $12,842 on day one.
  const hasSales = (data.hero?.totalProfit ?? 0) !== 0 || (data.hero?.sparkline?.length ?? 0) > 0;
  const hasAnyData =
    hasSales ||
    (data.secondary?.grossInventoryValue ?? 0) > 0 ||
    (data.profitByCategory?.length ?? 0) > 0;

  return (
    <View style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.menuIcon, { color: Colors.primaryContainer }]}>☰</Text>
          <Text style={[styles.logoText, Typography.headlineMd, { color: Colors.primaryContainer }]}>AI FLIPPER</Text>
        </View>
        <View style={styles.profilePicContainer}>
          <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0427Gci3ZN7Tl0XZznvqYYgAcbBcwYt4j3gGjdAH2qZQBqhn0Wmv2imZ2E6v1oCaZKbp0s0JHCI629KQj2WdeETsMSIhIsvc538w0CTGVOn1vS4kGCRprkmKFerDUisbapCBkoGSDRSz5JnyKGM3ayMmW4qP1NnjY_jVFRWcYUPPbsO3Cs_BPGuP_n386ADw3kBA9G6JOzBTs-XikPFSRFq-64HiPR04yenbXSaVt8o4_bHxQsmdsZyEReTHbVrwjSpfOOZ3u_8GQ' }} style={styles.profilePic} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Hero KPI */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLabel}>TOTAL PROFIT</Text>
              <Text style={[Typography.displayProfit, { color: Colors.primaryContainer }]}>${(Number.isFinite(data.hero?.totalProfit) ? data.hero.totalProfit : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            {hasSales && (data.hero?.trendPercentage ?? 0) !== 0 && (
              <View style={[styles.heroBadge, (data.hero?.trendPercentage ?? 0) < 0 && styles.heroBadgeDown]}>
                <Text style={[styles.heroBadgeText, (data.hero?.trendPercentage ?? 0) < 0 && { color: Colors.error }]}>
                  {(data.hero?.trendPercentage ?? 0) > 0 ? '+' : ''}{formatPercent(data.hero?.trendPercentage, '0.0%')}
                </Text>
              </View>
            )}
          </View>

          {(data.hero?.sparkline?.length ?? 0) > 0 ? (
            <View style={styles.sparklineContainer}>
               {(data.hero?.sparkline ?? []).map((val, idx, arr) => {
                 // Bar height is a percentage of the chart max; an out-of-range or
                 // non-finite value used to produce "NaN%", which RN rejects as a
                 // style value and logs as a hard error.
                 let bgStyle = 'rgba(0,230,118,0.2)';
                 if (idx === arr.length - 3) bgStyle = 'rgba(0,230,118,0.4)';
                 if (idx === arr.length - 2) bgStyle = 'rgba(0,230,118,0.6)';
                 if (idx === arr.length - 1) bgStyle = Colors.primaryContainer;
                 return (
                   <View key={idx} style={[styles.sparkBar, { height: percentWidth(val), backgroundColor: bgStyle }]} />
                 );
               })}
            </View>
          ) : (
            <View style={[styles.sparklineContainer, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={[Typography.bodyMd, { color: Colors.onSurfaceVariant }]}>No sales history yet</Text>
            </View>
          )}
        </View>

        {/* Secondary Stats */}
        <View style={styles.bentoGrid}>
          <View style={styles.bentoCardSmall}>
            <Text style={styles.bentoIcon}>📦</Text>
            <View>
              <Text style={styles.bentoLabel}>GROSS INV VALUE</Text>
              <Text style={[Typography.headlineMd, { color: Colors.onSurface }]}>{formatCompactCurrency(data.secondary?.grossInventoryValue)}</Text>
            </View>
          </View>
          <View style={styles.bentoCardSmall}>
            <Text style={styles.bentoIcon}>⚡</Text>
            <View>
              <Text style={styles.bentoLabel}>AVG ROI (%)</Text>
              <Text style={[Typography.headlineMd, { color: Colors.onSurface }]}>{formatPercent(data.secondary?.avgRoi, '0.0%')}</Text>
            </View>
          </View>
          <View style={styles.bentoCardLarge}>
            <Text style={styles.bentoIcon}>🛒</Text>
            <View>
              <Text style={styles.bentoLabel}>SELL-THROUGH RATE</Text>
              <Text style={[Typography.headlineMd, { color: Colors.onSurface }]}>{formatPercent(data.secondary?.sellThroughRate, '0.0%')}</Text>
            </View>
          </View>
        </View>

        {/* Charts Section */}
        <View style={styles.chartsGrid}>
          <View style={[styles.chartCard, { shadowColor: Colors.secondary }]}>
            <Text style={[Typography.headlineMd, { color: Colors.onSurface, marginBottom: Spacing.lg }]}>Profit by Category</Text>

            {(data.profitByCategory?.length ?? 0) > 0 ? (
              (data.profitByCategory ?? []).map((cat, idx) => (
                <View key={idx} style={styles.barChartRow}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barLabelText}>{cat.category}</Text>
                    <Text style={styles.barLabelText}>${(Number.isFinite(cat.amount) ? cat.amount : 0).toLocaleString()}</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: percentWidth(cat.percentage) }]} />
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptySectionText}>Sell items to see where your profit comes from.</Text>
            )}
          </View>

          {/* Top Sourcing Heatmap (List version) */}
          <View style={styles.chartCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
               <Text style={[Typography.headlineMd, { color: Colors.onSurface }]}>Top Sourcing</Text>
               <Text style={{ fontSize: 20, color: Colors.onSurfaceVariant }}>📍</Text>
            </View>
            <View style={{ gap: Spacing.md }}>
               {(data.topSourcing?.length ?? 0) > 0 ? (
                 (data.topSourcing ?? []).map((src, idx) => (
                   <View key={idx} style={styles.sourcingRow}>
                     <View style={styles.sourcingRank}><Text style={styles.sourcingRankText}>{src.rank}</Text></View>
                     <View style={{ flex: 1 }}>
                       <Text style={[Typography.labelBold, { color: Colors.onSurface }]}>{src.location}</Text>
                       <Text style={{ fontSize: 12, color: Colors.onSurfaceVariant }}>{src.activePickups} Sold</Text>
                     </View>
                     <Text style={[Typography.dataMono, { color: Colors.primaryContainer }]}>{src.amount}</Text>
                   </View>
                 ))
               ) : (
                 <Text style={styles.emptySectionText}>Log a source location when you sell to rank your best spots.</Text>
               )}
            </View>
          </View>

          {/* High-Margin Flips */}
          <View style={[styles.chartCard, { marginBottom: 30 }]}>
            <Text style={[Typography.headlineMd, { color: Colors.onSurface, marginBottom: Spacing.lg }]}>High-Margin Flips</Text>
            
            {(data.highMarginFlips?.length ?? 0) > 0 ? (
              <>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>PRODUCT</Text>
                  <Text style={styles.tableHeaderText}>MARGIN</Text>
                  <Text style={styles.tableHeaderText}>TREND</Text>
                </View>

                {(data.highMarginFlips ?? []).map((flip, idx, arr) => (
                  <View key={idx} style={[styles.tableRow, idx === arr.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                    <View style={styles.tableCellProd}>
                      {flip.imageUrl ? (
                        <Image source={{ uri: flip.imageUrl }} style={styles.tableImg} />
                      ) : (
                        <View style={[styles.tableImg, { backgroundColor: '#222' }]} />
                      )}
                      <Text style={[Typography.bodyMd, { color: Colors.onSurface }]} numberOfLines={1}>{flip.name}</Text>
                    </View>
                    <Text style={[Typography.dataMono, styles.tableCellMargin]}>{flip.margin}</Text>
                    <Text style={styles.tableCellTrend}>{flip.trend}</Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.emptySectionText}>Your best-margin sales will show up here once you mark items sold.</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerFill: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryContainer,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMargin,
    height: 100,
    paddingTop: 40,
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassStroke,
    zIndex: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    fontSize: 24,
  },
  logoText: {
    letterSpacing: 2,
  },
  profilePicContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  profilePic: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    padding: Spacing.containerMargin,
    paddingTop: 100 + Spacing.md,
    paddingBottom: 100,
    gap: Spacing.lg,
  },
  heroCard: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  heroLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroBadge: {
    backgroundColor: 'rgba(0,230,118,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  heroBadgeDown: {
    backgroundColor: 'rgba(147, 0, 10, 0.15)',
  },
  heroBadgeText: {
    color: Colors.primaryContainer,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  emptySectionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.onSurfaceVariant,
  },
  sparklineContainer: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  sparkBar: {
    flex: 1,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  bentoCardSmall: {
    width: '47%',
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    justifyContent: 'space-between',
    aspectRatio: 1.2,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
  },
  bentoCardLarge: {
    width: '100%',
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bentoIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  bentoLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  chartsGrid: {
    gap: Spacing.lg,
  },
  chartCard: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  barChartRow: {
    marginBottom: Spacing.md,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  barLabelText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  barTrack: {
    height: 12,
    backgroundColor: Colors.white05,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.secondaryContainer,
    borderRadius: BorderRadius.full,
  },
  sourcingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sourcingRank: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourcingRankText: {
    color: Colors.primaryContainer,
    fontWeight: 'bold',
    fontSize: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tableHeaderText: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tableCellProd: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tableImg: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.default,
    backgroundColor: Colors.white05,
  },
  tableCellMargin: {
    flex: 1,
    color: Colors.primaryContainer,
  },
  tableCellTrend: {
    flex: 1,
    color: Colors.primaryContainer,
    fontSize: 18,
  },
});

export default AnalyticsScreen;
