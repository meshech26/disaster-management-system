import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { incidentService } from '../../services/incidentService';
import { useAuth } from '../../context/AuthContext';
import { DISASTER_TYPES_CONFIG } from '../../constants/disasterTypes';
import { formatTimeAgo, getSeverityBadgeInfo } from '../../utils/formatters';
import { Ionicons } from '@expo/vector-icons';

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadIncident(id);
    }
  }, [id]);

  const loadIncident = async (incidentId) => {
    try {
      const res = await incidentService.getIncidentById(incidentId);
      setIncident(res.data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load incident details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!incident) return;
    setUpdating(true);
    try {
      const res = await incidentService.updateStatus(incident._id, newStatus);
      setIncident(res.data);
      Alert.alert('Status Updated', `Incident status set to: ${newStatus.toUpperCase()}`);
    } catch (e) {
      Alert.alert('Update Failed', e.message);
    } finally {
      setUpdating(false);
    }
  };

  const openNavigation = () => {
    if (!incident) return;
    const [lng, lat] = incident.location.coordinates;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
      default: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
    });
    if (url) Linking.openURL(url);
  };

  if (loading || !incident) {
    return (
      <View className="flex-1 bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  const meta = DISASTER_TYPES_CONFIG[incident.disasterType] || DISASTER_TYPES_CONFIG.other;
  const severity = getSeverityBadgeInfo(incident.severity);
  const isResponderOrAdmin = user?.role === 'responder' || user?.role === 'admin';

  return (
    <View className="flex-1 bg-slate-950">
      {/* Top Navbar */}
      <View className="bg-slate-900 px-4 pt-4 pb-3 border-b border-slate-800 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="arrow-back" size={24} color="#94A3B8" />
          <Text className="text-slate-300 font-semibold text-xs ml-2">Back</Text>
        </TouchableOpacity>

        <View
          className="px-3 py-0.5 rounded-full border"
          style={{ backgroundColor: severity.bg, borderColor: severity.border }}
        >
          <Text className="text-xs font-black tracking-wider" style={{ color: severity.text }}>
            {severity.label}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Disaster Category Tag */}
        <View className="flex-row items-center mb-2">
          <Ionicons name={meta.iconName} size={20} color={meta.color} />
          <Text className="text-slate-300 font-bold text-sm ml-2 uppercase tracking-wide">
            {meta.label} Disaster Incident
          </Text>
        </View>

        <Text className="text-white text-2xl font-extrabold mb-2">
          {incident.title}
        </Text>

        <View className="flex-row items-center mb-4">
          <Text className="text-slate-500 text-xs mr-3">
            Reported {formatTimeAgo(incident.createdAt)} by {incident.reportedBy?.name || 'Citizen'}
          </Text>
          <View className="bg-slate-800 px-2 py-0.5 rounded-md">
            <Text className="text-slate-300 text-[10px] font-bold uppercase">
              STATUS: {incident.status}
            </Text>
          </View>
        </View>

        {/* Media Images */}
        {incident.mediaUrls && incident.mediaUrls.length > 0 && (
          <View className="mb-4">
            {incident.mediaUrls.map((media, i) => (
              <Image
                key={i}
                source={{ uri: media.url }}
                className="w-full h-56 rounded-2xl bg-slate-900 mb-2"
                resizeMode="cover"
              />
            ))}
          </View>
        )}

        {/* Situation Description */}
        <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            Situation Assessment
          </Text>
          <Text className="text-slate-200 text-sm leading-relaxed">
            {incident.description}
          </Text>
        </View>

        {/* Trapped People & Casualties */}
        <View className="bg-red-950/60 border border-red-900/60 rounded-2xl p-4 mb-4 flex-row justify-between items-center">
          <View>
            <Text className="text-red-400 font-extrabold text-xs uppercase tracking-wider">
              Trapped Civilians:
            </Text>
            <Text className="text-white text-xl font-black mt-0.5">
              {incident.peopleTrappedCount || 0} Reported Trapped
            </Text>
          </View>

          <TouchableOpacity
            onPress={openNavigation}
            className="bg-red-600 px-3.5 py-2.5 rounded-xl flex-row items-center"
          >
            <Ionicons name="navigate" size={16} color="white" style={{ marginRight: 6 }} />
            <Text className="text-white font-bold text-xs">Route GPS</Text>
          </TouchableOpacity>
        </View>

        {/* Immediate Needs */}
        {incident.immediateNeeds && incident.immediateNeeds.length > 0 && (
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              Critical Resources Required On Scene
            </Text>
            <View className="flex-row flex-wrap">
              {incident.immediateNeeds.map((need, idx) => (
                <View key={idx} className="bg-slate-800 px-3 py-1 rounded-xl mr-2 mb-2 border border-slate-700">
                  <Text className="text-sky-300 text-xs font-semibold">⚠️ {need}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Responder Operations Panel */}
        {isResponderOrAdmin && (
          <View className="bg-slate-900 border-2 border-sky-800/80 rounded-2xl p-4 mb-8">
            <Text className="text-sky-400 font-extrabold text-xs uppercase tracking-wider mb-3">
              🛡️ Responder Operations Control
            </Text>

            <View className="flex-row space-x-2 mb-3">
              {incident.status !== 'verified' && (
                <TouchableOpacity
                  onPress={() => handleUpdateStatus('verified')}
                  disabled={updating}
                  className="flex-1 bg-amber-600 py-2.5 rounded-xl items-center mr-2"
                >
                  <Text className="text-white font-bold text-xs">Verify Intel</Text>
                </TouchableOpacity>
              )}

              {incident.status !== 'in_progress' && (
                <TouchableOpacity
                  onPress={() => handleUpdateStatus('in_progress')}
                  disabled={updating}
                  className="flex-1 bg-sky-600 py-2.5 rounded-xl items-center mr-2"
                >
                  <Text className="text-white font-bold text-xs">Deploy Team</Text>
                </TouchableOpacity>
              )}

              {incident.status !== 'resolved' && (
                <TouchableOpacity
                  onPress={() => handleUpdateStatus('resolved')}
                  disabled={updating}
                  className="flex-1 bg-emerald-600 py-2.5 rounded-xl items-center"
                >
                  <Text className="text-white font-bold text-xs">Mark Resolved</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
