import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CostarCard, CostarText } from '@components/CostarCard';
import { CostarBackground } from '@components/CostarBackground';
import { MoonPhase } from '@components/MoonPhase';
import { TransitIndicator } from '@components/TransitIndicator';
import { SignIcon } from '@components/SignIcon';
import { useHoroscope } from '@hooks/useHoroscope';
import { useAuthStore } from '@store/authStore';
import { colors, spacing } from '@theme/theme';

type MainTabParamList = {
  Today: undefined;
  Chart: undefined;
  Friends: undefined;
  Profile: undefined;
};

const categories = [
  { id: 'self', title: 'Self', icon: 'sparkles' as const },
  { id: 'work', title: 'Work', icon: 'briefcase' as const },
  { id: 'love', title: 'Love', icon: 'heart' as const },
  { id: 'social', title: 'Social', icon: 'chatbubbles' as const },
];

export const TodayScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainTabParamList>>();
  const { todayHoroscope, categories: horoscopeCategories, refresh, isLoading } = useHoroscope();
  const user = useAuthStore((s) => s.user);
  const [activeCategory, setActiveCategory] = useState('self');

  const getContentForCategory = (catId: string): string => {
    if (!todayHoroscope) return '';
    switch (catId) {
      case 'self':
        return todayHoroscope.contentSelf;
      case 'work':
        return todayHoroscope.contentWork;
      case 'love':
        return todayHoroscope.contentLove;
      case 'social':
        return todayHoroscope.contentSocial;
      default:
        return '';
    }
  };

  const activeHoroscope = horoscopeCategories.find((c) => c.id === activeCategory);

  return (
    <SafeAreaView style={styles.container}>
      <CostarBackground />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <CostarText variant="caption" color={colors.gray500}>
              {getGreeting()}
            </CostarText>
            <CostarText variant="heading2" uppercase>
              {user?.displayName || 'Stargazer'}
            </CostarText>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile' as any)}
          >
            <View style={styles.avatar}>
              <CostarText variant="label">
                {(user?.displayName || 'S').charAt(0).toUpperCase()}
              </CostarText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Moon Section */}
        <View style={styles.moonSection}>
          <MoonPhase
            phase={todayHoroscope?.moonPhase || 'new'}
            size={50}
            showLabel={false}
          />
          <View style={styles.moonInfo}>
            <CostarText variant="caption" color={colors.gray400}>
              Moon in
            </CostarText>
            <View style={styles.moonSignRow}>
              <SignIcon
                sign={todayHoroscope?.moonSign || 'aries'}
                size={20}
                color={colors.white}
              />
              <CostarText variant="label" style={styles.moonSignText}>
                {capitalize(todayHoroscope?.moonSign || '')}
              </CostarText>
            </View>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={colors.white}
          />
        }
      >
        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.tab,
                activeCategory === cat.id && styles.tabActive,
              ]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon}
                size={18}
                color={activeCategory === cat.id ? colors.black : colors.gray400}
              />
              <CostarText
                variant="label"
                style={activeCategory === cat.id ? { ...styles.tabText, ...styles.tabTextActive } : styles.tabText}
              >
                {cat.title}
              </CostarText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Horoscope Card */}
        <CostarCard
          variant="bordered"
          style={styles.horoscopeCard}
        >
          <View style={styles.cardHeader}>
            <Ionicons
              name={categories.find((c) => c.id === activeCategory)?.icon || 'sparkles'}
              size={20}
              color={colors.white}
            />
            <CostarText variant="label" style={styles.cardTitle}>
              {categories.find((c) => c.id === activeCategory)?.title}
            </CostarText>
          </View>
          <CostarText variant="body" style={styles.horoscopeText}>
            {getContentForCategory(activeCategory) || 'Your horoscope is loading...'}
          </CostarText>
        </CostarCard>

        {/* Transits */}
        {todayHoroscope?.activeTransits && todayHoroscope.activeTransits.length > 0 && (
          <TransitIndicator
            count={todayHoroscope.activeTransits.length}
            highlightedPlanets={todayHoroscope.activeTransits
              .slice(0, 3)
              .map((t) => t.transitPlanet)}
          />
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileButton: {
    width: 40,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.black,
  },
  moonSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray800,
  },
  moonInfo: {
    marginLeft: spacing.md,
  },
  moonSignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  moonSignText: {
    marginLeft: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  tabsContainer: {
    marginBottom: spacing.lg,
  },
  tabsContent: {
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: 'transparent',
    borderRadius: 20,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray800,
  },
  tabActive: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  tabText: {
    marginLeft: 6,
    color: colors.gray400,
  },
  tabTextActive: {
    color: colors.black,
  },
  horoscopeCard: {
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    marginLeft: spacing.sm,
  },
  horoscopeText: {
    color: colors.gray200,
  },
  bottomSpacing: {
    height: spacing['3xl'],
  },
});

export default TodayScreen;
