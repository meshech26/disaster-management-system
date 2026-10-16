import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function TabsLayout() {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0E1F4D' }}>
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  if (!user || !token) {
    return <Redirect href="/(auth)/login" />;
  }

  const isCitizen = user?.role === 'citizen';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isCitizen
          ? { display: 'none' }
          : {
              backgroundColor: '#FFFFFF',
              borderTopColor: '#E2E8F0',
              borderTopWidth: 1,
              height: Platform.OS === 'ios' ? 92 : 76,
              paddingBottom: Platform.OS === 'ios' ? 24 : 8,
              paddingTop: 8,
              elevation: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.06,
              shadowRadius: 8
            },
        tabBarActiveTintColor: '#C81E1E',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 14,
          lineHeight: 21,
          fontWeight: '700',
          marginTop: -2
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={23}
              color={color}
            />
          )
        }}
      />
      <Tabs.Screen
        name="my-reports"
        options={{
          title: 'My Reports',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={23}
              color={color}
            />
          )
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={23}
              color={color}
            />
          )
        }}
      />
      {/* Hidden helper screens from tab bar */}
      <Tabs.Screen
        name="report"
        options={{
          href: null,
          title: 'Submit Report'
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          href: null,
          title: 'Map'
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: 'Profile'
        }}
      />
    </Tabs>
  );
}
