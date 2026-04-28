import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Base design width (375 = iPhone 14 Pro logical px)
const BASE_W = 375;
const BASE_H = 812;

/** Scale a size relative to screen width */
export const sw = (size: number) => (SCREEN_W / BASE_W) * size;
/** Scale a size relative to screen height */
export const sh = (size: number) => (SCREEN_H / BASE_H) * size;
/** Moderate scale — less aggressive for fonts */
export const ms = (size: number, factor = 0.45) =>
  size + (sw(size) - size) * factor;
/** Round to nearest pixel */
export const px = (n: number) => Math.round(PixelRatio.roundToNearestPixel(n));

export const SCREEN = { W: SCREEN_W, H: SCREEN_H };

export const theme = {
  colors: {
    primary:      '#1E4FD8',
    primaryDark:  '#1538A8',
    primaryLight: '#EBF0FD',
    background:   '#F5F6FA',
    surface:      '#FFFFFF',
    border:       '#E2E6EF',
    text: {
      primary:   '#0F172A',
      secondary: '#475569',
      muted:     '#94A3B8',
    },
    success: '#10B981',
    danger:  '#EF4444',
  },

  fontSize: {
    xs:  ms(11),
    sm:  ms(13),
    md:  ms(15),
    lg:  ms(18),
    xl:  ms(22),
    xxl: ms(28),
  },

  spacing: {
    xs:  sw(4),
    sm:  sw(8),
    md:  sw(16),
    lg:  sw(24),
    xl:  sw(32),
    xxl: sw(48),
  },

  radius: {
    sm: sw(6),
    md: sw(12),
    lg: sw(20),
    xl: sw(28),
    full: 9999,
  },

  // Input / button heights scale with screen
  inputHeight: Math.max(48, sh(52)),
  buttonHeight: Math.max(52, sh(56)),

  shadow: {
    sm: Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
    md: Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
  },
};