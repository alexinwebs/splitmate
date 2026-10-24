import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { ClaySurface } from './ClaySurface';
import { Icon, type IconName } from './Icon';
import { colors, tones } from './tokens';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger';
type Size = 'lg' | 'md' | 'sm';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  /** Optional second line (e.g. "Let others pay you"). Left-aligns the content. */
  description?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const SIZES: Record<Size, { height: number; radius: number; px: number }> = {
  lg: { height: 60, radius: 22, px: 20 },
  md: { height: 52, radius: 20, px: 18 },
  sm: { height: 38, radius: 14, px: 14 },
};

const PALETTE: Record<
  Variant,
  { bg: string; fg: string; border?: string; elevation: 'none' | 'sm' | 'md' }
> = {
  primary: { bg: colors.primary, fg: colors.textOnPrimary, elevation: 'md' },
  secondary: { bg: colors.panel, fg: tones.lavender.fg, elevation: 'none' },
  outline: { bg: colors.surface, fg: tones.lavender.fg, border: '#D9CCF7', elevation: 'none' },
  danger: { bg: tones.danger.bg, fg: tones.danger.fg, elevation: 'none' },
};

export function ClayButton({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconRight,
  description,
  disabled = false,
  loading = false,
  style,
  testID,
}: Props) {
  const s = SIZES[size];
  const p = PALETTE[variant];
  const iconSize = size === 'sm' ? 18 : 22;

  return (
    <ClaySurface
      variant="raised"
      tone={p.bg}
      radius={s.radius}
      elevation={p.elevation}
      onPress={loading ? undefined : onPress}
      disabled={disabled}
      accessibilityLabel={label}
      testID={testID}
      style={[
        styles.base,
        { minHeight: s.height, paddingHorizontal: s.px },
        description ? styles.left : styles.center,
        p.border ? { borderColor: p.border } : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <>
          {icon ? (
            <View style={styles.iconLeft}>
              <Icon name={icon} size={iconSize} color={p.fg} />
            </View>
          ) : null}
          <View style={description ? styles.textCol : undefined}>
            <AppText
              variant="button"
              color={p.fg}
              style={size === 'sm' ? styles.labelSm : undefined}
            >
              {label}
            </AppText>
            {description ? (
              <AppText variant="small" color={p.fg} style={styles.desc}>
                {description}
              </AppText>
            ) : null}
          </View>
          {iconRight ? (
            <View style={styles.iconRight}>
              <Icon name={iconRight} size={iconSize} color={p.fg} />
            </View>
          ) : null}
        </>
      )}
    </ClaySurface>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center' },
  center: { justifyContent: 'center' },
  left: { justifyContent: 'flex-start' },
  iconLeft: { marginRight: 10 },
  iconRight: { marginLeft: 10 },
  textCol: { flexShrink: 1 },
  labelSm: { fontSize: 14, lineHeight: 18 },
  desc: { opacity: 0.8, marginTop: 1 },
});
