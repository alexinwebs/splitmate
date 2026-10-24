import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { AppText } from './AppText';
import { ClaySurface } from './ClaySurface';
import { Icon, type IconName } from './Icon';
import { colors, fonts, radii } from './tokens';

type Props = Omit<TextInputProps, 'style'> & {
  label?: string;
  variant?: 'raised' | 'inset';
  leftIcon?: IconName;
  /** When provided, a clear (x) button shows while the field has text. */
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ClayInput({
  label,
  variant = 'raised',
  leftIcon,
  onClear,
  style,
  value,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const hasText = typeof value === 'string' && value.length > 0;

  return (
    <View>
      {label ? (
        <AppText variant="caption" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <ClaySurface
        variant={variant}
        radius={radii.md}
        style={[styles.field, focused ? styles.focused : null, style]}
      >
        {leftIcon ? (
          <View style={styles.leftIcon}>
            <Icon name={leftIcon} size={20} color={colors.textSecondary} />
          </View>
        ) : null}
        <TextInput
          {...rest}
          value={value}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.fab}
          style={styles.input}
        />
        {onClear && hasText ? (
          <Pressable
            onPress={onClear}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear text"
            style={styles.clear}
          >
            <Icon name="close" size={14} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </ClaySurface>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6, marginLeft: 4 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    paddingHorizontal: 16,
  },
  focused: { borderColor: '#BCA8F5' },
  leftIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.textHeading,
    paddingVertical: 12,
  },
  clear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#B8B3C4',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
