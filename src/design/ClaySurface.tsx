import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radii, shadows, type ShadowLevel } from './tokens';

export type SurfaceVariant = 'raised' | 'panel' | 'inset' | 'flat';

type Props = {
  variant?: SurfaceVariant;
  /** Overrides the variant background colour. */
  tone?: string;
  radius?: number;
  elevation?: ShadowLevel;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  testID?: string;
};

const VARIANT_DEFAULTS: Record<
  SurfaceVariant,
  { bg: string; radius: number; elevation: ShadowLevel }
> = {
  raised: { bg: colors.surface, radius: radii.lg, elevation: 'sm' },
  panel: { bg: colors.panel, radius: radii.xl, elevation: 'none' },
  inset: { bg: colors.inset, radius: radii.md, elevation: 'none' },
  flat: { bg: colors.surface, radius: radii.lg, elevation: 'none' },
};

/**
 * The single building block for every clay surface.
 * - outer view: background, hairline highlight border, token shadow
 * - overlay: soft top-left highlight and faint bottom-right tint (raised/panel),
 *   or a soft top inner shadow (inset)
 */
export function ClaySurface({
  variant = 'raised',
  tone,
  radius,
  elevation,
  style,
  children,
  onPress,
  disabled = false,
  selected,
  accessibilityLabel,
  accessibilityRole,
  testID,
}: Props) {
  const defaults = VARIANT_DEFAULTS[variant];
  const r = radius ?? defaults.radius;
  const level = elevation ?? defaults.elevation;

  const base: ViewStyle = {
    borderRadius: r,
    backgroundColor: tone ?? defaults.bg,
    borderWidth: 1,
    borderColor: variant === 'inset' ? 'rgba(255,255,255,0.9)' : colors.highlight,
    opacity: disabled ? 0.5 : 1,
  };
  const shadow = level === 'none' ? null : shadows[level];

  const overlay = (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: r, overflow: 'hidden' }]}
    >
      {variant === 'inset' ? (
        <LinearGradient
          colors={['rgba(98,72,170,0.14)', 'rgba(98,72,170,0)']}
          style={styles.insetShade}
        />
      ) : (
        <LinearGradient
          colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)', 'rgba(98,72,170,0.05)']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole={accessibilityRole ?? 'button'}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled, selected }}
        testID={testID}
        style={({ pressed }) => [base, shadow, style, pressed ? styles.pressed : null]}
      >
        {overlay}
        {children}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      testID={testID}
      style={[base, shadow, style]}
    >
      {overlay}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  insetShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 10,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
});
