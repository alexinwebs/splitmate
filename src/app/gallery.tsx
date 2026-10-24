import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Avatar,
  AvatarStack,
  Chip,
  ClayButton,
  ClayInput,
  ClaySurface,
  Icon,
  IconTile,
  Screen,
  ScreenHeader,
  SegmentedControl,
  colors,
  radii,
  tones,
  type IconName,
  type ToneName,
  type TextVariant,
} from '../design';

const SEGMENTS = ['All Bills', 'Settled', 'Pending'] as const;

const SWATCHES: [string, string][] = [
  ['background', colors.background],
  ['surface', colors.surface],
  ['panel', colors.panel],
  ['panelDeep', colors.panelDeep],
  ['panelHero', colors.panelHero],
  ['inset', colors.inset],
  ['primary', colors.primary],
  ['fab', colors.fab],
  ['heading', colors.textHeading],
  ['secondary', colors.textSecondary],
];

const TYPE_SAMPLES: [TextVariant, string][] = [
  ['title', 'Settle Up'],
  ['headline', 'Group Members'],
  ['bodyStrong', 'Margherita Pizza'],
  ['body', 'Edit your name, phone number and email'],
  ['caption', '10 May 2025 · 6 items'],
  ['amount', '₹1,230'],
  ['amountLg', '₹420'],
];

