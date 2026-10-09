import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import EmergencyAlertModal from '../components/EmergencyAlertModal';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SocketProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0E1F4D' }
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="submit-report" options={{ headerShown: false }} />
            <Stack.Screen name="duty-officer" options={{ headerShown: false }} />
            <Stack.Screen name="dmc-officer" options={{ headerShown: false }} />
            <Stack.Screen name="district-officer" options={{ headerShown: false }} />
            <Stack.Screen name="rescue-team" options={{ headerShown: false }} />
            <Stack.Screen
              name="incident/[id]"
              options={{
                presentation: 'modal',
                headerShown: false
              }}
            />
          </Stack>
          <EmergencyAlertModal />
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
