import { StyleSheet, View } from 'react-native';

import { AppText, AvatarStack, Chip, ClaySurface, Icon, colors, radii, tones } from '../design';
import { formatDate } from '../domain/date';
import { formatMoney } from '../domain/money';
import type { Bill } from '../domain/types';
import { MerchantTile } from './MerchantTile';

type Props = {
  bill: Bill;
  onPress: () => void;
};

/** Full bill row used on History. */
export function BillRow({ bill, onPress }: Props) {
  const settled = bill.status === 'settled';
  const statusLabel = settled ? 'Settled' : 'Pending';
  return (
    <ClaySurface
      variant="raised"
      radius={radii.lg}
      onPress={onPress}
      accessibilityLabel={`${bill.title}, ${formatMoney(bill.totalPaise)}, ${statusLabel}, ${bill.youLine}`}
      style={styles.card}
    >
      <View style={styles.top}>
        <MerchantTile category={bill.category} size={52} />
        <View style={styles.titleCol}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
            {bill.title}
          </AppText>
          <View style={styles.metaRow}>
            <AppText variant="caption">{formatDate(bill.date)}</AppText>
            <Icon name="people-outline" size={14} color={colors.textSecondary} />
            <AppText variant="caption" numberOfLines={1} style={styles.group}>
              {bill.groupName}
            </AppText>
          </View>
        </View>
        <View style={styles.amountCol}>
          <AppText variant="amount">{formatMoney(bill.totalPaise)}</AppText>
          <View style={styles.chipWrap}>
            <Chip
              label={statusLabel}
              tone={settled ? 'success' : 'warning'}
              icon={settled ? 'checkmark-circle' : 'time-outline'}
              size="sm"
            />
          </View>
        </View>
        <Icon name="chevron-forward" size={18} />
      </View>
      <View style={styles.bottom}>
        <AvatarStack names={bill.memberNames} max={4} size={30} />
        <View style={styles.youCol}>
          <AppText
            variant="caption"
            color={bill.youOwe ? tones.danger.fg : undefined}
            style={bill.youOwe ? styles.owe : undefined}
          >
            {bill.youLine}
          </AppText>
          <AppText variant="small">{bill.subLine}</AppText>
        </View>
      </View>
    </ClaySurface>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleCol: { flex: 1 },
  title: { fontSize: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  group: { flexShrink: 1 },
  amountCol: { alignItems: 'flex-end', gap: 4 },
  chipWrap: { alignSelf: 'flex-end' },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 2,
  },
  youCol: { alignItems: 'flex-end' },
  owe: { fontFamily: 'PlusJakartaSans_700Bold' },
});
