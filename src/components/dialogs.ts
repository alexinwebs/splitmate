import { Alert, Platform } from 'react-native';

// react-native's Alert is a no-op on web, so use the browser dialogs there.
const web = globalThis as unknown as {
  alert?: (message: string) => void;
  confirm?: (message: string) => boolean;
};

export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    web.alert?.(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
};

export function confirmAction({
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
}: ConfirmOptions): void {
  if (Platform.OS === 'web') {
    if (web.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
