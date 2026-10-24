import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Share, StyleSheet, View } from 'react-native';

import { EmptyState } from '../../components/EmptyState';
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
import { removeGroup, useGroup } from '../../data/store';
import { formatMoney } from '../../domain/money';

export default function GroupDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const group = useGroup(id);

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

  const invite = async () => {
    try {
      await Share.share({
        message: `Join “${group.name}” on SplitMate and split bills together.`,
      });
    } catch {
      notify('Could not open sharing', 'Sharing is not available on this device.');
    }
  };

  const leave = () =>
    confirmAction({
      title: `Leave ${group.name}?`,
      message:
        'You will be removed from this group. Balances will be checked before leaving once settlements are built (Phase 7).',
      confirmLabel: 'Leave',
      destructive: true,
      onConfirm: () => {
        removeGroup(group.id);
        router.back();
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
            notify('Add members', 'Adding members to an existing group arrives in Phase 3.')
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
        <AppText variant="subtitle">{group.memberNames.length} members</AppText>
      </View>

      <StatStrip
        variant="panel"
        items={[
          { icon: 'people', tone: 'lavender', value: String(group.memberNames.length), label: 'Members' },
          { icon: 'document-text-outline', tone: 'lavender', value: String(group.billsSplit), label: 'Bills Split' },
          { icon: 'wallet-outline', tone: 'lavender', value: formatMoney(group.totalSettledPaise), label: 'Total Settled' },
        ]}
      />

      <ClaySurface variant="raised" radius={radii.xl} style={styles.rows}>
        <SettingsRow
          icon="settings-outline"
          tone="lavender"
          title="Group Settings"
          subtitle="Edit group name, photo and more"
          onPress={() =>
            notify('Group settings', 'Renaming a group and changing its photo arrive in Phase 3.')
          }
        />
        <SettingsRow
          icon="link-outline"
          tone="lavender"
          title="Invite via Link"
          subtitle="Share an invite to add new members"
          onPress={invite}
        />
        <SettingsRow
          icon="log-out-outline"
          tone="pink"
          title="Leave Group"
          destructive
          showDivider={false}
          onPress={leave}
        />
      </ClaySurface>

      <View style={styles.members}>
        <SectionHeader title="Members" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.memberRow}
        >
          {group.memberNames.map((member) => (
            <View key={member} style={styles.member}>
              <Avatar name={member} size={64} />
              <AppText variant="bodyStrong" style={styles.memberName} numberOfLines={1}>
                {member}
              </AppText>
              {member === group.adminName ? <Chip label="Admin" tone="lavender" size="sm" /> : null}
            </View>
          ))}
        </ScrollView>
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
  members: { marginTop: 22 },
  memberRow: { gap: 18, paddingRight: 8 },
  member: { alignItems: 'center', gap: 6, width: 72 },
  memberName: { fontSize: 14 },
});
