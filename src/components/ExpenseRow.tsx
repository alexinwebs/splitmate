import { StyleSheet, View } from 'react-native';

import { AppText, ClaySurface, Icon, radii } from '../design';
import { relativeDateLabel } from '../domain/date';
import { formatMoney } from '../domain/money';
import type { ExpenseView } from '../domain/views';
import { MerchantTile } from './MerchantTile';

type Props = {
  view: ExpenseView;
  onPress: () => void;
};

/** Compact expense row used on Home and in group details. */
export function ExpenseRow({ view, onPress }: Props) {
  const { expense } = view;
  const count = view.participantCount;
  const meta = `${relativeDateLabel(expense.date)} · ${count} ${count === 1 ? 'member' : 'members'}`;
  return (
    <ClaySurface
      variant="raised"
      radius={radii.lg}
      onPress={onPress}
      accessibilityLabel={`${expense.title}, ${formatMoney(expense.totalPaise)}, ${meta}`}
      style={styles.row}
    >
      <MerchantTile category={expense.category} size={56} />
      <View style={styles.text}>
        <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
          {expense.title}
        </AppText>
        <AppText variant="caption" numberOfLines={1}>
          {meta}
        </AppText>
      </View>
      <AppText variant="amount">{formatMoney(expense.totalPaise)}</AppText>
      <Icon name="chevron-forward" size={20} />
    </ClaySurface>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  text: { flex: 1 },
  title: { fontSize: 16 },
});
