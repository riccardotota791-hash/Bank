// Tema scuro ispirato ai pannelli di stato del networking (switch/router LED panels).
export const colors = {
  bg: '#050a12',
  bgAlt: '#081019',
  panel: '#0d1a29',
  panelAlt: '#0f2233',
  border: '#1b3247',
  borderBright: '#22485f',
  grid: '#0f1e2e',

  textPrimary: '#e7f3ff',
  textSecondary: '#7f9bb3',
  textMuted: '#516d84',

  accent: '#2de3c9', // verde-acqua: attività completate / "link up"
  accentDim: '#134d44',
  accentSoft: 'rgba(45, 227, 201, 0.12)',

  amber: '#f5b942', // in corso / attenzione
  amberSoft: 'rgba(245, 185, 66, 0.12)',

  danger: '#f4485f', // "link down" / mancante
  dangerSoft: 'rgba(244, 72, 95, 0.12)',

  offline: '#3a4d5e', // moduli disattivati (es. lunedì)
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};

export const typography = {
  mono: { fontFamily: undefined as string | undefined }, // placeholder, uses system mono via letterSpacing
};

export const fonts = {
  label: {
    fontSize: 11,
    letterSpacing: 1.4,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  title: {
    fontSize: 20,
    fontWeight: '800' as const,
    letterSpacing: 0.2,
  },
  bigStat: {
    fontSize: 34,
    fontWeight: '800' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
};
