import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, ClaySurface, Screen, ScreenHeader } from '../design';

type Props = {
  title: string;
  subtitle: string;
  builtIn: string;
  children?: ReactNode;
};

/** Temporary screen body until the real screen is built in its phase. */
export function PlaceholderScreen({ title, subtitle, builtIn, children }: Props) {
  return (
    <Screen tabBar header={<ScreenHeader title={title} subtitle={subtitle} />}>
      <ClaySurface variant="panel" style={styles.card}>
        <AppText variant="headline">Placeholder</AppText>
        <AppText variant="caption" style={styles.text}>
          This screen is built in {builtIn}. The navigation shell and design system are ready.
        </AppText>
      </ClaySurface>
      <View style={styles.extra}>{children}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20 },
  text: { marginTop: 6 },
  extra: { marginTop: 16, gap: 12 },
});
