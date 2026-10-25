import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SettingsRow } from '../../components/SettingsRow';
import { StatStrip } from '../../components/StatStrip';
import {
  AppText,
  Avatar,
  ClaySurface,
  Icon,
  Screen,
  ScreenHeader,
  colors,
  radii,
  type IconName,
  type ToneName,
} from '../../design';
import { SETTINGS_SECTIONS } from '../../data/settingsSections';
import { useAppState } from '../../data/store';
import { formatMoney } from '../../domain/money';

type Row = {
  key: string;
  icon: IconName;
  tone: ToneName;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { expenses, groups, me } = useAppState();
  const totalSplitPaise = expenses.reduce((sum, e) => sum + e.totalPaise, 0);

  const openSection = (key: string) => {
    if (key === 'personal') {
      router.push('/profile/edit');
    } else {
      router.push({ pathname: '/settings/[section]', params: { section: key } });
    }
  };

  const rows: Row[] = [
    {
      key: 'activity',
      icon: 'pulse-outline',
      tone: 'blue',
      title: 'Activity',
      subtitle: 'Recent changes across your groups',
      onPress: () => router.push('/activity'),
    },
    ...SETTINGS_SECTIONS.map((section) => ({
      key: section.key,
      icon: section.icon,
      tone: section.tone,
      title: section.title,
      subtitle: section.subtitle,
      onPress: () => openSection(section.key),
    })),
  ];

  return (
    <Screen
      tabBar
      header={<ScreenHeader title="Profile" subtitle="Manage your account and preferences" />}
    >
      <ClaySurface
        variant="panel"
        tone={colors.panel}
        radius={radii.xl}
        onPress={() => openSection('personal')}
        accessibilityLabel={`${me.name}. Edit profile`}
        style={styles.header}
      >
        <Avatar name={me.name} size={84} />
        <View style={styles.headerText}>
          <AppText variant="title">{me.name}</AppText>
          <AppText variant="caption">Local profile · stored on this device</AppText>
        </View>
        <Icon name="chevron-forward" size={22} />
      </ClaySurface>

      <View style={styles.block}>
        <StatStrip
          items={[
            {
              icon: 'document-text-outline',
              tone: 'lavender',
              value: String(expenses.length),
              label: 'Total Bills',
            },
            {
              icon: 'people-outline',
              tone: 'lavender',
              value: String(groups.length),
              label: 'Total Groups',
            },
            {
              icon: 'cash-outline',
              tone: 'mint',
              value: formatMoney(totalSplitPaise),
              label: 'Total Split',
            },
          ]}
        />
      </View>

      <ClaySurface variant="raised" radius={radii.xl} style={[styles.block, styles.rows]}>
        {rows.map((row, i) => (
          <SettingsRow
            key={row.key}
            icon={row.icon}
            tone={row.tone}
            title={row.title}
            subtitle={row.subtitle}
            showDivider={i < rows.length - 1}
            onPress={row.onPress}
          />
        ))}
      </ClaySurface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 16 },
  headerText: { flex: 1, gap: 2 },
  block: { marginTop: 16 },
  rows: { paddingHorizontal: 14, paddingVertical: 2 },
});
