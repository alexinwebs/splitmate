import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '../../components/EmptyState';
import { AppText, Chip, ClaySurface, IconTile, Screen, ScreenHeader, radii } from '../../design';
import { SETTINGS_SECTIONS } from '../../data/settingsSections';

export default function SettingsSectionScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const router = useRouter();
  const config = SETTINGS_SECTIONS.find((s) => s.key === section);

  if (!config) {
    return (
      <Screen header={<ScreenHeader title="Settings" onBack={() => router.back()} />}>
        <EmptyState
          icon="settings-outline"
          title="Section not found"
          message="This settings section does not exist."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <ScreenHeader title={config.title} subtitle={config.subtitle} onBack={() => router.back()} />
      }
    >
      <ClaySurface variant="panel" radius={radii.xl} style={styles.card}>
        <View style={styles.top}>
          <IconTile icon={config.icon} tone={config.tone} size={56} elevated />
          <Chip label={`Planned: ${config.plannedPhase}`} tone="warning" icon="time-outline" />
        </View>
        <AppText variant="body" style={styles.text}>
          {config.description}
        </AppText>
        <AppText variant="caption" style={styles.text}>
          This setting isn’t available yet.
        </AppText>
      </ClaySurface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  text: { marginTop: 14 },
});
