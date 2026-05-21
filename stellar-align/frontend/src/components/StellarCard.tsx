import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { colors, typography, spacing, borderRadius, theme } from '@theme/theme';

interface StellarCardProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'bordered' | 'filled';
}

export const StellarCard: React.FC<StellarCardProps> = ({
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

interface StellarTextProps {
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
  style?: StyleProp<TextStyle>;
  color?: string;
  uppercase?: boolean;
  serif?: boolean;
  italic?: boolean;
  align?: 'auto' | 'left' | 'center' | 'right' | 'justify';
  numberOfLines?: number;
  onPress?: () => void;
}

export const StellarText: React.FC<StellarTextProps> = ({
  children,
  variant = 'body',
  style,
  color,
  uppercase = false,
  serif = false,
  italic = false,
  align = 'left',
  numberOfLines,
  onPress,
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
        serif && styles.serif,
        italic && styles.italic,
        style,
      ]}
      numberOfLines={numberOfLines}
      onPress={onPress}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  // ... (existing card styles)
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

  // Text variants - Stellar style: bold, uppercase, high contrast
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
    fontFamily: 'DM Sans',
  },
  bodySmall: {
    fontSize: typography.sm,
    fontWeight: '400' as const,
    color: theme.textSecondary,
    lineHeight: 20,
    fontFamily: 'DM Sans',
  },
  caption: {
    fontSize: typography.xs,
    fontWeight: '500' as const,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'DM Sans',
  },
  label: {
    fontSize: typography.sm,
    fontWeight: '600' as const,
    color: theme.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'DM Sans',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  serif: {
    fontFamily: 'Instrument Serif',
  },
  italic: {
    fontStyle: 'italic',
  },
});

export default StellarCard;
