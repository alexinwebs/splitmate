import { Tabs } from 'expo-router';

import { ClayTabBar } from '../../design/ClayTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <ClayTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="groups" options={{ title: 'Groups' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
