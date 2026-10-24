import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  ClaySurface,
  IconTile,
  colors,
  radii,
  type IconName,
  type ToneName,
} from '../design';

type Stat = {
  icon: IconName;
  tone: ToneName;
  value: string;
  label: string;
};

type Props = {
  items: Stat[];
  variant?: 'raised' | 'panel';
};

export function StatStrip({ items, variant = 'raised' }: Props) {
  return (
    <ClaySurface variant={variant} radius={radii.xl} style={styles.strip}>
      {items.map((item, i) => (
        <Fragment key={item.label}>
          {i > 0 ? <View style={styles.divider} /> : null}
          <View
            accessible
            accessibilityLabel={`${item.label}: ${item.value}`}
            style={styles.cell}
          >
            <IconTile icon={item.icon} tone={item.tone} size={48} />
            <AppText variant="amount" style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
              {item.value}
            </AppText>
            <AppText variant="caption" numberOfLines={1}>
              {item.label}
            </AppText>
          </View>
        </Fragment>
      ))}
    </ClaySurface>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 6 },
  cell: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  value: { fontSize: 20, lineHeight: 26 },
  divider: { width: 1, height: 64, backgroundColor: colors.divider },
});
