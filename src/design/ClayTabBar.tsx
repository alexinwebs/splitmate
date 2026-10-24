import { Tabs, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';
import { ClaySurface } from './ClaySurface';
import { Icon, type IconName } from './Icon';
import { colors, layout, shadows } from './tokens';

// Derived from the Tabs component itself so we don't depend on a direct
// @react-navigation/bottom-tabs import.
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TAB_CONFIG: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'Home', icon: 'home-outline', iconActive: 'home' },
  groups: { label: 'Groups', icon: 'people-outline', iconActive: 'people' },
  history: { label: 'History', icon: 'time-outline', iconActive: 'time' },
  profile: { label: 'Profile', icon: 'person-outline', iconActive: 'person' },
};

const LEFT = ['index', 'groups'] as const;
const RIGHT = ['history', 'profile'] as const;
const FAB_SIZE = 64;
const FAB_OVERLAP = 30;

export function ClayTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const activeName = state.routes[state.index]?.name;

  const renderTab = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    const config = TAB_CONFIG[name];
    if (!route || !config) return null;
    const focused = activeName === name;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name as never);
      }
    };

    return (
      <Pressable
        key={name}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityLabel={config.label}
        accessibilityState={{ selected: focused }}
        style={styles.tabItem}
      >
        <View style={[styles.tabInner, focused ? styles.tabInnerActive : null]}>
          <Icon
            name={focused ? config.iconActive : config.icon}
            size={24}
            color={focused ? colors.textHeading : colors.tabInactive}
          />
          <AppText
            variant="small"
            color={focused ? colors.textHeading : colors.tabInactive}
            style={focused ? styles.labelActive : undefined}
          >
            {config.label}
          </AppText>
        </View>
      </Pressable>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <ClaySurface variant="panel" radius={30} elevation="md" style={styles.bar}>
        <View style={styles.row}>
          {LEFT.map(renderTab)}
          <View style={styles.centerSlot}>
            <AppText variant="small" style={styles.fabLabel}>
              Scan Bill
            </AppText>
          </View>
          {RIGHT.map(renderTab)}
        </View>
      </ClaySurface>

      {/* The FAB lives inside the wrapper's bounds so Android delivers touches to it. */}
      <View pointerEvents="box-none" style={styles.fabLayer}>
        <Pressable
          onPress={() => router.push('/scan')}
          accessibilityRole="button"
          accessibilityLabel="Scan bill"
          style={({ pressed }) => [
            styles.fab,
            shadows.fab,
            pressed ? { transform: [{ scale: 0.95 }] } : null,
          ]}
        >
          <Icon name="add" size={36} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: FAB_SIZE - FAB_OVERLAP,
    paddingHorizontal: 16,
  },
  bar: { height: layout.tabBarHeight },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 68,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 22,
  },
  tabInnerActive: { backgroundColor: colors.panelDeep },
  labelActive: { fontFamily: 'PlusJakartaSans_700Bold' },
  centerSlot: { width: 76, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  fabLabel: { marginBottom: 10, color: colors.tabInactive },
  fabLayer: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.fab,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
