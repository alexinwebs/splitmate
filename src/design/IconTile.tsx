import { StyleSheet } from 'react-native';

import { ClaySurface } from './ClaySurface';
import { Icon, type IconName } from './Icon';
import { tones, type ToneName } from './tokens';

type Props = {
  icon: IconName;
  tone?: ToneName;
  size?: number;
  /** Adds the soft raised shadow used by the Home quick-action tiles. */
  elevated?: boolean;
};

export function IconTile({ icon, tone = 'lavender', size = 48, elevated = false }: Props) {
  const t = tones[tone];
  return (
    <ClaySurface
      variant="flat"
      tone={t.bg}
      radius={Math.round(size * 0.32)}
      elevation={elevated ? 'sm' : 'none'}
      style={[styles.tile, { width: size, height: size }]}
    >
      <Icon name={icon} size={Math.round(size * 0.48)} color={t.solid} />
    </ClaySurface>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
});
