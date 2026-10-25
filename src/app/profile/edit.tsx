import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { notify } from '../../components/dialogs';
import { AppText, Avatar, ClayButton, ClayInput, Screen, ScreenHeader } from '../../design';
import { appStore, useAppState } from '../../data/store';

export default function EditProfileScreen() {
  const router = useRouter();
  const { me } = useAppState();
  const [name, setName] = useState(me.name);
  const [busy, setBusy] = useState(false);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && trimmed !== me.name && !busy;

  const onSave = async () => {
    setBusy(true);
    try {
      await appStore.renameMe(name);
      router.back();
    } catch (error) {
      notify('Could not save', error instanceof Error ? error.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="Personal Information"
          subtitle="Edit your name"
          onBack={() => router.back()}
        />
      }
      footer={<ClayButton label="Save" disabled={!canSave} loading={busy} onPress={onSave} />}
    >
      <View style={styles.avatar}>
        <Avatar name={trimmed.length > 0 ? trimmed : me.name} size={96} />
      </View>
      <ClayInput
        label="Your name"
        value={name}
        onChangeText={setName}
        onClear={() => setName('')}
        maxLength={60}
        autoCapitalize="words"
        placeholder="Your name"
      />
      <AppText variant="small" style={styles.note}>
        Your name is stored only on this device.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', marginBottom: 24 },
  note: { marginTop: 10, marginLeft: 4 },
});
