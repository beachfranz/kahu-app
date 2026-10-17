import Svg, { Path } from 'react-native-svg';
import { ICON, type IconName } from '@/lib/icons';

export function Icon({ name, size = 20, color, width = 1.9 }: { name: IconName; size?: number; color: string; width?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width}
         strokeLinecap="round" strokeLinejoin="round" accessibilityElementsHidden importantForAccessibility="no">
      <Path d={ICON[name]} />
    </Svg>
  );
}
