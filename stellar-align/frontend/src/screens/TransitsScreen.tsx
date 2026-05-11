import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '@services/api';
import { useTransitStore } from '@store/transitStore';
import { 
  CostarText, 
  CostarBackground 
} from '@components';
import { colors } from '@theme/theme';
import { TransitForecast } from '@types';

export const TransitsScreen: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const { filters } = useTransitStore();

  const { data, isLoading, refetch, isFetching } = useQuery<TransitForecast>({
    queryKey: ['transits', period],
    queryFn: async () => {
      const response = await api.getTransits(period);
      return response.data as TransitForecast;
    },
  });

  const filteredTransits = (data?.transits || []).filter(item => {
    // 1. Determine Source
    const isPersonal = item.eventKind === 'natal_aspect';
    const isRealTime = ['sky_aspect', 'ingress', 'station_retrograde', 'station_direct'].includes(item.eventKind);
    
    // 2. Source Filtering (Primary)
    if (isPersonal && !filters.showPersonal) return false;
    if (isRealTime && !filters.showRealTime) return false;
    if (!isPersonal && !isRealTime) return false;

    // 3. Zodiac System Filtering
    const zodiacSystem = (item as any).zodiacSystem;
    if (zodiacSystem === 'SIDEREAL' && !filters.showVedic) return false;
    if (zodiacSystem === 'TROPICAL' && !filters.showWestern) return false;

    // 4. Quality Filtering (Secondary Narrowing)
    const anyQualityActive = filters.showMajor || filters.showMinor || filters.showShadow;
    
    // If no quality filters are active, show everything for the active sources
    if (!anyQualityActive) return true;
    
    // If quality filters are active, treat them as a whitelist
    if (item.type === 'major' && filters.showMajor) return true;
    if (item.type === 'minor' && filters.showMinor) return true;
    if (item.type === 'shadow' && filters.showShadow) return true;
    
    return false;
  });

  // Merging Logic: Aspects are universal (distance-based), Ingresses/Stations are location-based
  const mergedTransits: TransitForecastEvent[] = [];
  const seenAspects = new Set<string>();

  filteredTransits.forEach(item => {
    const isAspect = ['sky_aspect', 'natal_aspect'].includes(item.eventKind);
    
    if (isAspect) {
      // Create a system-agnostic key (e.g., "sky-aspect-sun-SEXTILE-jupiter")
      const agnosticKey = item.id.split('-').slice(1).join('-');
      
      if (!seenAspects.has(agnosticKey)) {
        seenAspects.add(agnosticKey);
        // Strip the "(Vedic)" or "(Western)" suffix for merged aspects
        const cleanTitle = item.title.replace(/ \((Vedic|Western)\)$/, '');
        mergedTransits.push({ ...item, title: cleanTitle });
      }
    } else {
      // Ingresses and Stations are kept with their system tags
      mergedTransits.push(item);
    }
  });

  const renderPeriodButton = (p: 'week' | 'month' | 'year', label: string) => (
    <TouchableOpacity
      style={[styles.periodBtn, period === p && styles.periodBtnActive]}
      onPress={() => setPeriod(p)}
      activeOpacity={0.7}
    >
      <CostarText
        style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}
      >
        {label}
      </CostarText>
    </TouchableOpacity>
  );

  const renderDescription = (text: string) => {
    const parts = text.split(/(<em>.*?<\/em>)/g);
    return (
      <CostarText style={styles.tiBody}>
        {parts.map((part, index) => {
          if (part.startsWith('<em>') && part.endsWith('</em>')) {
            return (
              <CostarText key={index} style={styles.tiBodyEm}>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <CostarBackground />

      {/* Header */}
      <View style={styles.header}>
        <CostarText style={styles.headerTitle} serif italic>Transit forecast</CostarText>
        <CostarText style={styles.headerSubtitle}>{data?.range?.label || '...'}</CostarText>
      </View>

      {/* Period Selector */}
      <View style={styles.periodBar}>
        {renderPeriodButton('week', 'Week')}
        {renderPeriodButton('month', 'Month')}
        {renderPeriodButton('year', 'Year')}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.stellarFg}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.stellarViolet} />
          </View>
        ) : mergedTransits.length > 0 ? (
          mergedTransits.map((item, index) => (
            <View key={item.id || index} style={[styles.transitItem, index === mergedTransits.length - 1 && styles.transitItemLast]}>
              <View style={styles.tiLeft}>
                <View style={styles.tiDate}>
                  <CostarText style={styles.tiMonth}>{item.date.month}</CostarText>
                  <CostarText style={styles.tiDay} serif>{item.date.day.toString()}</CostarText>
                  <CostarText style={styles.tiYear}>{item.date.year.toString()}</CostarText>
                </View>
                <CostarText style={styles.tiOrb}>orb: {item.orb.formatted}</CostarText>
              </View>
              <View style={styles.tiRight}>
                <View style={styles.tiHead}>
                  <CostarText style={styles.tiTitle} serif italic>{item.title}</CostarText>
                  <View style={[styles.tiType, styles[`tiType_${item.type}` as keyof typeof styles] as any]}>
                    <CostarText style={[styles.tiTypeText, styles[`tiTypeText_${item.type}` as keyof typeof styles] as any]}>
                      {item.type}
                    </CostarText>
                  </View>
                </View>
                <CostarText style={styles.tiSyms}>
                  {item.symbols}
                  {(item as any).duration?.label && (
                    <CostarText style={styles.tiDuration}> • {(item as any).duration.label}</CostarText>
                  )}
                </CostarText>
                
                {renderDescription(item.description)}
                
                <View style={styles.tiFooter}>
                  <CostarText style={styles.tiImpact}>{item.impact.label}</CostarText>
                  <View style={styles.tiProgress}>
                    <View style={styles.progBar}>
                      <View style={[styles.progFill, { 
                        width: item.progress.percentage !== null ? `${item.progress.percentage}%` : '0%',
                        backgroundColor: item.type === 'major' ? colors.stellarPink : item.type === 'minor' ? colors.stellarViolet : colors.stellarAmber
                      }]} />
                    </View>
                    <CostarText style={styles.progPct} numberOfLines={1}>
                      {typeof item.progress.percentage === 'number' ? `${item.progress.percentage}%` : item.progress.label}
                    </CostarText>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <CostarText style={styles.emptyText}>No transits match your filters.</CostarText>
          </View>
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stellarBg,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder,
  },
  headerTitle: {
    fontSize: 28,
    color: colors.stellarFg,
    fontFamily: 'Instrument Serif',
    fontStyle: 'italic',
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.stellarMuted,
    fontFamily: 'DM Sans',
    marginTop: 3,
  },
  periodBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder,
  },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    backgroundColor: 'transparent',
    marginRight: 8,
  },
  periodBtnActive: {
    backgroundColor: colors.stellarViolet,
    borderColor: colors.stellarViolet,
  },
  periodBtnText: {
    fontSize: 11,
    color: colors.stellarMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'DM Sans',
  },
  periodBtnTextActive: {
    color: colors.stellarFg,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  loadingContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  transitItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder,
    gap: 14,
  },
  transitItemLast: {
    borderBottomWidth: 0,
  },
  tiLeft: {
    width: 60,
    alignItems: 'center',
    gap: 6,
  },
  tiDate: {
    alignItems: 'center',
    gap: 1,
  },
  tiMonth: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.stellarMuted,
    fontFamily: 'DM Sans',
  },
  tiDay: {
    fontSize: 22,
    color: colors.stellarFg,
    fontFamily: 'Instrument Serif',
    lineHeight: 22,
  },
  tiYear: {
    fontSize: 9,
    color: colors.stellarMuted,
    fontFamily: 'DM Sans',
  },
  tiOrb: {
    fontSize: 9,
    color: colors.stellarMuted,
    fontFamily: 'DM Sans',
    textAlign: 'center',
    marginTop: 2,
  },
  tiRight: {
    flex: 1,
    gap: 6,
  },
  tiHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  tiTitle: {
    fontSize: 18,
    fontStyle: 'italic',
    color: colors.stellarFg,
    fontFamily: 'Instrument Serif',
    lineHeight: 20,
    flex: 1,
  },
  tiType: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    marginLeft: 6,
  },
  tiTypeText: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: 'DM Sans',
    color: colors.stellarMuted,
  },
  tiType_major: { borderColor: colors.stellarPink },
  tiTypeText_major: { color: colors.stellarPink },
  tiType_minor: { borderColor: colors.stellarViolet },
  tiTypeText_minor: { color: colors.stellarViolet },
  tiType_shadow: { borderColor: colors.stellarAmber },
  tiTypeText_shadow: { color: colors.stellarAmber },
  tiSyms: {
    fontSize: 11,
    color: colors.stellarMuted,
    fontFamily: 'DM Sans',
  },
  tiDuration: {
    color: colors.stellarPink,
    fontWeight: '600',
  },
  tiBody: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.stellarFg,
    fontFamily: 'DM Sans',
  },
  tiBodyEm: {
    fontStyle: 'italic',
    color: colors.stellarPink,
    fontFamily: 'DM Sans',
  },
  tiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  tiImpact: {
    fontSize: 10,
    color: colors.stellarMuted,
    fontFamily: 'DM Sans',
  },
  tiProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progBar: {
    width: 60,
    height: 3,
    backgroundColor: colors.stellarBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progFill: {
    height: '100%',
    backgroundColor: colors.stellarViolet,
    borderRadius: 2,
  },
  progPct: {
    fontSize: 9,
    color: colors.stellarMuted,
    fontFamily: 'DM Sans',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.stellarMuted,
    fontFamily: 'DM Sans',
  },
  bottomSpacing: {
    height: 60,
  },
});

export default TransitsScreen;
