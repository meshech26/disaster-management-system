import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getHomeRoute } from '../../utils/authRoute';

export default function AuthLayout() {
  const { user, token, isLoading } = useAuth();

  // Navigate only after React has received the complete saved session.
  // This also prevents returning to sign-in while already authenticated.
  if (!isLoading && user && token) {
    return <Redirect href={getHomeRoute(user.role)} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0E1F4D' }
      }}
    />
  );
}
