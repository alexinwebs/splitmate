import type { IconName, ToneName } from '../design';

export type SettingsSection = {
  key: string;
  title: string;
  subtitle: string;
  icon: IconName;
  tone: ToneName;
  plannedPhase: string;
  description: string;
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    key: 'personal',
    title: 'Personal Information',
    subtitle: 'Edit your name, phone number and email',
    icon: 'person-outline',
    tone: 'lavender',
    plannedPhase: 'Phase 3',
    description:
      'Edit your name, phone number and email. Your profile is stored only on this device.',
  },
  {
    key: 'payment',
    title: 'UPI ID & Payment Notes',
    subtitle: 'Save your UPI ID to share when settling up',
    icon: 'card-outline',
    tone: 'pink',
    plannedPhase: 'Phase 7',
    description:
      'Save your UPI ID and payment notes to share with friends when settling up. Splitzoa records settlements; it does not move money.',
  },
  {
    key: 'split',
    title: 'Default Split Settings',
    subtitle: 'Set how items are split by default',
    icon: 'swap-horizontal-outline',
    tone: 'lavender',
    plannedPhase: 'Phase 6',
    description:
      'Choose how shared charges such as tax, delivery and discounts are split by default.',
  },
  {
    key: 'notifications',
    title: 'Notifications',
    subtitle: 'Manage your notification preferences',
    icon: 'notifications-outline',
    tone: 'mint',
    plannedPhase: 'Phase 9',
    description: 'Reminders for pending settlements and recurring expenses.',
  },
  {
    key: 'privacy',
    title: 'Privacy & Data',
    subtitle: 'Control your data and privacy',
    icon: 'shield-outline',
    tone: 'pink',
    plannedPhase: 'Phase 9',
    description:
      'Receipts will be read on your device with on-device text recognition (Phase 5). Nothing is uploaded unless you turn on optional sync later.',
  },
  {
    key: 'help',
    title: 'Help & Support',
    subtitle: 'FAQs, contact support, give feedback',
    icon: 'help-circle-outline',
    tone: 'lavender',
    plannedPhase: 'Phase 9',
    description: 'FAQs, contact support and a way to send feedback.',
  },
];
