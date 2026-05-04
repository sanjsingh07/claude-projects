import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
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
import { useAuthStore } from '@store/authStore';
import { colors, spacing } from '@theme/theme';

export const TodayScreen: React.FC = () => {
  const { todayHoroscope, refresh, isLoading } = useHoroscope();
  const user = useAuthStore((s) => s.user);

  const now = DateTime.now();
  const dayName = now.toFormat('cccc').toUpperCase();
  const fullDate = now.toFormat('MMMM d, yyyy');

  // Default data for when horoscope is loading or missing fields
  const moodAspects = todayHoroscope?.moodAspects || {
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

  const primaryTransit = todayHoroscope?.primaryTransit || {
    title: 'Calculating transits...',
    badge: 'minor',
    planets: '...',
    body: 'Please wait while we align with the stars.',
    source: '1 of ? active transits',
  };

  const aspects = todayHoroscope?.aspects || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <CostarBackground />

      {/* Date Header */}
      <View style={styles.header}>
        <View style={styles.dateInfo}>
          <CostarText style={styles.dayText}>TODAY · {dayName}</CostarText>
          <CostarText style={styles.fullDateText}>{fullDate}</CostarText>
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
            tintColor={colors.astraFg}
          />
        }
      >
        {/* Mood Section */}
        <MoodRing
          score={todayHoroscope?.energyScore || 0}
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
    backgroundColor: colors.astraBg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.astraBorder,
  },
  dateInfo: {
    flexDirection: 'column',
  },
  dayText: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.astraMuted,
    marginBottom: 2,
    fontFamily: 'DM Sans',
  },
  fullDateText: {
    fontSize: 22,
    color: colors.astraFg,
    fontWeight: '500',
    fontFamily: 'Instrument Serif',
  },
  notifBadge: {
    width: 34,
    height: 34,
    backgroundColor: colors.astraSurface,
    borderWidth: 1,
    borderColor: colors.astraBorder,
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
