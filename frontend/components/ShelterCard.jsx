import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { formatDistance } from '../utils/formatters';
import { Ionicons } from '@expo/vector-icons';

export const ShelterCard = ({ shelter }) => {
  const occupancyPercent = Math.min(
    100,
    Math.round((shelter.currentOccupancy / (shelter.totalCapacity || 1)) * 100)
  );

  const getStatusColor = () => {
    switch (shelter.status) {
      case 'open':
        return { text: 'text-emerald-400', bg: 'bg-emerald-950', border: 'border-emerald-800' };
      case 'nearing_capacity':
        return { text: 'text-amber-400', bg: 'bg-amber-950', border: 'border-amber-800' };
      case 'full':
      default:
        return { text: 'text-red-400', bg: 'bg-red-950', border: 'border-red-800' };
    }
  };

  const statusStyle = getStatusColor();

  const handleOpenDirections = () => {
    const [lng, lat] = shelter.location.coordinates;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
      default: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
    });
    if (url) Linking.openURL(url);
  };

  const handleCall = () => {
    if (shelter.contactPhone) {
      Linking.openURL(`tel:${shelter.contactPhone}`);
    }
  };

  return (
    <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3 shadow-md">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-white font-bold text-base">{shelter.name}</Text>
          <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>
            {shelter.location.address}
          </Text>
        </View>

        <View className={`px-2.5 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.border}`}>
          <Text className={`text-xs font-bold uppercase ${statusStyle.text}`}>
            {shelter.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Capacity meter */}
      <View className="my-2">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-slate-400 text-xs">
            Occupancy: {shelter.currentOccupancy} / {shelter.totalCapacity} ({occupancyPercent}%)
          </Text>
          {shelter.distanceKm !== undefined && (
            <Text className="text-sky-400 text-xs font-semibold">
              📍 {formatDistance(shelter.distanceKm)} away
            </Text>
          )}
        </View>

        <View className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${
              occupancyPercent > 90
                ? 'bg-red-500'
                : occupancyPercent > 70
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </View>
      </View>

      {/* Facilities tags */}
      {shelter.facilities && shelter.facilities.length > 0 && (
        <View className="flex-row flex-wrap mt-2 mb-3">
          {shelter.facilities.map((fac, idx) => (
            <View key={idx} className="bg-slate-800/80 px-2 py-0.5 rounded-md mr-1.5 mb-1.5">
              <Text className="text-slate-300 text-xs">{fac}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action buttons */}
      <View className="flex-row pt-2 border-t border-slate-800/80 space-x-2">
        <TouchableOpacity
          onPress={handleOpenDirections}
          className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-xl flex-row justify-center items-center mr-2 border border-slate-700"
        >
          <Ionicons name="navigate" size={14} color="#38BDF8" style={{ marginRight: 6 }} />
          <Text className="text-sky-400 text-xs font-bold">Directions</Text>
        </TouchableOpacity>

        {shelter.contactPhone && (
          <TouchableOpacity
            onPress={handleCall}
            className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-xl flex-row justify-center items-center border border-slate-700"
          >
            <Ionicons name="call" size={14} color="#34D399" style={{ marginRight: 6 }} />
            <Text className="text-emerald-400 text-xs font-bold">Call Shelter</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
