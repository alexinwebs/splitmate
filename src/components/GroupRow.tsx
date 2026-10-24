import { StyleSheet, View } from 'react-native';

import { AppText, ClaySurface, Icon, IconTile, radii } from '../design';
import type { Group } from '../domain/types';

type Props = {
  group: Group;
  onPress: () => void;
};

export function GroupRow({ group, onPress }: Props) {
  const meta = `${group.memberNames.length} members · ${group.billsSplit} bills`;
  return (
    <ClaySurface
      variant="raised"
      radius={radii.lg}
      onPress={onPress}
      accessibilityLabel={`${group.name}, ${meta}`}
      style={styles.row}
    >
      <IconTile icon="people" tone="lavender" size={56} elevated />
      <View style={styles.text}>
        <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
          {group.name}
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
