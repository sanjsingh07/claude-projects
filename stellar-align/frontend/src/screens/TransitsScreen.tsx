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
import { 
  CostarText, 
  CostarBackground 
} from '@components';
import { colors } from '@theme/theme';
import { TransitForecast } from '@types';

export const TransitsScreen: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  const { data, isLoading, refetch, isFetching } = useQuery<TransitForecast>({
    queryKey: ['transits', period],
    queryFn: async () => {
      const response = await api.getTransits(period);
      return response.data as TransitForecast;
    },
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
            tintColor={colors.astraFg}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.astraViolet} />
          </View>
        ) : data?.transits && data.transits.length > 0 ? (
          data.transits.map((item, index) => (
            <View key={item.id || index} style={[styles.transitItem, index === data.transits.length - 1 && styles.transitItemLast]}>
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
                <CostarText style={styles.tiSyms}>{item.symbols}</CostarText>
                
                {renderDescription(item.description)}
                
                <View style={styles.tiFooter}>
                  <CostarText style={styles.tiImpact}>{item.impact.label}</CostarText>
                  <View style={styles.tiProgress}>
                    <View style={styles.progBar}>
                      <View style={[styles.progFill, { 
                        width: item.progress.percentage !== null ? `${item.progress.percentage}%` : '0%',
                        backgroundColor: item.type === 'major' ? colors.astraPink : item.type === 'minor' ? colors.astraViolet : colors.astraAmber
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
            <CostarText style={styles.emptyText}>No major transits this period.</CostarText>
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
    backgroundColor: colors.astraBg,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.astraBorder,
  },
  headerTitle: {
    fontSize: 28,
    color: colors.astraFg,
    fontFamily: 'Instrument Serif',
    fontStyle: 'italic',
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.astraMuted,
    fontFamily: 'DM Sans',
    marginTop: 3,
  },
  periodBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.astraBorder,
  },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.astraBorder,
    backgroundColor: 'transparent',
    marginRight: 8,
  },
  periodBtnActive: {
    backgroundColor: colors.astraViolet,
    borderColor: colors.astraViolet,
  },
  periodBtnText: {
    fontSize: 11,
    color: colors.astraMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'DM Sans',
  },
  periodBtnTextActive: {
    color: colors.astraFg,
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
    borderBottomColor: colors.astraBorder,
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
    color: colors.astraMuted,
    fontFamily: 'DM Sans',
  },
  tiDay: {
    fontSize: 22,
    color: colors.astraFg,
    fontFamily: 'Instrument Serif',
    lineHeight: 22,
  },
  tiYear: {
    fontSize: 9,
    color: colors.astraMuted,
    fontFamily: 'DM Sans',
  },
  tiOrb: {
    fontSize: 9,
    color: colors.astraMuted,
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
    color: colors.astraFg,
    fontFamily: 'Instrument Serif',
    lineHeight: 20,
    flex: 1,
  },
  tiType: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.astraBorder,
    marginLeft: 6,
  },
  tiTypeText: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: 'DM Sans',
    color: colors.astraMuted,
  },
  tiType_major: { borderColor: colors.astraPink },
  tiTypeText_major: { color: colors.astraPink },
  tiType_minor: { borderColor: colors.astraViolet },
  tiTypeText_minor: { color: colors.astraViolet },
  tiType_shadow: { borderColor: colors.astraAmber },
  tiTypeText_shadow: { color: colors.astraAmber },
  tiSyms: {
    fontSize: 11,
    color: colors.astraMuted,
    fontFamily: 'DM Sans',
  },
  tiBody: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.astraFg,
    fontFamily: 'DM Sans',
  },
  tiBodyEm: {
    fontStyle: 'italic',
    color: colors.astraPink,
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
    color: colors.astraMuted,
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
    backgroundColor: colors.astraBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progFill: {
    height: '100%',
    backgroundColor: colors.astraViolet,
    borderRadius: 2,
  },
  progPct: {
    fontSize: 9,
    color: colors.astraMuted,
    fontFamily: 'DM Sans',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.astraMuted,
    fontFamily: 'DM Sans',
  },
  bottomSpacing: {
    height: 60,
  },
});

export default TransitsScreen;
