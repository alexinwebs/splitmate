import { StyleSheet, View } from 'react-native';

import { AppText, ClaySurface, Icon, IconTile, radii } from '../design';

type Props = {
  name: string;
  memberCount: number;
  billCount: number;
  onPress: () => void;
};

export function GroupRow({ name, memberCount, billCount, onPress }: Props) {
  const meta = `${memberCount} ${memberCount === 1 ? 'member' : 'members'} · ${billCount} ${
    billCount === 1 ? 'bill' : 'bills'
  }`;
  return (
    <ClaySurface
      variant="raised"
      radius={radii.lg}
      onPress={onPress}
      accessibilityLabel={`${name}, ${meta}`}
      style={styles.row}
    >
      <IconTile icon="people" tone="lavender" size={56} elevated />
      <View style={styles.text}>
        <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
          {name}
        </AppText>
        <AppText variant="caption">{meta}</AppText>
      </View>
      <Icon name="chevron-forward" size={20} />
    </ClaySurface>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  text: { flex: 1 },
  title: { fontSize: 16 },
});
