import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BillRow } from '../../components/BillRow';
import { EmptyState } from '../../components/EmptyState';
import { ClayInput, Screen, ScreenHeader, SegmentedControl } from '../../design';
import { formatDate } from '../../domain/date';
import { useExpenseViews } from '../../data/store';

const SEGMENTS = ['All Bills', 'Settled', 'Pending'] as const;

export default function HistoryScreen() {
  const router = useRouter();
  const views = useExpenseViews();
  const [segment, setSegment] = useState<(typeof SEGMENTS)[number]>('All Bills');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return views.filter((view) => {
      if (segment === 'Settled' && view.status !== 'settled') return false;
      if (segment === 'Pending' && view.status !== 'pending') return false;
      if (q.length === 0) return true;
      return (
        view.expense.title.toLowerCase().includes(q) ||
        view.groupName.toLowerCase().includes(q) ||
        formatDate(view.expense.date).toLowerCase().includes(q)
      );
    });
  }, [views, segment, query]);

  return (
    <Screen
      tabBar
      header={<ScreenHeader title="History" subtitle="All your bills in one place" />}
    >
      <SegmentedControl options={SEGMENTS} value={segment} onChange={setSegment} />
      <View style={styles.search}>
        <ClayInput
          variant="inset"
          leftIcon="search-outline"
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          placeholder="Search by restaurant, date or group..."
          returnKeyType="search"
        />
      </View>
      <View style={styles.list}>
        {visible.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title={views.length === 0 ? 'No expenses yet' : 'No bills found'}
            message={
              views.length === 0
                ? 'Expenses you add will show up here.'
                : 'Try a different search or switch the tab above.'
            }
          />
        ) : (
          visible.map((view) => (
            <BillRow
              key={view.expense.id}
              view={view}
              onPress={() =>
                router.push({ pathname: '/bill/[id]', params: { id: view.expense.id } })
              }
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { marginTop: 14 },
  list: { marginTop: 14, gap: 12 },
});
