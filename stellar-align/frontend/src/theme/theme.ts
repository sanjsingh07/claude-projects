// Stellar Align inspired theme - minimalist, bold, high contrast
export const colors = {
  // Core colors
  black: '#000000',
  white: '#FFFFFF',

  // Grays for subtle variations
  gray100: '#F8F9FA',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#6C757D',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',

  // Accent colors (used sparingly in Stellar style)
  accent: '#FFFFFF',

  // Status colors
  error: '#FF4444',
  success: '#00C851',
  warning: '#FFBB33',

  // Stellar Align design colors (mapped from oklch)
  stellarBg: '#0a0b14',
  stellarSurface: '#0e101b',
  stellarFg: '#f8f8f8',
  stellarMuted: '#9697a0',
  stellarBorder: '#1e202e',
  stellarViolet: '#9d8df1',
  stellarPink: '#ff8da1',
  stellarAmber: '#ffc15e',

  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(255, 255, 255, 0.1)',
  overlayMedium: 'rgba(255, 255, 255, 0.15)',
  overlayDark: 'rgba(0, 0, 0, 0.5)',
};

export const typography = {
  // Font sizes - Stellar uses large, bold text
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,

  // Font weights
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,

  // Background colors
  background: colors.black,
  backgroundSecondary: colors.gray900,
  card: colors.gray900,
  cardElevated: colors.gray800,

  // Text colors
  textPrimary: colors.white,
  textSecondary: colors.gray400,
  textMuted: colors.gray600,

  // Border colors
  borderPrimary: colors.gray800,
  borderSecondary: colors.gray700,
};

export type Theme = typeof theme;
export default theme;
