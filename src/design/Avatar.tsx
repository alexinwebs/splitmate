import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { ClaySurface } from './ClaySurface';
import { colors, tones, type ToneName } from './tokens';

const AVATAR_TONES: ToneName[] = ['blue', 'peach', 'pink', 'mint', 'yellow', 'lavender'];

function toneFor(name: string): ToneName {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i);
  return AVATAR_TONES[sum % AVATAR_TONES.length];
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0].charAt(0);
  const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + second).toUpperCase();
}

type AvatarProps = {
  name: string;
  size?: number;
  tone?: ToneName;
};

export function Avatar({ name, size = 44, tone }: AvatarProps) {
  const t = tones[tone ?? toneFor(name)];
  return (
    <ClaySurface
      variant="flat"
      tone={t.bg}
      radius={size / 2}
      elevation="sm"
      accessibilityLabel={name}
      style={[styles.avatar, { width: size, height: size }]}
    >
      <AppText
        variant="bodyStrong"
        color={t.fg}
        style={{ fontSize: Math.round(size * 0.36), lineHeight: Math.round(size * 0.44) }}
      >
        {initialsOf(name)}
      </AppText>
    </ClaySurface>
  );
}

type StackProps = {
  names: string[];
  max?: number;
  size?: number;
};

export function AvatarStack({ names, max = 4, size = 40 }: StackProps) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <View style={styles.stack}>
      {shown.map((n, i) => (
        <View key={`${n}-${i}`} style={i === 0 ? null : { marginLeft: -size * 0.22 }}>
          <Avatar name={n} size={size} />
        </View>
      ))}
      {extra > 0 ? (
        <View
          style={[
            styles.more,
            { width: size, height: size, borderRadius: size / 2, marginLeft: -size * 0.22 },
          ]}
        >
          <AppText variant="small" color={colors.link} style={styles.moreText}>
            +{extra}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  stack: { flexDirection: 'row', alignItems: 'center' },
  more: {
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  moreText: { fontFamily: 'PlusJakartaSans_700Bold' },
});
