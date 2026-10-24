import { Text, type TextProps, type TextStyle } from 'react-native';

import { typography, type TextVariant } from './tokens';

type Props = TextProps & {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
};

export function AppText({ variant = 'body', color, align, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        color ? { color } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
