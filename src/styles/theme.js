// Shared design values for the FixIT interface.
export const colors = {
  navy: '#10243A',
  navyLight: '#183854',
  blue: '#2563EB',
  blueLight: '#EAF3FF',
  background: '#F5F7FB',
  surface: '#FFFFFF',
  text: '#172B3A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  // Extended FixIT Precision palette.
  primary: '#2563EB',
  secondary: '#183854',
  accent: '#38BDF8',
  textSecondary: '#475569',
  divider: '#E2E8F0',
  successLight: '#D1FAE5',
  warning: '#B45309',
  warningLight: '#FEF3C7',
  danger: '#B91C1C',
  dangerLight: '#FEE2E2',
  info: '#1D4ED8',
  infoLight: '#DBEAFE',
  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
  xl: 32,
};

export const typography = {
  title: 28,
  heading: 20,
  body: 15,
  caption: 13,
  overline: 11,
  subtitle: 17,
  largeTitle: 32,
  lineHeight: { tight: 1.2, normal: 1.45, relaxed: 1.6 },
  weight: { regular: '400', medium: '500', semibold: '600', bold: '700', heavy: '800' },
};

export const shadows = {
  none: { elevation: 0 },
  sm: { shadowColor: '#10243A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  md: { shadowColor: '#10243A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 8, elevation: 3 },
  lg: { shadowColor: '#10243A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
};

export const sizing = {
  iconSm: 16, iconMd: 20, iconLg: 24,
  controlSm: 36, controlMd: 44, controlLg: 52,
  inputHeight: 48, buttonHeight: 48, tabBarHeight: 62,
  avatarSm: 32, avatarMd: 44, avatarLg: 56,
};
