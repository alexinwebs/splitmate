import { useRouter } from 'expo-router';

import { AppText, ClaySurface, Screen, ScreenHeader } from '../../design';

export default function NewExpenseScreen() {
  const router = useRouter();
  return (
    <Screen
      header={
        <ScreenHeader
          title="Add Expense"
          subtitle="Record an expense manually"
          onBack={() => router.back()}
        />
      }
    >
      <ClaySurface variant="panel" style={{ padding: 20 }}>
        <AppText variant="headline">Coming in Phase 3</AppText>
        <AppText variant="caption" style={{ marginTop: 6 }}>
          Manual expenses with equal, exact, percentage and share-based splits are built together
          with local storage and the calculation engine.
        </AppText>
      </ClaySurface>
    </Screen>
  );
}
