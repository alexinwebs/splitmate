import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout } from './tokens';

type Props = {
  children: ReactNode;
  header?: ReactNode;
  /** Pinned content under the scroll area (e.g. a primary CTA). */
  footer?: ReactNode;
  scroll?: boolean;
  /** True for screens inside the tab navigator: reserves space for the floating tab bar. */
  tabBar?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  header,
  footer,
  scroll = true,
  tabBar = false,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = tabBar ? layout.tabBarSpace : footer ? 12 : insets.bottom + 16;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {header}
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            { paddingHorizontal: layout.screenPadding, paddingBottom: bottomPad },
            contentStyle,
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.fill,
            { paddingHorizontal: layout.screenPadding, paddingBottom: bottomPad },
            contentStyle,
          ]}
        >
          {children}
        </View>
      )}
      {footer ? (
        <View
          style={{
            paddingHorizontal: layout.screenPadding,
            paddingTop: 8,
            paddingBottom: insets.bottom + 12,
          }}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
});
