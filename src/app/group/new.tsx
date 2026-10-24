import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GroupPhoto } from '../../components/GroupPhoto';
import { MemberCheckRow } from '../../components/MemberCheckRow';
import { notify } from '../../components/dialogs';
import {
  AppText,
  ClayButton,
  ClayInput,
  ClaySurface,
  Screen,
  ScreenHeader,
  radii,
  tones,
} from '../../design';
import { SAMPLE_CONTACTS } from '../../data/sample';
import { createGroup } from '../../data/store';

const MAX_MEMBERS = 10; // including you

export default function CreateGroupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<string[]>(SAMPLE_CONTACTS);
  const [selected, setSelected] = useState<string[]>([]);

  const totalMembers = selected.length + 1; // you are always included
  const atLimit = totalMembers >= MAX_MEMBERS;
  const q = query.trim().toLowerCase();
  const filtered = contacts.filter((c) => c.toLowerCase().includes(q));
  const trimmedQuery = query.trim();
  const canAddNew =
    trimmedQuery.length > 0 && !contacts.some((c) => c.toLowerCase() === q);
  const canCreate = name.trim().length > 0 && selected.length >= 1;

  const toggle = (person: string) => {
    if (selected.includes(person)) {
      setSelected(selected.filter((p) => p !== person));
    } else if (!atLimit) {
      setSelected([...selected, person]);
    }
  };

  const addNew = () => {
    if (atLimit) return;
    setContacts([trimmedQuery, ...contacts]);
    setSelected([...selected, trimmedQuery]);
    setQuery('');
  };

  const onCreate = () => {
    const group = createGroup(name, selected);
    router.replace({ pathname: '/group/[id]', params: { id: group.id } });
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="Create Group"
          subtitle="Split bills with your friends"
          onBack={() => router.back()}
        />
      }
      footer={
        <ClayButton
          label={`Create Group (${selected.length})`}
          disabled={!canCreate}
          onPress={onCreate}
        />
      }
    >
      <View style={styles.photo}>
        <GroupPhoto
          onPress={() =>
            notify('Group photo', 'Choosing a group photo arrives with the image picker in Phase 4.')
          }
        />
        <AppText variant="caption" style={styles.photoLabel}>
          Add Group Photo
        </AppText>
      </View>

      <ClayInput
        label="Group Name"
        value={name}
        onChangeText={setName}
        onClear={() => setName('')}
        placeholder="e.g. Weekend Gang"
        maxLength={40}
        autoCapitalize="words"
      />

      <View style={styles.membersHeader}>
        <AppText variant="headline">Add Members</AppText>
        <AppText variant="subtitle" color={atLimit ? tones.danger.fg : undefined}>
          {totalMembers}/{MAX_MEMBERS}
        </AppText>
      </View>
      {atLimit ? (
        <AppText variant="small" color={tones.danger.fg} style={styles.limit}>
          Maximum of {MAX_MEMBERS} members reached.
        </AppText>
      ) : null}

      <ClayInput
        variant="inset"
        leftIcon="search-outline"
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery('')}
        placeholder="Search or add a person..."
      />

      <ClaySurface variant="raised" radius={radii.xl} style={styles.list}>
        {canAddNew ? (
          <MemberCheckRow
            name={`Add “${trimmedQuery}” as a new member`}
            selected={false}
            onPress={addNew}
            showDivider={filtered.length > 0}
          />
        ) : null}
        {filtered.map((person, i) => (
          <MemberCheckRow
            key={person}
            name={person}
            selected={selected.includes(person)}
            onPress={() => toggle(person)}
            showDivider={i < filtered.length - 1}
          />
        ))}
        {filtered.length === 0 && !canAddNew ? (
          <AppText variant="caption" style={styles.none}>
            No contacts found.
          </AppText>
        ) : null}
      </ClaySurface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { alignItems: 'center', marginBottom: 20 },
  photoLabel: { marginTop: 10 },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
  },
  limit: { marginBottom: 8 },
  list: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 2 },
  none: { padding: 16 },
});
