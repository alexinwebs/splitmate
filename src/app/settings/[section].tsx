import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '../../components/EmptyState';
import { confirmAction, notify } from '../../components/dialogs';
import {
  AppText,
  Chip,
  ClayButton,
  ClaySurface,
  IconTile,
  Screen,
  ScreenHeader,
  radii,
} from '../../design';
import { SETTINGS_SECTIONS } from '../../data/settingsSections';
import { appStore, loadSampleData, useAppState } from '../../data/store';

export default function SettingsSectionScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const router = useRouter();
  const { groups, expenses } = useAppState();
  const [busy, setBusy] = useState<'sample' | 'erase' | null>(null);
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

  const onLoadSample = async () => {
    setBusy('sample');
    try {
      await loadSampleData();
      notify('Sample data loaded', 'Explore Home, Groups and History.');
    } catch (error) {
      notify('Could not load sample data', error instanceof Error ? error.message : undefined);
    } finally {
      setBusy(null);
    }
  };

  const onErase = () =>
    confirmAction({
      title: 'Erase all data?',
      message: `This permanently deletes ${groups.length} ${
        groups.length === 1 ? 'group' : 'groups'
      } and ${expenses.length} ${
        expenses.length === 1 ? 'expense' : 'expenses'
      } from this device. This cannot be undone.`,
      confirmLabel: 'Erase everything',
      destructive: true,
      onConfirm: () => {
        setBusy('erase');
        appStore
          .resetAllData()
          .catch((error: unknown) =>
            notify('Could not erase data', error instanceof Error ? error.message : undefined),
          )
          .finally(() => setBusy(null));
      },
    });

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

      {config.key === 'privacy' ? (
        <ClaySurface variant="raised" radius={radii.xl} style={[styles.card, styles.data]}>
          <AppText variant="headline">Your data</AppText>
          <AppText variant="caption">
            {groups.length} {groups.length === 1 ? 'group' : 'groups'} · {expenses.length}{' '}
            {expenses.length === 1 ? 'expense' : 'expenses'} stored on this device
          </AppText>
          <ClayButton
            label="Load sample data"
            variant="secondary"
            icon="flask-outline"
            size="md"
            disabled={groups.length > 0}
            loading={busy === 'sample'}
            onPress={onLoadSample}
          />
          {groups.length > 0 ? (
            <AppText variant="small">
              Sample data can only be loaded into an empty app. Erase your data first.
            </AppText>
          ) : null}
          <ClayButton
            label="Erase all data"
            variant="danger"
            icon="trash-outline"
            size="md"
            loading={busy === 'erase'}
            onPress={onErase}
          />
        </ClaySurface>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18 },
  data: { marginTop: 16, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  text: { marginTop: 14 },
});
