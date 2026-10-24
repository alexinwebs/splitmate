import { StyleSheet, View } from 'react-native';

import { ClaySurface, Icon, colors, tones } from '../design';

type Props = {
  size?: number;
  onPress?: () => void;
};

/** Placeholder group picture (real photos arrive with the image picker, Phase 4). */
export function GroupPhoto({ size = 104, onPress }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <ClaySurface
        variant="flat"
        tone="#EFE6FE"
        radius={Math.round(size * 0.3)}
        elevation="md"
        style={[styles.tile, { width: size, height: size }]}
      >
        <Icon name="people" size={Math.round(size * 0.5)} color={tones.lavender.solid} />
      </ClaySurface>
      <ClaySurface
        variant="flat"
        tone={colors.checkFill}
        radius={18}
        elevation="sm"
        onPress={onPress}
        accessibilityLabel="Add group photo"
        style={styles.badge}
      >
        <Icon name="camera" size={18} color="#FFFFFF" />
      </ClaySurface>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
