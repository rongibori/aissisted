/**
 * @aissisted/brand — TypeScript token constants.
 *
 * Mirrors packages/brand/tokens.css. Import these in:
 *   · Server components that need to pass style props
 *   · Animations / JS transitions that can't reference CSS vars
 *   · Tests or brand-rule validators
 *
 * Keep in sync with tokens.css. When you change one, change both.
 */

export const fontFamily = {
  display: '"Briston Bold", "IBM Plex Sans Variable", "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  body:    '"IBM Plex Sans Variable", "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  system:  '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  accent:  '"IBM Plex Serif", "Baskerville", Georgia, serif',
} as const;

export const color = {
  brandRed:         '#EE2B37',
  brandRedHover:    '#CA252F',
  brandWhite:       '#FFFFFF',
  brandGraphite:    '#1C1C1E',
  brandGraphiteSoft:'#2E2E2E',
  brandMidnight:    '#0B1D3A',
  brandAqua:        '#00C2D1',

  surface:    '#FFFFFF',
  surface2:   '#F7F7F8',
  line:       '#E5E5EA',
  lineStrong: '#D1D1D6',
  ink:        '#1C1C1E',
  inkMuted:   '#2E2E2E',
  inkSoft:    '#6E6E73',
  accent:     '#EE2B37',
  accentHover:'#CA252F',
  data:       '#0B1D3A',
  signal:     '#00C2D1',

  ok:         '#0F7A4C',
  okSoft:     '#E6F4ED',
  warn:       '#B76B00',
  warnSoft:   '#FBF1E2',
  danger:     '#EE2B37',
  dangerSoft: '#FCE6E8',
} as const;

export const fontSize = {
  display:  '4.5rem',   /* 72px */
  h1:       '3rem',     /* 48px */
  h2:       '2rem',     /* 32px */
  h3:       '1.5rem',   /* 24px */
  h4:       '1.25rem',  /* 20px */
  bodyLg:   '1.125rem', /* 18px */
  body:     '1rem',     /* 16px */
  bodySm:   '0.875rem', /* 14px */
  monoLg:   '0.9375rem',/* 15px */
  mono:     '0.8125rem',/* 13px */
  caption:  '0.75rem',  /* 12px */
} as const;

export const lineHeight = {
  display:    1.02,
  heading:    1.05,
  subheading: 1.15,
  body:       1.65,
  mono:       1.5,
  caption:    1.4,
} as const;

export const tracking = {
  display:    '-0.025em',
  heading:    '-0.02em',
  subheading: '-0.015em',
  body:       '0em',
  mono:       '0.01em',
  label:      '0.08em',
  caption:    '0.04em',
} as const;

export const fontWeight = {
  regular:  400,
  medium:   500,
  semibold: 600,
  bold:     700,
} as const;

export const spacing = {
  1:  '0.25rem',  /*  4px */
  2:  '0.5rem',   /*  8px */
  3:  '0.75rem',  /* 12px */
  4:  '1rem',     /* 16px */
  5:  '1.5rem',   /* 24px */
  6:  '2rem',     /* 32px */
  7:  '3rem',     /* 48px */
  8:  '4rem',     /* 64px */
  9:  '6rem',     /* 96px */
  10: '8rem',     /* 128px */
} as const;

export const radius = {
  none: '0px',
  xs:   '2px',
  sm:   '4px',
  md:   '8px',
  lg:   '16px',
  pill: '9999px',
} as const;

export const motion = {
  duration: {
    instant: '120ms',
    quick:   '180ms',
    base:    '240ms',
    calm:    '360ms',
    slow:    '520ms',
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    enter:    'cubic-bezier(0, 0, 0, 1)',
    exit:     'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

export const shadow = {
  none:        'none',
  sm:          '0 1px 2px rgba(28, 28, 30, 0.06)',
  md:          '0 4px 16px rgba(28, 28, 30, 0.08)',
  elevation1:  '0 1px 2px rgba(28, 28, 30, 0.04), 0 2px 8px rgba(28, 28, 30, 0.06)',
  focus:       '0 0 0 3px rgba(0, 194, 209, 0.25)',
} as const;

/** Convenience bundle — import * as tokens from '@aissisted/brand/tokens' */
export const tokens = { color, fontSize, lineHeight, tracking, fontWeight, spacing, radius, motion, shadow } as const;
