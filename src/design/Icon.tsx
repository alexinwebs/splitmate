import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { colors } from './tokens';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 22, color = colors.textHeading }: Props) {
  return <Ionicons name={name} size={size} color={color} />;
}
