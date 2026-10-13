import { Alert, Platform } from 'react-native';

// Alert.alert buttons don't work on web, so use window.confirm / window.alert there.
export function confirmDialog(title, message) {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Confirm', onPress: () => resolve(true) }
    ])
  );
}

export function infoDialog(title, message) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}
