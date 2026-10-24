import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '../../components/EmptyState';
import { GroupRow } from '../../components/GroupRow';
import { ClayButton, Screen, ScreenHeader } from '../../design';
import { useAppState } from '../../data/store';

export default function GroupsScreen() {
  const router = useRouter();
  const { groups } = useAppState();

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
          />
        ) : (
          groups.map((group) => (
            <GroupRow
              key={group.id}
              group={group}
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
