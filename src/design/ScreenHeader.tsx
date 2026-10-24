import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { ClaySurface } from './ClaySurface';
import { Icon } from './Icon';
import { layout } from './tokens';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, onBack, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {onBack ? (
          <ClaySurface
            variant="raised"
            radius={23}
            onPress={onBack}
            accessibilityLabel="Go back"
            style={styles.circle}
          >
            <Icon name="chevron-back" size={22} />
          </ClaySurface>
        ) : null}
      </View>
      <View style={styles.center}>
        <AppText variant="title" align="center" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="subtitle" align="center" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: 8,
    paddingBottom: 14,
  },
  side: { width: 48 },
  sideRight: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  circle: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
});
