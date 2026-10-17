// Line icons (24×24 viewBox, stroke) for park amenities and UI. One path per icon.
export const ICON = {
  offleash:
    'M5.5 9.5m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0M9 6m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0M15 6m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0M18.5 9.5m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0M7.5 16.5c0-2.6 2-4.8 4.5-4.8s4.5 2.2 4.5 4.8c0 2-2 3-4.5 3s-4.5-1-4.5-3z',
  fence: 'M5 20V8l2-2 2 2v12M10 20V8l2-2 2 2v12M15 20V8l2-2 2 2v12M3 12h18M3 17h18',
  gate: 'M4 21V4h7v17M13 21V4h7v17M9 12.5h.01M15 12.5h.01M2 21h20',
  small:
    'M9 10m-1.1 0a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0-2.2 0M15 10m-1.1 0a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0-2.2 0M9.5 15.5c0-1.6 1.1-2.9 2.5-2.9s2.5 1.3 2.5 2.9c0 1.2-1.1 1.8-2.5 1.8s-2.5-.6-2.5-1.8zM3 20h18',
  big:
    'M5 8m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0M9.5 4.5m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0M14.5 4.5m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0M19 8m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0M6.5 15.5c0-3.2 2.5-5.6 5.5-5.6s5.5 2.4 5.5 5.6c0 2.5-2.5 3.8-5.5 3.8s-5.5-1.3-5.5-3.8z',
  water: 'M12 3c3.5 4.4 6 7.5 6 10.5a6 6 0 0 1-12 0C6 10.5 8.5 7.4 12 3z',
  splash: 'M12 3c2.5 3.2 4 5.4 4 7.5a4 4 0 0 1-8 0C8 8.4 9.5 6.2 12 3zM3 17c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0M3 21c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0',
  shade: 'M12 21v-5M6 16h12L12 3z',
  bench: 'M4 10h16M4 14h16M6 14v5M18 14v5M6 10V7M18 10V7',
  picnic: 'M4 9h16M7 9l-3 11M17 9l3 11M5.5 15h13',
  parking: 'M5 3h14v18H5zM10 17V8h3.5a2.5 2.5 0 0 1 0 5H10',
  restroom:
    'M7 5.5m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0M17 5.5m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0M5 21v-6H4l1.5-5h3l1.5 5H9v6M15 9h4v6h-1v6h-2v-6h-1zM12 3v18',
  ground: 'M3 18c3-1.2 6-1.2 9 0s6 1.2 9 0M6 14l2-2M11 13.5l2-2M16 14l2-2M8 9l1.5-1.5M14 9l1.5-1.5',
  bags: 'M6 8h12l-1 12H7zM9 8V6a3 3 0 0 1 6 0v2',
  light: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  agility: 'M4 20V9M20 20V9M4 12h16M4 16h16M2 20h4M18 20h4',
  clock: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 7v5l3 2',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 10m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
  search: 'M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M20 20l-3.5-3.5',
  back: 'M15 5l-7 7 7 7',
  share: 'M12 3v12M7 8l5-5 5 5M5 14v5h14v-5',
  close: 'M6 6l12 12M18 6L6 18',
  directions: 'M3 11l18-8-8 18-2-8-8-2z',
  check: 'M5 12l5 5 9-10',
  book: 'M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2zM8 7h6',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
};
export type IconName = keyof typeof ICON;

// Boolean fields shown as tiles, in display order, with their icon and short label.
export const AMENITY_TILES: { field: string; icon: IconName; label: string }[] = [
  { field: 'off_leash', icon: 'offleash', label: 'Off-leash' },
  { field: 'fenced', icon: 'fence', label: 'Fenced' },
  { field: 'double_gate', icon: 'gate', label: 'Double gate' },
  { field: 'small_dog_area', icon: 'small', label: 'Small dogs' },
  { field: 'large_dog_area', icon: 'big', label: 'Big dogs' },
  { field: 'drinking_water', icon: 'water', label: 'Water' },
  { field: 'water_play', icon: 'splash', label: 'Water play' },
  { field: 'shade', icon: 'shade', label: 'Shade' },
  { field: 'benches', icon: 'bench', label: 'Benches' },
  { field: 'picnic_tables', icon: 'picnic', label: 'Picnic tables' },
  { field: 'parking', icon: 'parking', label: 'Parking' },
  { field: 'restrooms', icon: 'restroom', label: 'Restrooms' },
  { field: 'waste_bags', icon: 'bags', label: 'Poop bags' },
  { field: 'lighting', icon: 'light', label: 'Lights' },
  { field: 'agility', icon: 'agility', label: 'Agility' },
];

// Highlights on find cards (subset, same icons).
export const HIGHLIGHT_CHIPS: { field: keyof import('./api').Highlights; icon: IconName; label: string }[] = [
  { field: 'fenced', icon: 'fence', label: 'Fenced' },
  { field: 'small_dog_area', icon: 'small', label: 'Small dogs' },
  { field: 'drinking_water', icon: 'water', label: 'Water' },
  { field: 'shade', icon: 'shade', label: 'Shade' },
  { field: 'water_play', icon: 'splash', label: 'Water play' },
  { field: 'lighting', icon: 'light', label: 'Lit' },
];

// Filter chips on find (each sends {field: true}: parks where a source states it).
export const FILTERS: { field: string; label: string }[] = [
  { field: 'small_dog_area', label: 'Small-dog area' },
  { field: 'drinking_water', label: 'Water' },
  { field: 'shade', label: 'Shade' },
  { field: 'fenced', label: 'Fenced' },
  { field: 'lighting', label: 'Lit at night' },
];

export const SURFACE_LABEL: Record<string, string> = {
  grass: 'Grass', artificial_turf: 'Turf', dirt: 'Dirt', decomposed_granite: 'Granite', wood_chips: 'Wood chips',
  sand: 'Sand', gravel: 'Gravel', concrete: 'Concrete', mixed: 'Mixed',
};
