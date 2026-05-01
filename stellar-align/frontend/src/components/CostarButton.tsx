import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '@theme/theme';

interface CostarButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  uppercase?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const CostarButton: React.FC<CostarButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  uppercase = true,
  style,
  fullWidth = false,
}) => {
  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button];

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.buttonPrimary);
        break;
      case 'secondary':
        baseStyle.push(styles.buttonSecondary);
        break;
      case 'outline':
        baseStyle.push(styles.buttonOutline);
        break;
      case 'ghost':
        baseStyle.push(styles.buttonGhost);
        break;
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.buttonSmall);
        break;
      case 'medium':
        baseStyle.push(styles.buttonMedium);
        break;
      case 'large':
        baseStyle.push(styles.buttonLarge);
        break;
    }

    if (fullWidth) {
      baseStyle.push(styles.buttonFullWidth);
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const textStyle: TextStyle[] = [styles.buttonText];

    switch (variant) {
      case 'primary':
        textStyle.push(styles.buttonTextPrimary);
        break;
      case 'secondary':
        textStyle.push(styles.buttonTextSecondary);
        break;
      case 'outline':
        textStyle.push(styles.buttonTextOutline);
        break;
      case 'ghost':
        textStyle.push(styles.buttonTextGhost);
        break;
    }

    switch (size) {
      case 'small':
        textStyle.push(styles.buttonTextSmall);
        break;
      case 'medium':
        textStyle.push(styles.buttonTextMedium);
        break;
      case 'large':
        textStyle.push(styles.buttonTextLarge);
        break;
    }

    return textStyle;
  };

  return (
    <TouchableOpacity
      style={[
        ...getButtonStyle(),
        disabled && styles.buttonDisabled,
        loading && styles.buttonLoading,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' ? colors.black : colors.white
          }
          size="small"
        />
      ) : (
        <Text
          style={[
            ...getTextStyle(),
            disabled && styles.buttonTextDisabled,
            uppercase && styles.uppercase,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    alignSelf: 'flex-start',
  },
  buttonPrimary: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  buttonSecondary: {
    backgroundColor: colors.gray800,
    borderColor: colors.gray700,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderColor: colors.white,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  buttonSmall: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonMedium: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  buttonLarge: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
  },
  buttonFullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonText: {
    fontWeight: '600' as const,
    letterSpacing: 1,
  },
  buttonTextPrimary: {
    color: colors.black,
  },
  buttonTextSecondary: {
    color: colors.white,
  },
  buttonTextOutline: {
    color: colors.white,
  },
  buttonTextGhost: {
    color: colors.white,
  },
  buttonTextSmall: {
    fontSize: typography.sm,
  },
  buttonTextMedium: {
    fontSize: typography.md,
  },
  buttonTextLarge: {
    fontSize: typography.lg,
  },
  buttonTextDisabled: {
    opacity: 0.5,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});

export default CostarButton;
