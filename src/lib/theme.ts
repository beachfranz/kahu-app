// Palette borrowed from Dog Beach Scout: a cool blue-grey ground, white cards, navy ink, one ocean-blue accent.
// Green is a status colour only (open, fits, coming, here now), never a surface. Nunito.
import { Platform } from 'react-native';

export const C = {
  page: '#EEF4F8',        // screen ground
  bg: '#FFFFFF',          // cards, sheets, inputs
  surface: '#F1F5F9',     // sunk chips, round buttons
  line: '#E2ECF3',
  lineStrong: '#D1DDE8',
  text: '#0F2742',        // navy ink; also the fill of a selected chip
  muted: '#5B6B7D',
  faint: '#94A3B8',
  accent: '#0369A1',      // actions, links, the map pins
  accentDark: '#075985',
  accentSoft: '#F5F9FC',  // a quiet tint inside a white card
  go: '#15803D',          // status: open, fits, coming
  goBg: '#DCFCE7',
  live: '#16A34A',        // the here-now dot
  yesBg: '#E0F2FE',       // dog initials, small info badges
  yesBorder: '#D1DDE8',
  warnBg: '#FFEDD5',
  warnBorder: '#FDBA74',
  warnIcon: '#B45309',
  dashed: '#C7D3DE',
  ask: '#FFF7E6',
  askBorder: '#F2D9A6',
  photo: '#D1DDE8',
  scrim: 'rgba(15,39,66,0.45)',
};

// On the web a font that fails to load falls back to the system sans (never a browser serif).
const fallback = Platform.OS === 'web' ? ', system-ui, -apple-system, "Segoe UI", sans-serif' : '';
export const F = {
  regular: 'Nunito_400Regular' + fallback,
  semibold: 'Nunito_600SemiBold' + fallback,
  bold: 'Nunito_700Bold' + fallback,
  heavy: 'Nunito_800ExtraBold' + fallback,
};
