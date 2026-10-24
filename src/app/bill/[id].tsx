import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '../../components/EmptyState';
import { MerchantTile } from '../../components/MerchantTile';
import {
  AppText,
  AvatarStack,
  Chip,
  ClaySurface,
  Screen,
  ScreenHeader,
  colors,
  radii,
  tones,
} from '../../design';
import { useBill } from '../../data/store';
import { formatDate } from '../../domain/date';
import { formatMoney } from '../../domain/money';

export default function BillDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const bill = useBill(id);

  const header = (
    <ScreenHeader
      title="Bill Details"
      subtitle="Complete breakdown of your bill"
      onBack={() => router.back()}
    />
  );

  if (!bill) {
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

  const settled = bill.status === 'settled';

  return (
    <Screen header={header}>
      <ClaySurface variant="panel" radius={radii.xl} style={styles.top}>
        <MerchantTile category={bill.category} size={60} />
        <View style={styles.topText}>
          <AppText variant="headline" numberOfLines={1}>
            {bill.title}
          </AppText>
          <AppText variant="caption">
            {formatDate(bill.date)} · {bill.groupName}
          </AppText>
        </View>
        <ClaySurface variant="raised" tone="#FFFFFF" radius={16} style={styles.total}>
          <AppText variant="small">Total Amount</AppText>
          <AppText variant="amount">{formatMoney(bill.totalPaise)}</AppText>
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
          color={bill.youOwe ? tones.danger.fg : colors.textHeading}
          style={styles.you}
        >
          {bill.youLine}
        </AppText>
        <AppText variant="caption">{bill.subLine}</AppText>
        <View style={styles.people}>
          <AvatarStack names={bill.memberNames} max={6} size={36} />
          <AppText variant="caption">{bill.memberNames.length} people</AppText>
        </View>
      </ClaySurface>

      <ClaySurface variant="panel" radius={radii.xl} style={styles.card}>
        <AppText variant="bodyStrong">Item breakdown</AppText>
        <AppText variant="caption" style={styles.note}>
          Items, assignments and the full bill summary appear here once receipt scanning and item
          allocation are built (Phases 4–6).
        </AppText>
      </ClaySurface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, flexWrap: 'wrap' },
  topText: { flex: 1, minWidth: 120 },
  total: { paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  card: { marginTop: 16, padding: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  you: { marginTop: 14, fontSize: 17 },
  people: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  note: { marginTop: 6 },
});
