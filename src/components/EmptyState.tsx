import { StyleSheet } from 'react-native';

import { AppText, ClayButton, ClaySurface, IconTile, type IconName } from '../design';

type Props = {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, message, actionLabel, onAction }: Props) {
  return (
    <ClaySurface variant="panel" style={styles.card}>
      <IconTile icon={icon} tone="lavender" size={72} elevated />
      <AppText variant="headline" align="center">
        {title}
      </AppText>
      <AppText variant="caption" align="center">
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <ClayButton label={actionLabel} size="md" onPress={onAction} style={styles.button} />
      ) : null}
    </ClaySurface>
  );
}

const styles = StyleSheet.create({
  card: { padding: 24, alignItems: 'center', gap: 10 },
  button: { marginTop: 8, alignSelf: 'stretch' },
});
