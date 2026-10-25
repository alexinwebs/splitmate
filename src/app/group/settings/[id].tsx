import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '../../../components/EmptyState';
import { confirmAction, notify } from '../../../components/dialogs';
import {
  AppText,
  Avatar,
  Chip,
  ClayButton,
  ClayInput,
  ClaySurface,
  Icon,
  Screen,
  ScreenHeader,
  radii,
  tones,
} from '../../../design';
import { appStore, useAppState, useGroup } from '../../../data/store';
import { MAX_GROUP_MEMBERS } from '../../../data/storeCore';
import type { Group } from '../../../domain/models';

function SettingsBody({ group }: { group: Group }) {
  const router = useRouter();
  const { people, me } = useAppState();
  const [name, setName] = useState(group.name);
  const [newNames, setNewNames] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const members = group.memberIds.map((id) => ({
    id,
    name: people.find((p) => p.id === id)?.name ?? 'Unknown',
  }));
  const suggestions = people.filter((p) => p.id !== me.id && !group.memberIds.includes(p.id));
  const full = group.memberIds.length >= MAX_GROUP_MEMBERS;

  const run = async (key: string, task: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await task();
    } catch (error) {
      notify('Could not save', error instanceof Error ? error.message : undefined);
    } finally {
      setBusy(null);
    }
  };

  const canSaveName = name.trim().length > 0 && name.trim() !== group.name;

  const addTyped = () =>
    run('add', async () => {
      await appStore.addMembers(group.id, newNames.split(','));
      setNewNames('');
    });

  const confirmRemove = (id: string, memberName: string) =>
    confirmAction({
      title: `Remove ${memberName}?`,
      message: `${memberName} will be removed from “${group.name}”. This only works if they are not part of any expense in the group.`,
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: () => {
        void run(`remove-${id}`, () => appStore.removeMember(group.id, id));
      },
    });

  return (
    <Screen
      header={
        <ScreenHeader title="Group Settings" subtitle={group.name} onBack={() => router.back()} />
      }
    >
      <ClaySurface variant="raised" radius={radii.xl} style={styles.card}>
        <ClayInput
          label="Group name"
          value={name}
          onChangeText={setName}
          onClear={() => setName('')}
          maxLength={40}
          autoCapitalize="words"
          placeholder="Group name"
        />
        <ClayButton
          label="Save name"
          size="md"
          disabled={!canSaveName}
          loading={busy === 'name'}
          onPress={() => run('name', () => appStore.renameGroup(group.id, name))}
          style={styles.cardButton}
        />
      </ClaySurface>

      <View style={styles.section}>
        <AppText variant="headline">
          Members ({group.memberIds.length}/{MAX_GROUP_MEMBERS})
        </AppText>
        <ClaySurface variant="raised" radius={radii.xl} style={styles.members}>
          {members.map((member, i) => (
            <View
              key={member.id}
              style={[styles.memberRow, i < members.length - 1 ? styles.memberDivider : null]}
            >
              <Avatar name={member.name} size={44} />
              <AppText variant="bodyStrong" numberOfLines={1} style={styles.memberName}>
                {member.name}
              </AppText>
              {member.id === me.id ? (
                <Chip label={member.id === group.adminId ? 'You · Admin' : 'You'} tone="lavender" size="sm" />
              ) : (
                <ClaySurface
                  variant="raised"
                  radius={20}
                  onPress={() => confirmRemove(member.id, member.name)}
                  accessibilityLabel={`Remove ${member.name}`}
                  disabled={busy !== null}
                  style={styles.removeButton}
                >
                  <Icon name="close" size={18} color={tones.danger.fg} />
                </ClaySurface>
              )}
            </View>
          ))}
        </ClaySurface>
      </View>

      <View style={styles.section}>
        <AppText variant="headline">Add people</AppText>
        {full ? (
          <AppText variant="caption" style={styles.note}>
            This group has the maximum of {MAX_GROUP_MEMBERS} members.
          </AppText>
        ) : (
          <>
            {suggestions.length > 0 ? (
              <View style={styles.suggestions}>
                {suggestions.map((person) => (
                  <Pressable
                    key={person.id}
                    onPress={() => run('add', () => appStore.addMembers(group.id, [person.name]))}
                    disabled={busy !== null}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${person.name}`}
                  >
                    <Chip label={`+ ${person.name}`} tone="lavender" />
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={styles.addRow}>
              <ClayInput
                variant="inset"
                leftIcon="person-add-outline"
                value={newNames}
                onChangeText={setNewNames}
                onSubmitEditing={addTyped}
                placeholder="Type names, separated by commas"
                autoCapitalize="words"
              />
              <ClayButton
                label="Add"
                size="md"
                disabled={newNames.trim().length === 0}
                loading={busy === 'add'}
                onPress={addTyped}
                style={styles.cardButton}
              />
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

export default function GroupSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const group = useGroup(id);

  if (!group) {
    return (
      <Screen header={<ScreenHeader title="Group Settings" onBack={() => router.back()} />}>
        <EmptyState
          icon="people-outline"
          title="Group not found"
          message="This group no longer exists."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }
  return <SettingsBody key={group.id} group={group} />;
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  cardButton: { marginTop: 12 },
  section: { marginTop: 22 },
  note: { marginTop: 8 },
  members: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 2 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  memberDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(98, 72, 170, 0.14)' },
  memberName: { flex: 1 },
  removeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  addRow: { marginTop: 12 },
});
