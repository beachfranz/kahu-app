import { useLocalSearchParams } from 'expo-router';
import { ParkView } from '@/components/ParkView';
import { parksNear } from '@/lib/api';

// Static web export: one HTML page per park (share links and previews). Parks come from the API at build time.
export async function generateStaticParams(): Promise<{ id: string }[]> {
  const parks = await parksNear(33.7, -117.85, 200, {}, 200);
  return parks.map((p) => ({ id: String(p.id) }));
}

export default function ParkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ParkView id={parseInt(String(id), 10)} />;
}
