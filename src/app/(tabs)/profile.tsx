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
} from '../../design';
import { SETTINGS_SECTIONS } from '../../data/settingsSections';
import { useAppState } from '../../data/store';
import { formatMoney } from '../../domain/money';

export default function ProfileScreen() {
  const router = useRouter();
  const { expenses, groups, me } = useAppState();
  const totalSplitPaise = expenses.reduce((sum, e) => sum + e.totalPaise, 0);

  const openSection = (key: string) =>
    router.push({ pathname: '/settings/[section]', params: { section: key } });

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
        {SETTINGS_SECTIONS.map((section, i) => (
          <SettingsRow
            key={section.key}
            icon={section.icon}
            tone={section.tone}
            title={section.title}
            subtitle={section.subtitle}
            showDivider={i < SETTINGS_SECTIONS.length - 1}
            onPress={() => openSection(section.key)}
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