const TILES: [IconName, ToneName][] = [
  ['camera-outline', 'yellow'],
  ['people-outline', 'blue'],
  ['document-text-outline', 'pink'],
  ['time-outline', 'mint'],
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="headline">{title}</AppText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function MemberRow({
  name,
  share,
  paid,
  status,
  amount,
  tone,
}: {
  name: string;
  share: string;
  paid: string;
  status: string;
  amount: string;
  tone: ToneName;
}) {
  const t = tones[tone];
  return (
    <ClaySurface variant="raised" style={styles.memberRow}>
      <Avatar name={name} size={52} />
      <View style={styles.memberText}>
        <AppText variant="bodyStrong">{name}</AppText>
        <AppText variant="caption">Your share: {share}</AppText>
        <AppText variant="caption">Paid: {paid}</AppText>
      </View>
      <View style={[styles.amountTile, { backgroundColor: t.bg }]}>
        <AppText variant="small" color={t.fg}>
          {status}
        </AppText>
        <AppText variant="amount" color={t.fg}>
          {amount}
        </AppText>
      </View>
    </ClaySurface>
  );
}

export default function GalleryScreen() {
  const router = useRouter();
  const [segment, setSegment] = useState<(typeof SEGMENTS)[number]>('All Bills');
  const [groupName, setGroupName] = useState('Weekend Gang');
  const [query, setQuery] = useState('');

  return (
    <Screen
      header={
        <ScreenHeader
          title="Design Gallery"
          subtitle="Compare with your references"
          onBack={() => router.back()}
        />
      }
    >
      <Section title="Colours">
        <View style={styles.swatchWrap}>
          {SWATCHES.map(([name, value]) => (
            <View key={name} style={styles.swatchItem}>
              <View style={[styles.swatch, { backgroundColor: value }]} />
              <AppText variant="small">{name}</AppText>
              <AppText variant="small" color={colors.textMuted}>
                {value}
              </AppText>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Typography (Plus Jakarta Sans)">
        {TYPE_SAMPLES.map(([variant, text]) => (
          <AppText key={variant} variant={variant}>
            {text}
          </AppText>
        ))}
      </Section>

      <Section title="Surfaces">
        <ClaySurface variant="raised" style={styles.sample}>
          <AppText variant="bodyStrong">Raised card</AppText>
          <AppText variant="caption">List rows and cards</AppText>
        </ClaySurface>
        <ClaySurface variant="panel" style={styles.sample}>
          <AppText variant="bodyStrong">Panel</AppText>
          <AppText variant="caption">Header cards, bill summary, tab bar</AppText>
        </ClaySurface>
        <ClaySurface variant="panel" tone={colors.panelHero} radius={radii.hero} style={styles.sample}>
          <AppText variant="bodyStrong">Hero panel</AppText>
          <AppText variant="caption">Home banner</AppText>
        </ClaySurface>
        <ClaySurface variant="inset" style={styles.sample}>
          <AppText variant="bodyStrong">Inset</AppText>
          <AppText variant="caption">Search fields and tracks</AppText>
        </ClaySurface>
      </Section>

      <Section title="Buttons">
        <ClayButton label="Save & Finish" iconRight="arrow-forward" onPress={() => {}} />
        <ClayButton label="Edit Items" variant="secondary" icon="create-outline" onPress={() => {}} />
        <ClayButton
          label="Show QR"
          description="Let others pay you"
          variant="secondary"
          icon="qr-code-outline"
          onPress={() => {}}
        />
        <ClayButton label="Log Out" variant="danger" icon="log-out-outline" onPress={() => {}} />
        <View style={styles.row}>
          <ClayButton label="Mark as Paid" variant="outline" size="sm" onPress={() => {}} />
          <ClayButton label="Settle All" variant="secondary" size="sm" onPress={() => {}} />
          <ClayButton label="Disabled" size="sm" disabled onPress={() => {}} />
        </View>
      </Section>

      <Section title="Inputs">
        <ClayInput
          label="Group Name"
          value={groupName}
          onChangeText={setGroupName}
          onClear={() => setGroupName('')}
          placeholder="Group name"
        />
        <ClayInput
          variant="inset"
          leftIcon="search-outline"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by restaurant, date or group..."
        />
      </Section>

      <Section title="Chips and tabs">
        <View style={styles.row}>
          <Chip label="Settled" tone="success" icon="checkmark-circle" />
          <Chip label="Pending" tone="warning" icon="time-outline" />
          <Chip label="You" tone="lavender" size="sm" />
        </View>
        <SegmentedControl options={SEGMENTS} value={segment} onChange={setSegment} />
      </Section>

      <Section title="Avatars and tiles">
        <View style={styles.row}>
          <Avatar name="Abbas Ansari" size={56} />
          <Avatar name="Aarav Sharma" size={56} />
          <Avatar name="Priya Singh" size={56} />
          <Avatar name="Karan Mehta" size={56} />
        </View>
        <AvatarStack names={['Abbas', 'Aarav', 'Priya', 'Karan', 'Rohan', 'Neha']} />
        <View style={styles.row}>
          {TILES.map(([icon, tone]) => (
            <IconTile key={icon} icon={icon} tone={tone} size={72} elevated />
          ))}
        </View>
        <View style={styles.row}>
          <Icon name="shield-checkmark-outline" size={28} />
          <Icon name="wallet-outline" size={28} />
          <Icon name="receipt-outline" size={28} />
          <Icon name="calculator-outline" size={28} />
        </View>
      </Section>

      <Section title="Reference recreation: Settle Up">
        <MemberRow name="Abbas" share="₹179" paid="₹58" status="You owe" amount="₹121" tone="danger" />
        <MemberRow name="Aarav" share="₹120" paid="₹120" status="Settled" amount="₹0" tone="success" />
        <MemberRow name="Priya" share="₹80" paid="₹0" status="Owes you" amount="₹80" tone="pink" />
        <ClaySurface variant="panel" style={styles.summary}>
          <View style={styles.summaryTop}>
            <IconTile icon="calculator-outline" tone="lavender" size={48} />
            <AppText variant="headline">Bill Summary</AppText>
          </View>
          <View style={styles.summaryFinal}>
            <AppText variant="bodyStrong">Final Amount (as per receipt)</AppText>
            <AppText variant="amount">₹420</AppText>
          </View>
        </ClaySurface>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 22 },
  sectionBody: { marginTop: 12, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  swatchWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatchItem: { width: 96 },
  swatch: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: 4,
  },
  sample: { padding: 16 },
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 14 },
  memberText: { flex: 1 },
  amountTile: { borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, minWidth: 104 },
  summary: { padding: 14, gap: 12 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.panelDeep,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
});
