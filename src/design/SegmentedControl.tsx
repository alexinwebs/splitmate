import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { ClaySurface } from './ClaySurface';
import { colors, tones } from './tokens';

type Props<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <ClaySurface variant="panel" radius={20} style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option === value;
        const label = (
          <AppText
            variant="bodyStrong"
            color={selected ? tones.lavender.fg : colors.textSecondary}
            style={selected ? undefined : styles.unselected}
          >
            {option}
          </AppText>
        );
        if (selected) {
          return (
            <ClaySurface
              key={option}
              variant="raised"
              tone={colors.segmentSelected}
              radius={16}
              elevation="sm"
              selected
              accessibilityRole="tab"
              accessibilityLabel={option}
              onPress={() => onChange(option)}
              style={styles.segment}
            >
              {label}
            </ClaySurface>
          );
        }
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityLabel={option}
            accessibilityState={{ selected: false }}
            onPress={() => onChange(option)}
            style={styles.segment}
          >
            <View>{label}</View>
          </Pressable>
        );
      })}
    </ClaySurface>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 5 },
  segment: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselected: { fontFamily: 'PlusJakartaSans_500Medium' },
});
