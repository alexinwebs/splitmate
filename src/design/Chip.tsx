import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { radii, tones, type ToneName } from './tokens';

type Props = {
  label: string;
  tone?: ToneName;
  icon?: IconName;
  size?: 'sm' | 'md';
};

export function Chip({ label, tone = 'lavender', icon, size = 'md' }: Props) {
  const t = tones[tone];
  const small = size === 'sm';
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[
        styles.chip,
        { backgroundColor: t.bg, paddingHorizontal: small ? 8 : 12, paddingVertical: small ? 3 : 6 },
      ]}
    >
      {icon ? <Icon name={icon} size={small ? 12 : 16} color={t.solid} /> : null}
      <AppText
        variant="small"
        color={t.fg}
        style={[styles.label, small ? styles.labelSm : null, icon ? styles.withIcon : null]}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
  },
  label: { fontSize: 13, lineHeight: 17 },
  labelSm: { fontSize: 11, lineHeight: 14 },
  withIcon: { marginLeft: 5 },
});
