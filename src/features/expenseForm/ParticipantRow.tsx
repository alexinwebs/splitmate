import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Avatar, ClaySurface, Icon, colors, fonts, tones } from '../../design';
import type { FormMethod } from './formLogic';

type Props = {
  name: string;
  selected: boolean;
  onToggle: () => void;
  method: FormMethod;
  /** Text shown in the input for exact, percent and shares splits. */
  value: string;
  onChangeValue: (text: string) => void;
  /** This person's computed share, e.g. "₹100", when the split is valid. */
  shareLabel: string | null;
  /** The remainder suggested for this person's empty field (exact and percent). */
  autoText?: string;
  error?: string;
  showDivider: boolean;
};

export function ParticipantRow({
  name,
  selected,
  onToggle,
  method,
  value,
  onChangeValue,
  shareLabel,
  autoText,
  error,
  showDivider,
}: Props) {
  const placeholder = autoText ?? (method === 'shares' ? '1' : '0');
  return (
    <View style={[styles.wrap, showDivider ? styles.divider : null]}>
      <View style={styles.row}>
        <Pressable
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityLabel={name}
          accessibilityState={{ checked: selected }}
          style={styles.left}
        >
          <View style={[styles.check, selected ? styles.checkOn : styles.checkOff]}>
            {selected ? <Icon name="checkmark" size={16} color="#FFFFFF" /> : null}
          </View>
          <Avatar name={name} size={40} />
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.name}>
            {name}
          </AppText>
        </Pressable>

        {selected && method === 'equal' && shareLabel ? (
          <AppText variant="amount">{shareLabel}</AppText>
        ) : null}

        {selected && method !== 'equal' ? (
          <View style={styles.right}>
            <ClaySurface variant="inset" radius={12} style={styles.inputBox}>
              {method === 'exact' ? (
                <AppText variant="bodyStrong" color={colors.textSecondary}>
                  ₹
                </AppText>
              ) : null}
              <TextInput
                value={value}
                onChangeText={onChangeValue}
                keyboardType={method === 'shares' ? 'number-pad' : 'decimal-pad'}
                placeholder={placeholder}
                placeholderTextColor={autoText ? colors.link : colors.textMuted}
                selectionColor={colors.fab}
                accessibilityLabel={`${name} ${
                  method === 'exact' ? 'amount' : method === 'percent' ? 'percentage' : 'shares'
                }${autoText ? `, automatically ${autoText}` : ''}`}
                style={[styles.input, autoText && value.length === 0 ? styles.inputAuto : null]}
              />
              {method === 'percent' ? (
                <AppText variant="bodyStrong" color={colors.textSecondary}>
                  %
                </AppText>
              ) : null}
            </ClaySurface>
            {autoText ? (
              <AppText variant="small" color={colors.link} style={styles.shareLabel}>
                auto-filled · tap to change
              </AppText>
            ) : null}
            {method !== 'exact' && shareLabel ? (
              <AppText variant="small" style={styles.shareLabel}>
                {shareLabel}
              </AppText>
            ) : null}
          </View>
        ) : null}
      </View>
      {error ? (
        <AppText variant="small" color={tones.danger.fg} style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1 },
  check: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.checkFill },
  checkOff: { borderWidth: 2, borderColor: '#D8D2E6' },
  right: { alignItems: 'flex-end', gap: 2 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    minHeight: 40,
    minWidth: 96,
  },
  input: {
    minWidth: 52,
    textAlign: 'right',
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.textHeading,
    paddingVertical: 6,
  },
  inputAuto: { fontFamily: fonts.bold },
  shareLabel: { marginRight: 4 },
  error: { marginTop: 4, marginLeft: 36 },
});
