import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, borderRadius, theme } from '@theme/theme';

interface CostarCardProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'bordered' | 'filled';
}

export const CostarCard: React.FC<CostarCardProps> = ({
  children,
  title,
  icon,
  style,
  variant = 'default',
}) => {
  return (
    <View style={[styles.card, variant === 'bordered' && styles.cardBordered, style]}>
      {(title || icon) && (
        <View style={styles.cardHeader}>
          {icon && <View style={styles.cardIcon}>{icon}</View>}
          {title && <Text style={styles.cardTitle}>{title}</Text>}
        </View>
      )}
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
};

interface CostarTextProps {
  children: React.ReactNode;
  variant?:
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'heading4'
    | 'body'
    | 'bodySmall'
    | 'caption'
    | 'label'
    | 'large';
  style?: TextStyle;
  color?: string;
  uppercase?: boolean;
  align?: 'auto' | 'left' | 'center' | 'right' | 'justify';
}

export const CostarText: React.FC<CostarTextProps> = ({
  children,
  variant = 'body',
  style,
  color,
  uppercase = false,
  align = 'left',
}) => {
  const getTextStyle = () => {
    switch (variant) {
      case 'heading1':
        return styles.heading1;
      case 'heading2':
        return styles.heading2;
      case 'heading3':
        return styles.heading3;
      case 'heading4':
        return styles.heading4;
      case 'body':
        return styles.body;
      case 'bodySmall':
        return styles.bodySmall;
      case 'caption':
        return styles.caption;
      case 'label':
        return styles.label;
      case 'large':
        return styles.large;
      default:
        return styles.body;
    }
  };

  return (
    <Text
      style={[
        getTextStyle(),
        { color: color || theme.textPrimary, textAlign: align },
        uppercase && styles.uppercase,
        style,
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  // Card styles
  card: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.borderPrimary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  cardBordered: {
    borderColor: colors.white,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardIcon: {
    marginRight: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.lg,
    fontWeight: '700' as const,
    color: theme.textPrimary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  cardContent: {
    flex: 1,
  },

  // Text variants - Co-Star style: bold, uppercase, high contrast
  heading1: {
    fontSize: typography['4xl'],
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.white,
  },
  heading2: {
    fontSize: typography['3xl'],
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: colors.white,
  },
  heading3: {
    fontSize: typography['2xl'],
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.white,
  },
  heading4: {
    fontSize: typography.xl,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.white,
  },
  large: {
    fontSize: typography.lg,
    fontWeight: '500' as const,
    color: theme.textPrimary,
  },
  body: {
    fontSize: typography.md,
    fontWeight: '400' as const,
    color: theme.textPrimary,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: typography.sm,
    fontWeight: '400' as const,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: typography.xs,
    fontWeight: '500' as const,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: '600' as const,
    color: theme.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});

export default CostarCard;
