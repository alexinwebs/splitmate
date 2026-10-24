import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { AppText, ClayButton, ClaySurface, Screen, colors } from '../design';
import { appStore, useAppState } from '../data/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const state = useAppState();

  useEffect(() => {
    void appStore.init();
  }, []);

  const fontsSettled = fontsLoaded || fontError !== null;
  const dataSettled = state.status === 'ready' || state.status === 'error';

  useEffect(() => {
    if (fontsSettled && dataSettled) {
      void SplashScreen.hideAsync();
    }
  }, [fontsSettled, dataSettled]);

  if (!fontsSettled || !dataSettled) return null;

  if (state.status === 'error') {
    return (
      <Screen scroll={false} contentStyle={styles.errorWrap}>
        <ClaySurface variant="panel" style={styles.errorCard}>
          <AppText variant="headline">Couldn’t open your data</AppText>
          <AppText variant="caption" style={styles.errorText}>
            {state.error ?? 'Something went wrong while loading.'}
          </AppText>
          <ClayButton label="Try again" size="md" onPress={() => void appStore.init()} />
        </ClaySurface>
      </Screen>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="scan" />
        <Stack.Screen name="gallery" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  errorWrap: { justifyContent: 'center' },
  errorCard: { padding: 20, gap: 12 },
  errorText: { marginBottom: 4 },
});
