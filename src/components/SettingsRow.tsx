import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, IconTile, colors, type IconName, type ToneName } from '../design';

type Props = {
  icon: IconName;
  tone: ToneName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
  showDivider?: boolean;
};

export function SettingsRow({
  icon,
  tone,
  title,
  subtitle,
  onPress,
  destructive = false,
  showDivider = true,
}: Props) {
  const color = destructive ? colors.destructive : colors.textHeading;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      style={({ pressed }) => [
        styles.row,
        showDivider ? styles.divider : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <IconTile icon={icon} tone={tone} size={48} />
      <View style={styles.text}>
        <AppText variant="bodyStrong" color={color} style={styles.title}>
          {title}
        </AppText>
        {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
      </View>
      <Icon name="chevron-forward" size={20} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  pressed: { opacity: 0.6 },
  text: { flex: 1 },
  title: { fontSize: 16 },
});
