import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, colors } from '../design';

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <AppText variant="headline">{title}</AppText>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={styles.action}
        >
          <AppText variant="bodyStrong" color={colors.link}>
            {actionLabel}
          </AppText>
          <Icon name="chevron-forward" size={16} color={colors.link} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
