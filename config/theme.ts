export const theme = {
  colors: {
    background: {
      primary: '#000000',
      secondary: '#0A0A0A',
      tertiary: '#1A1A1A',
      surface: '#242424',
      elevated: '#2A2A2A',
    },
    brand: {
      cyan: '#00D9FF',
      blue: '#00B8FF',
      purple: '#7B61FF',
      violet: '#9D4EDD',
      magenta: '#FF006E',
      pink: '#FF0080',
      gradient: {
        start: '#00D9FF',
        middle: '#7B61FF',
        end: '#FF006E',
      },
    },
    text: {
      primary: '#F5F5F5',
      secondary: '#E8E8E8',
      muted: '#A0A0A0',
      disabled: '#606060',
      inverse: '#000000',
    },
    border: {
      subtle: '#2A2A2A',
      default: '#404040',
      strong: '#606060',
      brand: '#7B61FF',
    },
    state: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#00B8FF',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
      xxxl: 48,
    },
    fontWeights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      cyan: {
        shadowColor: '#00D9FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 0,
      },
      purple: {
        shadowColor: '#7B61FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 0,
      },
      magenta: {
        shadowColor: '#FF006E',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 0,
      },
    },
  },
};

export type Theme = typeof theme;
