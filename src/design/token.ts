import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Values sampled from the reference PNGs (median of a small pixel patch).
 * Text colours are the darkest pixel in each text region, adjusted slightly.
 */
export const colors = {
  background: '#FEF8F0',
  surface: '#FEF9F4',
  surfaceRaised: '#FFFDFA',
  panel: '#F0E9FE',
  panelDeep: '#E4DAFE',
  panelHero: '#E7D8FD',
  inset: '#F3EDF4',
  segmentSelected: '#FAF6FE',

  textHeading: '#0B0A45',
  textSecondary: '#5E5A94',
  textMuted: '#8E8AB5',
  textOnPrimary: '#FFFFFF',
  link: '#5A35D0',
  tabInactive: '#4A47A3',

  primary: '#5D4390',
  primaryPressed: '#4E3779',
  fab: '#7344EB',
  checkFill: '#533788',
  destructive: '#D62B4C',

  hairline: 'rgba(98, 72, 170, 0.12)',
  divider: 'rgba(98, 72, 170, 0.14)',
  highlight: 'rgba(255, 255, 255, 0.85)',
  shadow: '#6A4FB3',
  overlay: 'rgba(20, 12, 60, 0.4)',
} as const;

export type ToneName =
  | 'lavender'
  | 'pink'
  | 'peach'
  | 'mint'
  | 'blue'
  | 'yellow'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

export const tones: Record<ToneName, { bg: string; fg: string; solid: string }> = {
  lavender: { bg: '#F0E9FE', fg: '#4B2FB0', solid: '#7344EB' },
  pink: { bg: '#FEE9ED', fg: '#8A1550', solid: '#D6336C' },
  peach: { bg: '#FEEFDE', fg: '#B5440D', solid: '#F28C38' },
  mint: { bg: '#E4F8EE', fg: '#0F5A44', solid: '#2FB891' },
  blue: { bg: '#DDECFD', fg: '#2B5FA8', solid: '#4A90E2' },
  yellow: { bg: '#FEF1CA', fg: '#8A5A00', solid: '#F2B632' },
  success: { bg: '#E8F8EA', fg: '#1F8A3F', solid: '#34A853' },
  warning: { bg: '#FFF1CF', fg: '#9A5B00', solid: '#F2B632' },
  danger: { bg: '#FEEBEC', fg: '#B0123B', solid: '#E5484D' },
  neutral: { bg: '#F3EEEB', fg: '#5E5A94', solid: '#B8B3CC' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 22,
  xl: 26,
  hero: 30,
  pill: 999,
} as const;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export type TextVariant =
  | 'title'
  | 'headline'
  | 'subtitle'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'small'
  | 'amount'
  | 'amountLg'
  | 'button';

export const typography: Record<TextVariant, TextStyle> = {
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, color: colors.textHeading },
  headline: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.textHeading },
  subtitle: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textHeading },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, color: colors.textHeading },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  small: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  amount: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.textHeading },
  amountLg: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 36, color: colors.textHeading },
  button: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.textOnPrimary },
};

export type ShadowLevel = 'none' | 'sm' | 'md' | 'lg';

/**
 * iOS uses shadow* props; Android uses elevation (coloured shadows need API 28+).
 * Keep to these tokens; do not hand-roll shadows per component.
 */
export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 8,
  },
  fab: {
    shadowColor: colors.fab,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
} satisfies Record<string, ViewStyle>;

export const layout = {
  screenPadding: 20,
  tabBarHeight: 72,
  /** Space screens inside the tab navigator must leave at the bottom. */
  tabBarSpace: 128,
  minTouch: 44,
} as const;