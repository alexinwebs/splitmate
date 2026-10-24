import { useRouter } from 'expo-router';

import { PlaceholderScreen } from '../../components/PlaceholderScreen';
import { ClayButton } from '../../design';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <PlaceholderScreen title="Home" subtitle="Let's split smarter" builtIn="Phase 2">
      <ClayButton
        label="Open Design Gallery"
        icon="color-palette-outline"
        onPress={() => router.push('/gallery')}
      />
    </PlaceholderScreen>
  );
}
