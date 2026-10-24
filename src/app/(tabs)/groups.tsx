import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '../../components/EmptyState';
import { GroupRow } from '../../components/GroupRow';
import { notify } from '../../components/dialogs';
import { ClayButton, Screen, ScreenHeader } from '../../design';
import { groupStats } from '../../domain/views';
import { loadSampleData, useAppState } from '../../data/store';

export default function GroupsScreen() {
  const router = useRouter();
  const { groups, expenses } = useAppState();

  const onLoadSample = async () => {
    try {
      await loadSampleData();
    } catch (error) {
      notify('Could not load sample data', error instanceof Error ? error.message : undefined);
    }
  };

  return (
    <Screen
      tabBar
      header={<ScreenHeader title="Groups" subtitle="Split bills with your people" />}
    >
      <ClayButton
        label="Create Group"
        variant="secondary"
        icon="add"
        size="md"
        onPress={() => router.push('/group/new')}
      />
      <View style={styles.list}>
        {groups.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No groups yet"
            message="Create a group to start splitting bills with friends, roommates or family."
            actionLabel="Create a group"
            onAction={() => router.push('/group/new')}
            secondaryLabel="Load sample data"
            onSecondary={onLoadSample}
          />
        ) : (
          groups.map((group) => (
            <GroupRow
              key={group.id}
              name={group.name}
              memberCount={group.memberIds.length}
              billCount={groupStats(group.id, expenses).billCount}
              onPress={() => router.push({ pathname: '/group/[id]', params: { id: group.id } })}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 16, gap: 12 },
});
