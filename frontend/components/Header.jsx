import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const Header = ({ title = 'DISASTER RESPONSE' }) => {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const router = useRouter();

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'admin':
        return { label: 'HQ ADMIN', bg: 'bg-purple-900', text: 'text-purple-300' };
      case 'responder':
        return { label: 'VOLUNTEER', bg: 'bg-blue-900', text: 'text-blue-300' };
      default:
        return { label: 'CITIZEN', bg: 'bg-slate-800', text: 'text-slate-300' };
    }
  };

  const badge = getRoleBadge();

  return (
    <View className="bg-[#0E1F4D] px-4 pt-3 pb-3 border-b border-slate-800 flex-row justify-between items-center">
      <View className="flex-row items-center space-x-2">
        <View className="w-8 h-8 rounded-full bg-red-600 justify-center items-center mr-2">
          <Ionicons name="shield-checkmark" size={18} color="white" />
        </View>
        <View>
          <Text className="text-white font-extrabold text-base tracking-wider">{title}</Text>
          <View className="flex-row items-center">
            <View
              className={`w-2 h-2 rounded-full mr-1.5 ${
                isConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <Text className="text-slate-400 text-xs">
              {isConnected ? 'LIVE FEED SYNCED' : 'CONNECTING...'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/(tabs)/profile')}
        className={`px-2.5 py-1 rounded-full border border-slate-700 ${badge.bg}`}
      >
        <Text className={`text-xs font-bold ${badge.text}`}>
          {badge.label}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
