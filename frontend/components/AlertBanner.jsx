import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const AlertBanner = ({ alert, onDismiss }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="bg-red-950 border-l-4 border-l-red-500 border-y border-r border-red-900/60 p-3 mx-4 my-2 rounded-r-xl shadow-lg">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <Ionicons name="warning" size={24} color="#EF4444" />
          <View className="ml-2 flex-1">
            <View className="flex-row items-center">
              <Text className="text-red-400 font-extrabold text-xs uppercase tracking-widest mr-2">
                EMERGENCY BROADCAST
              </Text>
            </View>
            <Text className="text-white font-bold text-sm" numberOfLines={expanded ? undefined : 2}>
              {alert.title}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={onDismiss} className="p-1">
          <Ionicons name="close" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <Text className="text-slate-300 text-xs mt-2" numberOfLines={expanded ? undefined : 2}>
        {alert.message}
      </Text>

      {expanded && alert.actionInstructions && alert.actionInstructions.length > 0 && (
        <View className="mt-3 bg-red-900/30 p-2.5 rounded-lg border border-red-800/40">
          <Text className="text-red-300 font-semibold text-xs mb-1">
            IMMEDIATE ACTIONS REQUIRED:
          </Text>
          {alert.actionInstructions.map((inst, index) => (
            <Text key={index} className="text-slate-200 text-xs mt-0.5">
              • {inst}
            </Text>
          ))}
        </View>
      )}

      {alert.emergencyHotlines && alert.emergencyHotlines.length > 0 && (
        <View className="mt-2 flex-row flex-wrap items-center">
          <Text className="text-xs text-red-400 font-bold mr-1">Hotlines:</Text>
          {alert.emergencyHotlines.map((h, i) => (
            <Text key={i} className="text-xs text-slate-300 mr-2 font-mono">
              {h.name}: {h.phone}
            </Text>
          ))}
        </View>
      )}

      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className="mt-2 self-start"
      >
        <Text className="text-red-400 text-xs font-semibold">
          {expanded ? '▲ Collapse Advisory' : '▼ Read Full Emergency Advisory'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
