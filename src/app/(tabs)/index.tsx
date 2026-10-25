import { useRouter } from 'expo-router';
import { StyleSheet, View, Pressable, useWindowDimensions, type DimensionValue } from 'react-native';

import { EmptyState } from '../../components/EmptyState';
import { ExpenseRow } from '../../components/ExpenseRow';
import { SectionHeader } from '../../components/SectionHeader';
import { notify } from '../../components/dialogs';
import {
  AppText,
  Avatar,
  ClaySurface,
  Icon,
  IconTile,
  Screen,
  colors,
  layout,
  radii,
} from '../../design';
import { loadSampleData, useAppState, useExpenseViews } from '../../data/store';

const ACTIONS = [
  { key: 'scan', label: 'Scan Bill', icon: 'camera-outline', tone: 'yellow' },
  { key: 'group', label: 'New Group', icon: 'people-outline', tone: 'blue' },
  { key: 'manual', label: 'Add Manually', icon: 'document-text-outline', tone: 'pink' },
  { key: 'history', label: 'History', icon: 'time-outline', tone: 'mint' },
] as const;

const RECEIPT_LINES: DimensionValue[] = ['80%', '65%', '80%', '50%'];

function HeroArt() {
  return (
    <View style={styles.art} pointerEvents="none">
      <ClaySurface
        variant="raised"
        tone="#FFFFFF"
        radius={18}
        elevation="md"
        style={styles.receipt}
      >
        {RECEIPT_LINES.map((w, i) => (
          <View key={i} style={[styles.line, { width: w }]} />
        ))}
      </ClaySurface>
      <ClaySurface
        variant="raised"
        tone="#8B63F0"
        radius={20}
        elevation="lg"
        style={styles.camera}
      >
        <Icon name="camera" size={32} color="#FFFFFF" />
      </ClaySurface>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { groups, me } = useAppState();
  const views = useExpenseViews();
  const { width } = useWindowDimensions();
  const tileSize = Math.floor((width - layout.screenPadding * 2 - 12 * 3) / 4);
  const recent = views.slice(0, 3);

  const onAction = (key: (typeof ACTIONS)[number]['key']) => {
    switch (key) {
      case 'scan':
        router.push('/scan');
        break;
      case 'group':
        router.push('/group/new');
        break;
      case 'manual':
        router.push('/expense/new');
        break;
      case 'history':
        router.navigate('/history');
        break;
    }
  };

  const onLoadSample = async () => {
    try {
      await loadSampleData();
    } catch (error) {
      notify('Could not load sample data', error instanceof Error ? error.message : undefined);
    }
  };

  return (
    <Screen tabBar contentStyle={styles.content}>
      <View style={styles.header}>
        <Avatar name={me.name} size={60} />
        <View style={styles.hello}>
          <AppText variant="title">Hello {me.name}</AppText>
          <AppText variant="subtitle">Let’s split smarter</AppText>
        </View>
        <ClaySurface
          variant="raised"
          radius={26}
          onPress={() => router.push('/activity')}
          accessibilityLabel="Activity"
          style={styles.bell}
        >
          <Icon name="notifications-outline" size={24} />
        </ClaySurface>
      </View>

      <ClaySurface
        variant="panel"
        tone={colors.panelHero}
        radius={radii.hero}
        onPress={() => router.push('/scan')}
        accessibilityLabel="Scan a bill. Upload a screenshot and we’ll extract items."
        style={styles.hero}
      >
        <View style={styles.heroText}>
          <AppText variant="amountLg" style={styles.heroTitle}>
            Split bills easily
          </AppText>
          <AppText variant="caption" style={styles.heroCaption}>
            Upload a screenshot and we’ll extract items, split with friends.
          </AppText>
        </View>
        <HeroArt />
      </ClaySurface>

      <View style={styles.actions}>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.key}
            onPress={() => onAction(a.key)}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            style={({ pressed }) => [styles.action, { width: tileSize }, pressed ? styles.pressed : null]}
          >
            <IconTile icon={a.icon} tone={a.tone} size={tileSize} elevated />
            <AppText
              variant="caption"
              align="center"
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.actionLabel}
            >
              {a.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      <View style={styles.recent}>
        <SectionHeader
          title="Recent Expenses"
          actionLabel="See all"
          onAction={() => router.navigate('/history')}
        />
        {groups.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="Welcome to Splitzoa"
            message="Create a group to start splitting bills, or load sample data to explore the app."
            actionLabel="Create a group"
            onAction={() => router.push('/group/new')}
            secondaryLabel="Load sample data"
            onSecondary={onLoadSample}
          />
        ) : recent.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No expenses yet"
            message="Add an expense to see it here."
            actionLabel="Add an expense"
            onAction={() => router.push('/expense/new')}
          />
        ) : (
          <View style={styles.list}>
            {recent.map((view) => (
              <ExpenseRow
                key={view.expense.id}
                view={view}
                onPress={() =>
                  router.push({ pathname: '/bill/[id]', params: { id: view.expense.id } })
                }
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  hello: { flex: 1 },
  bell: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 190, padding: 22, justifyContent: 'center', overflow: 'visible' },
  heroText: { width: '58%' },
  heroTitle: { fontSize: 30, lineHeight: 36 },
  heroCaption: { marginTop: 10 },
  art: { position: 'absolute', right: 14, top: 20, width: 140, height: 150 },
  receipt: {
    position: 'absolute',
    top: 0,
    right: 28,
    width: 92,
    height: 120,
    padding: 14,
    gap: 10,
    transform: [{ rotate: '6deg' }],
  },
  line: { height: 7, borderRadius: 4, backgroundColor: '#E4DAFE' },
  camera: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 72,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  action: { alignItems: 'center', gap: 8 },
  actionLabel: { fontSize: 12.5 },
  pressed: { opacity: 0.7 },
  recent: { marginTop: 26 },
  list: { gap: 12 },
});
