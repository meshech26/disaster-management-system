import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.role === 'duty_officer') {
          router.replace('/duty-officer');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [user, isLoading]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0E1F4D', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#EF4444" />
    </View>
  );
}
