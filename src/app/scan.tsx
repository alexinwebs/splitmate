import { useRouter } from 'expo-router';

import { AppText, ClaySurface, Screen, ScreenHeader } from '../design';

export default function ScanScreen() {
  const router = useRouter();
  return (
    <Screen
      header={
        <ScreenHeader
          title="Upload Bill"
          subtitle="Scan or upload a screenshot"
          onBack={() => router.back()}
        />
      }
    >
      <ClaySurface variant="panel" style={{ padding: 20 }}>
        <AppText variant="headline">Placeholder</AppText>
        <AppText variant="caption" style={{ marginTop: 6 }}>
          The receipt upload flow is built in Phase 4.
        </AppText>
      </ClaySurface>
    </Screen>
  );
}
