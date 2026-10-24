import { StyleSheet, View } from 'react-native';

import { AppText, ClaySurface, Icon, radii } from '../design';
import { relativeDateLabel } from '../domain/date';
import { formatMoney } from '../domain/money';
import type { Bill } from '../domain/types';
import { MerchantTile } from './MerchantTile';

type Props = {
  bill: Bill;
  onPress: () => void;
};

/** Compact bill row used on Home. */
export function ExpenseRow({ bill, onPress }: Props) {
  const meta = `${relativeDateLabel(bill.date)} · ${bill.memberNames.length} members`;
  return (
    <ClaySurface
      variant="raised"
      radius={radii.lg}
      onPress={onPress}
      accessibilityLabel={`${bill.title}, ${formatMoney(bill.totalPaise)}, ${meta}`}
      style={styles.row}
    >
      <MerchantTile category={bill.category} size={56} />
      <View style={styles.text}>
        <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
          {bill.title}
        </AppText>
        <AppText variant="caption" numberOfLines={1}>
          {meta}
        </AppText>
      </View>
      <AppText variant="amount">{formatMoney(bill.totalPaise)}</AppText>
      <Icon name="chevron-forward" size={20} />
    </ClaySurface>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  text: { flex: 1 },
  title: { fontSize: 16 },
});
