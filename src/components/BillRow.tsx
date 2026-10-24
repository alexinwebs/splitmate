import { StyleSheet, View } from 'react-native';

import { AppText, AvatarStack, Chip, ClaySurface, Icon, colors, radii, tones } from '../design';
import { formatDate } from '../domain/date';
import { formatMoney } from '../domain/money';
import type { ExpenseView } from '../domain/views';
import { MerchantTile } from './MerchantTile';

type Props = {
  view: ExpenseView;
  onPress: () => void;
};

/** Full expense row used on History. */
export function BillRow({ view, onPress }: Props) {
  const { expense } = view;
  const settled = view.status === 'settled';
  const statusLabel = settled ? 'Settled' : 'Pending';
  return (
    <ClaySurface
      variant="raised"
      radius={radii.lg}
      onPress={onPress}
      accessibilityLabel={`${expense.title}, ${formatMoney(expense.totalPaise)}, ${statusLabel}, ${view.youLine}`}
      style={styles.card}
    >
      <View style={styles.top}>
        <MerchantTile category={expense.category} size={52} />
        <View style={styles.titleCol}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
            {expense.title}
          </AppText>
          <View style={styles.metaRow}>
            <AppText variant="caption">{formatDate(expense.date)}</AppText>
            <Icon name="people-outline" size={14} color={colors.textSecondary} />
            <AppText variant="caption" numberOfLines={1} style={styles.group}>
              {view.groupName}
            </AppText>
          </View>
        </View>
        <View style={styles.amountCol}>
          <AppText variant="amount">{formatMoney(expense.totalPaise)}</AppText>
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
        <AvatarStack names={view.memberNames} max={4} size={30} />
        <View style={styles.youCol}>
          <AppText
            variant="caption"
            color={view.youOwe ? tones.danger.fg : undefined}
            style={view.youOwe ? styles.owe : undefined}
          >
            {view.youLine}
          </AppText>
          {view.subLine ? <AppText variant="small">{view.subLine}</AppText> : null}
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
