import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, colors, type IconName } from '../design';

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
  icon?: IconName;
};

type Props<T extends string> = {
  options: readonly ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

/** A wrapping row of pill buttons where exactly one option is selected. */
export function ChoiceChips<T extends string>({ options, value, onChange, disabled = false }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const selected = option.value === value;
        const fg = selected ? '#FFFFFF' : colors.textSecondary;
        return (
          <Pressable
            key={option.value}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected, disabled }}
            style={({ pressed }) => [
              styles.chip,
              selected ? styles.selected : styles.idle,
              pressed ? styles.pressed : null,
            ]}
          >
            {option.icon ? <Icon name={option.icon} size={16} color={fg} /> : null}
            <AppText variant="caption" color={fg} style={styles.label}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  idle: { backgroundColor: colors.panel, borderColor: colors.hairline },
  pressed: { opacity: 0.75 },
  label: { fontFamily: 'PlusJakartaSans_600SemiBold' },
});
