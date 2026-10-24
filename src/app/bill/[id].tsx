import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '../../components/EmptyState';
import { MerchantTile } from '../../components/MerchantTile';
import { confirmAction, notify } from '../../components/dialogs';
import {
  AppText,
  Avatar,
  Chip,
  ClayButton,
  ClaySurface,
  Screen,
  ScreenHeader,
  colors,
  radii,
  tones,
} from '../../design';
import { appStore, useAppState, useExpenseView } from '../../data/store';
import { formatDate } from '../../domain/date';
import { formatMoney } from '../../domain/money';
import { CATEGORY_LABELS, SPLIT_METHOD_LABELS } from '../../domain/models';

export default function ExpenseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const view = useExpenseView(id);
  const { people, me } = useAppState();

  const header = (
    <ScreenHeader
      title="Bill Details"
      subtitle="Complete breakdown of your bill"
      onBack={() => router.back()}
    />
  );

  if (!view) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="receipt-outline"
          title="Bill not found"
          message="This bill no longer exists."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const { expense } = view;
  const settled = view.status === 'settled';
  const nameOf = (personId: string): string => {
    const name = people.find((p) => p.id === personId)?.name ?? 'Unknown';
    return personId === me.id ? `${name} (You)` : name;
  };

  const remove = () =>
    confirmAction({
      title: 'Delete this expense?',
      message: `"${expense.title}" (${formatMoney(expense.totalPaise)}) will be removed from the group balances. A record of the deletion is kept in the activity log.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        appStore
          .deleteExpense(expense.id)
          .then(() => router.back())
          .catch((error: unknown) =>
            notify('Could not delete expense', error instanceof Error ? error.message : undefined),
          );
      },
    });

  return (
    <Screen
      header={header}
      footer={
        <View style={styles.footer}>
          <ClayButton
            label="Edit"
            variant="secondary"
            icon="create-outline"
            style={styles.footerButton}
            onPress={() =>
              router.push({ pathname: '/expense/edit/[id]', params: { id: expense.id } })
            }
          />
          <ClayButton
            label="Delete"
            variant="danger"
            icon="trash-outline"
            style={styles.footerButton}
            onPress={remove}
          />
        </View>
      }
    >
      <ClaySurface variant="panel" radius={radii.xl} style={styles.top}>
        <MerchantTile category={expense.category} size={60} />
        <View style={styles.topText}>
          <AppText variant="headline" numberOfLines={2}>
            {expense.title}
          </AppText>
          <AppText variant="caption">
            {formatDate(expense.date)} · {view.groupName}
          </AppText>
          <AppText variant="small">{CATEGORY_LABELS[expense.category]}</AppText>
        </View>
        <ClaySurface variant="raised" tone="#FFFFFF" radius={16} style={styles.total}>
          <AppText variant="small">Total Amount</AppText>
          <AppText variant="amount">{formatMoney(expense.totalPaise)}</AppText>
        </ClaySurface>
      </ClaySurface>

      <ClaySurface variant="raised" radius={radii.xl} style={styles.card}>
        <View style={styles.statusRow}>
          <AppText variant="bodyStrong">Status</AppText>
          <Chip
            label={settled ? 'Settled' : 'Pending'}
            tone={settled ? 'success' : 'warning'}
            icon={settled ? 'checkmark-circle' : 'time-outline'}
          />
        </View>
        <AppText
          variant="bodyStrong"
          color={view.youOwe ? tones.danger.fg : colors.textHeading}
          style={styles.you}
        >
          {view.youLine}
        </AppText>
        {view.subLine ? <AppText variant="caption">{view.subLine}</AppText> : null}
      </ClaySurface>

      <ClaySurface variant="raised" radius={radii.xl} style={styles.card}>
        <AppText variant="headline">Paid by</AppText>
        <View style={styles.lines}>
          {expense.payers.map((payer) => (
            <View key={payer.memberId} style={styles.personRow}>
              <Avatar name={nameOf(payer.memberId)} size={40} />
              <AppText variant="bodyStrong" style={styles.personName} numberOfLines={1}>
                {nameOf(payer.memberId)}
              </AppText>
              <AppText variant="amount">{formatMoney(payer.paidPaise)}</AppText>
            </View>
          ))}
        </View>
      </ClaySurface>

      <ClaySurface variant="raised" radius={radii.xl} style={styles.card}>
        <View style={styles.statusRow}>
          <AppText variant="headline">Shares</AppText>
          <Chip label={SPLIT_METHOD_LABELS[expense.split.method]} tone="lavender" size="sm" />
        </View>
        <View style={styles.lines}>
          {expense.shares.map((share) => (
            <View key={share.memberId} style={styles.personRow}>
              <Avatar name={nameOf(share.memberId)} size={40} />
              <AppText variant="bodyStrong" style={styles.personName} numberOfLines={1}>
                {nameOf(share.memberId)}
              </AppText>
              <AppText variant="amount">{formatMoney(share.amountPaise)}</AppText>
            </View>
          ))}
        </View>
      </ClaySurface>

      {expense.note ? (
        <ClaySurface variant="panel" radius={radii.xl} style={styles.card}>
          <AppText variant="bodyStrong">Note</AppText>
          <AppText variant="caption" style={styles.note}>
            {expense.note}
          </AppText>
        </ClaySurface>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, flexWrap: 'wrap' },
  topText: { flex: 1, minWidth: 120, gap: 2 },
  total: { paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  card: { marginTop: 16, padding: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  you: { marginTop: 14, fontSize: 17 },
  lines: { marginTop: 12, gap: 12 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  personName: { flex: 1 },
  note: { marginTop: 6 },
  footer: { flexDirection: 'row', gap: 12 },
  footerButton: { flex: 1 },
});
