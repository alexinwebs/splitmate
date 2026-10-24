import { IconTile, type IconName, type ToneName } from '../design';
import type { ExpenseCategory } from '../domain/models';

const MAP: Record<ExpenseCategory, { icon: IconName; tone: ToneName }> = {
  food: { icon: 'restaurant-outline', tone: 'peach' },
  groceries: { icon: 'basket-outline', tone: 'mint' },
  shopping: { icon: 'bag-handle-outline', tone: 'blue' },
  travel: { icon: 'car-outline', tone: 'yellow' },
  entertainment: { icon: 'film-outline', tone: 'pink' },
  bills: { icon: 'flash-outline', tone: 'lavender' },
  other: { icon: 'receipt-outline', tone: 'lavender' },
};

type Props = {
  category: ExpenseCategory;
  size?: number;
};

/** Neutral category tile used instead of merchant brand logos. */
export function MerchantTile({ category, size = 56 }: Props) {
  const m = MAP[category];
  return <IconTile icon={m.icon} tone={m.tone} size={size} elevated />;
}
