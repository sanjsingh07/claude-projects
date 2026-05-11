import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTime } from 'luxon';

import { 
  CostarText, 
  MoodRing, 
  TransitCard, 
  AspectList,
  CostarBackground
} from '@components';
import { useHoroscope } from '@hooks/useHoroscope';
import { colors } from '@theme/theme';
import { DailyHoroscope } from '@types';

export const TodayScreen: React.FC = () => {
  const { todayHoroscope, refresh, isLoading } = useHoroscope();
  const horoscope = todayHoroscope as DailyHoroscope | null;

  const headerDate = horoscope?.forDate
    ? DateTime.fromISO(horoscope.forDate)
    : DateTime.now();
  const dayName = headerDate.toFormat('cccc').toUpperCase();
  const fullDate = headerDate.toFormat('MMMM d, yyyy');

  if (isLoading && !horoscope) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" />
        <CostarBackground />
        <View style={styles.header}>
          <View style={styles.dateInfo}>
            <CostarText style={styles.dayText}>TODAY · {dayName}</CostarText>
            <CostarText style={styles.fullDateText} serif>{fullDate}</CostarText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.stellarViolet} />
        </View>
      </SafeAreaView>
    );
  }

  // Default data for when horoscope is loading or missing fields
  const moodAspects = horoscope?.moodAspects || {
    emotion: '...',
    career: '...',
    love: '...',
    health: '...',
  };

  const moodAspectsList = [
    { key: 'Emotion', val: moodAspects.emotion, highlight: moodAspects.emotion === 'intense' || moodAspects.emotion === 'rising' },
    { key: 'Career', val: moodAspects.career, highlight: moodAspects.career === 'intense' || moodAspects.career === 'rising' },
    { key: 'Love', val: moodAspects.love, highlight: moodAspects.love === 'intense' || moodAspects.love === 'rising' },
    { key: 'Health', val: moodAspects.health, highlight: moodAspects.health === 'intense' || moodAspects.health === 'rising' },
  ];

  const primaryTransit = horoscope?.primaryTransit || {
    title: 'Calculating transits...',
    badge: 'minor' as const,
    planets: '...',
    body: 'Please wait while we align with the stars.',
    source: '1 of ? active transits',
  };

  const aspects = horoscope?.aspects || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <CostarBackground />

      {/* Date Header */}
      <View style={styles.header}>
        <View style={styles.dateInfo}>
          <CostarText style={styles.dayText}>TODAY · {dayName}</CostarText>
          <CostarText style={styles.fullDateText} serif>{fullDate}</CostarText>
        </View>
        <TouchableOpacity style={styles.notifBadge}>
          <CostarText style={styles.notifIcon}>🔔</CostarText>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={colors.stellarFg}
          />
        }
      >
        {/* Mood Section */}
        <MoodRing
          score={horoscope?.energyScore || 0}
          label="Your day at a glance"
          aspects={moodAspectsList}
        />

        {/* Primary Transit Card */}
        <TransitCard
          title={primaryTransit.title}
          badge={primaryTransit.badge}
          planets={primaryTransit.planets}
          body={primaryTransit.body}
          source={primaryTransit.source}
        />

        {/* Aspects List */}
        {aspects.length > 0 && (
          <AspectList
            label="Today's aspects"
            aspects={aspects}
          />
        )}
        
        {/* Bottom Spacing */}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder,
  },
  dateInfo: {
    flexDirection: 'column',
  },
  dayText: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.stellarMuted,
    marginBottom: 2,
    fontFamily: 'DM Sans',
  },
  fullDateText: {
    fontSize: 18,
    color: colors.stellarFg,
    fontFamily: 'Instrument Serif',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    width: 34,
    height: 34,
    backgroundColor: colors.stellarSurface,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIcon: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 34,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default TodayScreen;
