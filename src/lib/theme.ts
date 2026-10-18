// "Park morning": white ground, sage surfaces, one grass-green accent, Nunito.
import { Platform } from 'react-native';

export const C = {
  bg: '#FFFFFF',
  surface: '#F2F5F0',
  line: '#E4E9E2',
  lineStrong: '#DDE3DC',
  text: '#17241C',
  muted: '#55635A',
  faint: '#8A968E',
  accent: '#2E7D4F',
  accentDark: '#1F5E39',
  accentSoft: '#F2F8F4',
  live: '#2E9E5B',
  yesBg: '#E3F1E8',
  yesBorder: '#C5E1CF',
  warnBg: '#FFF1CC',
  warnBorder: '#EBD38E',
  warnIcon: '#8A5A00',
  dashed: '#C3CDC6',
  ask: '#FFF8E1',
  askBorder: '#E5D9A8',
  photo: '#CFE3D4',
  scrim: 'rgba(23,36,28,0.45)',
};

// On the web a font that fails to load falls back to the system sans (never a browser serif).
const fallback = Platform.OS === 'web' ? ', system-ui, -apple-system, "Segoe UI", sans-serif' : '';
export const F = {
  regular: 'Nunito_400Regular' + fallback,
  semibold: 'Nunito_600SemiBold' + fallback,
  bold: 'Nunito_700Bold' + fallback,
  heavy: 'Nunito_800ExtraBold' + fallback,
};

// The tab bar's style, shared by the tabs layout and the home tab (which hides it during the welcome).
export const TAB_BAR = { borderTopColor: C.line, height: 64, paddingTop: 6 };
