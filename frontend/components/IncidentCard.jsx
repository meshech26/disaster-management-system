import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { DISASTER_TYPES_CONFIG } from '../constants/disasterTypes';
import { formatTimeAgo, getSeverityBadgeInfo } from '../utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const IncidentCard = ({ incident }) => {
  const router = useRouter();
  const config = DISASTER_TYPES_CONFIG[incident.disasterType] || DISASTER_TYPES_CONFIG.other;
  const severity = getSeverityBadgeInfo(incident.severity);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/incident/${incident._id}`)}
      activeOpacity={0.7}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3 shadow-md"
    >
      {/* Header tags: Disaster type + Severity */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View
            className="w-7 h-7 rounded-lg justify-center items-center mr-2"
            style={{ backgroundColor: config.badgeBg }}
          >
            <Ionicons name={config.iconName} size={16} color={config.color} />
          </View>
          <Text className="text-white font-bold text-sm tracking-wide">
            {config.label}
          </Text>
        </View>

        <View
          className="px-2.5 py-0.5 rounded-full border"
          style={{
            backgroundColor: severity.bg,
            borderColor: severity.border
          }}
        >
          <Text
            className="text-xs font-black tracking-wider"
            style={{ color: severity.text }}
          >
            {severity.label}
          </Text>
        </View>
      </View>

      <Text className="text-white font-bold text-base mb-1" numberOfLines={1}>
        {incident.title}
      </Text>

      <Text className="text-slate-400 text-xs mb-3" numberOfLines={2}>
        {incident.description}
      </Text>

      {/* Incident Image Preview if available */}
      {incident.mediaUrls && incident.mediaUrls.length > 0 && (
        <Image
          source={{ uri: incident.mediaUrls[0].url }}
          className="w-full h-32 rounded-xl mb-3 bg-slate-800"
          resizeMode="cover"
        />
      )}

      {/* Footer details: Address, trapped count, time */}
      <View className="pt-2 border-t border-slate-800/80 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <Ionicons name="location-outline" size={14} color="#94A3B8" />
          <Text className="text-slate-400 text-xs ml-1 flex-1" numberOfLines={1}>
            {incident.location?.address || 'Location registered'}
          </Text>
        </View>

        <View className="flex-row items-center space-x-2">
          {(incident.peopleTrappedCount || 0) > 0 && (
            <View className="bg-red-950 px-2 py-0.5 rounded-md border border-red-800 mr-2">
              <Text className="text-red-400 text-xs font-bold">
                ⚠️ {incident.peopleTrappedCount} Trapped
              </Text>
            </View>
          )}

          <Text className="text-slate-500 text-xs">
            {formatTimeAgo(incident.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
