import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Share, StyleSheet, View } from 'react-native';

import { EmptyState } from '../../components/EmptyState';
import { ExpenseRow } from '../../components/ExpenseRow';
import { GroupPhoto } from '../../components/GroupPhoto';
import { SectionHeader } from '../../components/SectionHeader';
import { SettingsRow } from '../../components/SettingsRow';
import { StatStrip } from '../../components/StatStrip';
import { confirmAction, notify } from '../../components/dialogs';
import {
  AppText,
  Avatar,
  Chip,
  ClayButton,
  ClaySurface,
  Icon,
  Screen,
  ScreenHeader,
  layout,
  radii,
} from '../../design';
import { appStore, useAppState, useExpenseViews, useGroup } from '../../data/store';
import { formatMoney } from '../../domain/money';
import { firstName, groupStats } from '../../domain/views';

export default function GroupDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const group = useGroup(id);
  const { people, me, expenses } = useAppState();
  const views = useExpenseViews();

  if (!group) {
    return (
      <Screen header={<ScreenHeader title="Group" onBack={() => router.back()} />}>
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

  const stats = groupStats(group.id, expenses);
  const groupViews = views.filter((v) => v.expense.groupId === group.id).slice(0, 5);
  const nameOf = (personId: string): string =>
    people.find((p) => p.id === personId)?.name ?? 'Unknown';

  const invite = async () => {
    try {
      await Share.share({
        message: `Join “${group.name}” on Splitzoa and split bills together.`,
      });
    } catch {
      notify('Could not open sharing', 'Sharing is not available on this device.');
    }
  };

  const remove = () =>
    confirmAction({
      title: `Delete ${group.name}?`,
      message: `This permanently deletes the group and its ${stats.billCount} ${
        stats.billCount === 1 ? 'expense' : 'expenses'
      } from this device. This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        appStore
          .deleteGroup(group.id)
          .then(() => router.back())
          .catch((error: unknown) =>
            notify('Could not delete group', error instanceof Error ? error.message : undefined),
          );
      },
    });

  return (
    <Screen
      header={
        <View style={styles.topBar}>
          <ClaySurface
            variant="raised"
            radius={23}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            style={styles.circle}
          >
            <Icon name="chevron-back" size={22} />
          </ClaySurface>
          <ClaySurface
            variant="raised"
            radius={23}
            onPress={invite}
            accessibilityLabel="Share invite"
            style={styles.circle}
          >
            <Icon name="share-social-outline" size={22} />
          </ClaySurface>
        </View>
      }
      footer={
        <ClayButton
          label="Add Members"
          icon="add"
          onPress={() =>
            router.push({ pathname: '/group/settings/[id]', params: { id: group.id } })
          }
        />
      }
    >
      <View style={styles.hero}>
        <GroupPhoto
          onPress={() =>
            notify('Group photo', 'Choosing a group photo arrives with the image picker in Phase 4.')
          }
        />
        <AppText variant="title" align="center" style={styles.name}>
          {group.name}
        </AppText>
        <AppText variant="subtitle">
          {group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'}
        </AppText>
      </View>

      <StatStrip
        variant="panel"
        items={[
          { icon: 'people', tone: 'lavender', value: String(group.memberIds.length), label: 'Members' },
          { icon: 'document-text-outline', tone: 'lavender', value: String(stats.billCount), label: 'Bills Split' },
          { icon: 'wallet-outline', tone: 'lavender', value: formatMoney(stats.totalPaise), label: 'Total Spent' },
        ]}
      />

      <ClaySurface variant="raised" radius={radii.xl} style={styles.rows}>
        <SettingsRow
          icon="settings-outline"
          tone="lavender"
          title="Group Settings"
          subtitle="Edit group name, photo and more"
          onPress={() =>
            router.push({ pathname: '/group/settings/[id]', params: { id: group.id } })
          }
        />
        <SettingsRow
          icon="pulse-outline"
          tone="blue"
          title="Activity"
          subtitle="Changes made in this group"
          onPress={() => router.push({ pathname: '/activity', params: { groupId: group.id } })}
        />
        <SettingsRow
          icon="link-outline"
          tone="lavender"
          title="Invite via Link"
          subtitle="Share an invite message"
          onPress={invite}
        />
        <SettingsRow
          icon="trash-outline"
          tone="pink"
          title="Delete Group"
          subtitle="Removes the group and its expenses from this device"
          destructive
          showDivider={false}
          onPress={remove}
        />
      </ClaySurface>

      <View style={styles.section}>
        <SectionHeader title="Members" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.memberRow}
        >
          {group.memberIds.map((memberId) => (
            <View key={memberId} style={styles.member}>
              <Avatar name={nameOf(memberId)} size={64} />
              <AppText variant="bodyStrong" style={styles.memberName} numberOfLines={1}>
                {memberId === me.id ? 'You' : firstName(nameOf(memberId))}
              </AppText>
              {memberId === group.adminId ? <Chip label="Admin" tone="lavender" size="sm" /> : null}
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Expenses" />
        {groupViews.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No expenses yet"
            message="Add the first expense for this group."
            actionLabel="Add an expense"
            onAction={() =>
              router.push({ pathname: '/expense/new', params: { groupId: group.id } })
            }
          />
        ) : (
          <View style={styles.list}>
            {groupViews.map((view) => (
              <ExpenseRow
                key={view.expense.id}
                view={view}
                onPress={() =>
                  router.push({ pathname: '/bill/[id]', params: { id: view.expense.id } })
                }
              />
            ))}
            <ClayButton
              label="Add Expense"
              variant="secondary"
              icon="add"
              size="md"
              onPress={() =>
                router.push({ pathname: '/expense/new', params: { groupId: group.id } })
              }
            />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingTop: 8,
    paddingBottom: 6,
  },
  circle: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 20, gap: 6 },
  name: { marginTop: 10, fontSize: 28, lineHeight: 34 },
  rows: { marginTop: 16, paddingHorizontal: 14, paddingVertical: 2 },
  section: { marginTop: 22 },
  memberRow: { gap: 18, paddingRight: 8 },
  member: { alignItems: 'center', gap: 6, width: 72 },
  memberName: { fontSize: 14 },
  list: { gap: 12 },
});
