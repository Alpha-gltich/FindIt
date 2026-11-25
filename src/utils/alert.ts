import { Alert, Platform } from 'react-native';

const isWeb = () => Platform.OS === 'web' && typeof window !== 'undefined';

/** Cross-platform message dialog. Native uses Alert; web uses window.alert. */
export function showAlert(title: string, message?: string): void {
  if (isWeb() && typeof window.alert === 'function') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }

  Alert.alert(title, message);
}

interface ConfirmOptions {
  confirmLabel?: string;
  destructive?: boolean;
}

/**
 * Cross-platform confirmation. Native uses Alert buttons; web uses window.confirm.
 * The callback only runs when the user confirms.
 */
export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  options: ConfirmOptions = {}
): void {
  const confirmLabel = options.confirmLabel || 'OK';

  if (isWeb() && typeof window.confirm === 'function') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: confirmLabel,
      style: options.destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}
