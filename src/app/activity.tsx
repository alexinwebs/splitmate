import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChoiceChips, type ChoiceOption } from '../components/ChoiceChips';
import { EmptyState } from '../components/EmptyState';
import {
  AppText,
  ClaySurface,
  Icon,
  IconTile,
  Screen,
  ScreenHeader,
  radii,
  type IconName,
  type ToneName,
} from '../design';
import { useAppState } from '../data/store';
import { filterActivity, formatActivityTime, groupActivityByDay } from '../domain/activity';
import type { ActivityEvent } from '../domain/models';

const EVENT_STYLE: Record<ActivityEvent['type'], { icon: IconName; tone: ToneName }> = {
  group_created: { icon: 'people-outline', tone: 'lavender' },
  group_renamed: { icon: 'create-outline', tone: 'yellow' },
  member_added: { icon: 'person-add-outline', tone: 'mint' },
  member_removed: { icon: 'person-remove-outline', tone: 'pink' },
  expense_created: { icon: 'add-circle-outline', tone: 'mint' },
  expense_updated: { icon: 'create-outline', tone: 'yellow' },
  expense_deleted: { icon: 'trash-outline', tone: 'pink' },
};

export default function ActivityScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const router = useRouter();
  const { activity, groups, expenses } = useAppState();
  const [filter, setFilter] = useState<string>(
    groupId && groups.some((g) => g.id === groupId) ? groupId : 'all',
  );

  const days = useMemo(
    () => groupActivityByDay(filterActivity(activity, filter === 'all' ? null : filter)),
    [activity, filter],
  );

  const options: ChoiceOption<string>[] = [
    { value: 'all', label: 'All' },
    ...groups.map((g) => ({ value: g.id, label: g.name })),
  ];
  const groupName = (id: string): string => groups.find((g) => g.id === id)?.name ?? 'Group';

  return (
    <Screen
      header={
        <ScreenHeader
          title="Activity"
          subtitle="Recent changes across your groups"
          onBack={() => router.back()}
        />
      }
    >
      {groups.length > 1 ? (
        <View style={styles.filters}>
          <ChoiceChips options={options} value={filter} onChange={setFilter} />
        </View>
      ) : null}

      {days.length === 0 ? (
        <EmptyState
          icon="pulse-outline"
          title="No activity yet"
          message="Changes to groups and expenses will show up here."
        />
      ) : (
        days.map((day) => (
          <View key={day.dayIso} style={styles.day}>
            <AppText variant="headline" style={styles.dayLabel}>
              {day.label}
            </AppText>
            <View style={styles.list}>
              {day.events.map((event) => {
                const style = EVENT_STYLE[event.type];
                const expenseId = event.expenseId;
                const target =
                  expenseId && event.type !== 'expense_deleted' && expenses.some((e) => e.id === expenseId)
                    ? expenseId
                    : null;
                return (
                  <ClaySurface
                    key={event.id}
                    variant="raised"
                    radius={radii.lg}
                    onPress={
                      target
                        ? () => router.push({ pathname: '/bill/[id]', params: { id: target } })
                        : undefined
                    }
                    accessibilityLabel={`${event.summary}, ${groupName(event.groupId)}, ${formatActivityTime(event.at)}`}
                    style={styles.row}
                  >
                    <IconTile icon={style.icon} tone={style.tone} size={44} />
                    <View style={styles.text}>
                      <AppText variant="bodyStrong" numberOfLines={2}>
                        {event.summary}
                      </AppText>
                      <AppText variant="caption" numberOfLines={1}>
                        {groupName(event.groupId)} · {formatActivityTime(event.at)}
                      </AppText>
                    </View>
                    {target ? <Icon name="chevron-forward" size={18} /> : null}
                  </ClaySurface>
                );
              })}
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { marginBottom: 6 },
  day: { marginTop: 16 },
  dayLabel: { marginBottom: 10 },
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  text: { flex: 1 },
});
