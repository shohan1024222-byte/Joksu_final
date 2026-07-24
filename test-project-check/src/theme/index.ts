// JOKSHU Vibrant Color Theme
// A rich, colorful palette for a modern university election app

export const Colors = {
  // Primary gradient colors
  primary: '#6C63FF',        // Vibrant indigo
  primaryDark: '#4A42D1',    // Deep indigo
  primaryLight: '#8B85FF',   // Light indigo

  // Secondary accent
  secondary: '#FF6B6B',      // Coral red
  secondaryDark: '#E55555',
  secondaryLight: '#FF8E8E',

  // Tertiary
  tertiary: '#00D2FF',       // Cyan
  tertiaryDark: '#00B4D8',

  // Success / Vote confirmed
  success: '#00C853',
  successLight: '#69F0AE',
  successDark: '#00A844',

  // Warning
  warning: '#FFB300',
  warningLight: '#FFD54F',

  // Danger
  danger: '#FF5252',
  dangerLight: '#FF8A80',
  dangerDark: '#D32F2F',

  // Info
  info: '#448AFF',
  infoLight: '#82B1FF',

  // Neutrals
  white: '#FFFFFF',
  background: '#F0F2F8',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E8ECF4',
  divider: '#F0F2F8',

  // Text
  textPrimary: '#1A1D26',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // Dark surfaces
  darkBg: '#151825',
  darkCard: '#1E2235',
  darkSurface: '#262A40',

  // Gradient pairs
  gradients: {
    primary: ['#6C63FF', '#B24BF3'] as const,
    secondary: ['#FF6B6B', '#FF8E53'] as const,
    success: ['#00C853', '#00E676'] as const,
    info: ['#448AFF', '#00BCD4'] as const,
    warning: ['#FFB300', '#FF8F00'] as const,
    danger: ['#FF5252', '#FF1744'] as const,
    purple: ['#9C27B0', '#E040FB'] as const,
    ocean: ['#2196F3', '#00BCD4'] as const,
    sunset: ['#FF6B6B', '#FFB347'] as const,
    forest: ['#00C853', '#00BFA5'] as const,
    dark: ['#1A1D26', '#2D3250'] as const,
    midnight: ['#151825', '#1E2745'] as const,
    aurora: ['#6C63FF', '#00D2FF'] as const,
    candy: ['#FF6B6B', '#B24BF3'] as const,
    gold: ['#FFB300', '#FF8F00'] as const,
  },

  // Card accent colors for different sections
  cardAccents: {
    vote: '#00C853',
    candidates: '#448AFF',
    positions: '#FF6B6B',
    profile: '#FFB300',
    admin: '#B24BF3',
    results: '#00BCD4',
  },

  // Shadows
  shadow: {
    light: 'rgba(108, 99, 255, 0.08)',
    medium: 'rgba(108, 99, 255, 0.15)',
    heavy: 'rgba(108, 99, 255, 0.25)',
    colored: (color: string, opacity = 0.3) => color,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 100,
};

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
};
