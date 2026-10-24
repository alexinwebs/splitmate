import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Icon, colors } from '../design';

type Props = {
  name: string;
  selected: boolean;
  onPress: () => void;
  showDivider?: boolean;
};

export function MemberCheckRow({ name, selected, onPress, showDivider = true }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={name}
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.row,
        showDivider ? styles.divider : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Avatar name={name} size={46} />
      <AppText variant="bodyStrong" style={styles.name} numberOfLines={1}>
        {name}
      </AppText>
      <View style={[styles.check, selected ? styles.checkOn : styles.checkOff]}>
        {selected ? <Icon name="checkmark" size={18} color="#FFFFFF" /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  pressed: { opacity: 0.6 },
  name: { flex: 1, fontSize: 16 },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.checkFill },
  checkOff: { borderWidth: 2, borderColor: '#D8D2E6' },
});
