import { IconTile, type IconName, type ToneName } from '../design';
import type { BillCategory } from '../domain/types';

const MAP: Record<BillCategory, { icon: IconName; tone: ToneName }> = {
  food: { icon: 'restaurant-outline', tone: 'peach' },
  shopping: { icon: 'bag-handle-outline', tone: 'blue' },
  grocery: { icon: 'basket-outline', tone: 'mint' },
  other: { icon: 'receipt-outline', tone: 'lavender' },
};

type Props = {
  category: BillCategory;
  size?: number;
};

/** Neutral category tile used instead of merchant brand logos. */
export function MerchantTile({ category, size = 56 }: Props) {
  const m = MAP[category];
  return <IconTile icon={m.icon} tone={m.tone} size={size} elevated />;
}
