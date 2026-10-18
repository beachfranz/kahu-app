import { ParkView } from '@/components/ParkView';
import { HOME_PARK_ID } from '@/lib/home';

export default function Home() {
  return <ParkView id={HOME_PARK_ID} home />;
}
