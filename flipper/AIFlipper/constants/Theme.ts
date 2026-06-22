export const Colors = {
  // Base
  background: '#0d150e',
  surface: '#0d150e',
  surfaceDim: '#0d150e',
  surfaceBright: '#323c33',
  
  // Containers
  surfaceContainerLowest: '#081009',
  surfaceContainerLow: '#151e16',
  surfaceContainer: '#19221a',
  surfaceContainerHigh: '#232c24',
  surfaceContainerHighest: '#2e372e',
  
  // Content on surfaces
  onSurface: '#dbe5d9',
  onSurfaceVariant: '#bacbb9',
  inverseSurface: '#dbe5d9',
  inverseOnSurface: '#29332a',
  
  // Brand / Signal Colors
  primary: '#75ff9e', // Profit Green
  onPrimary: '#003918',
  primaryContainer: '#00e676',
  onPrimaryContainer: '#00612e',
  
  secondary: '#b0c6ff', // Data Blue
  onSecondary: '#002d6e',
  secondaryContainer: '#0068ed',
  onSecondaryContainer: '#f2f3ff',
  
  tertiary: '#ffdec4', // Warning Orange
  onTertiary: '#4b2800',
  tertiaryContainer: '#ffba79',
  onTertiaryContainer: '#794810',
  
  error: '#ffb4ab', // Danger Red
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  
  // Utilities
  outline: '#859585',
  outlineVariant: '#3b4a3d',
  glass: 'rgba(255, 255, 255, 0.08)',
  glassStroke: 'rgba(255, 255, 255, 0.1)',
  white10: 'rgba(255, 255, 255, 0.1)',
  white05: 'rgba(255, 255, 255, 0.05)',
  black90: 'rgba(0, 0, 0, 0.9)',
};

export const Typography = {
  displayProfit: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -0.96,
  },
  headlineLg: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 32,
    lineHeight: 38.4,
  },
  headlineMd: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 24,
    lineHeight: 28.8,
  },
  bodyLg: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    lineHeight: 27,
  },
  bodyMd: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  labelBold: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    lineHeight: 16.8,
    letterSpacing: 0.7,
  },
  dataMono: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 14,
    letterSpacing: 0.14,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  containerMargin: 20,
  gutter: 12,
};

export const BorderRadius = {
  default: 4,
  lg: 8,
  xl: 12,
  xxl: 16,
  full: 9999,
};
