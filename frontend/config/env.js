import { Platform } from 'react-native';

const getLocalHost = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  return 'http://localhost:5000';
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getLocalHost();
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || getLocalHost();
