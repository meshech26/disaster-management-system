import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { getHomeRoute } from '../utils/authRoute';

export default function Index() {
  const { user, token, isLoading } = useAuth();

  if (!isLoading) {
    return <Redirect href={user && token ? getHomeRoute(user.role) : '/(auth)/login'} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0E1F4D', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#EF4444" />
    </View>
  );
}
