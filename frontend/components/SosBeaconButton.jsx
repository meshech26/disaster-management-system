import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSos } from '../hooks/useSos';
import { useLocation } from '../hooks/useLocation';

export const SosBeaconButton = () => {
  const { activeSos, isActivating, triggerSos, cancelSos } = useSos();
  const { location } = useLocation();
  const [modalVisible, setModalVisible] = useState(false);
  const [emergencyType, setEmergencyType] = useState('general_danger');
  const [peopleCount, setPeopleCount] = useState('1');
  const [notes, setNotes] = useState('');

  const handleTriggerQuickSos = async () => {
    try {
      await triggerSos({
        latitude: location.latitude,
        longitude: location.longitude,
        emergencyType,
        peopleCount: parseInt(peopleCount, 10) || 1,
        notes
      });
      setModalVisible(false);
    } catch (err) {
      Alert.alert('SOS Activation Failed', err.message || 'Please check your connection and try again.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Emergency SOS',
      'Are you sure you are safe and want to cancel the emergency beacon?',
      [
        { text: 'Keep SOS Active', style: 'cancel' },
        {
          text: 'Yes, I Am Safe (Cancel)',
          style: 'destructive',
          onPress: cancelSos
        }
      ]
    );
  };

  if (activeSos) {
    return (
      <View className="bg-red-950/80 border-2 border-red-600 rounded-3xl p-5 mx-4 my-3 items-center shadow-2xl">
        <View className="w-16 h-16 rounded-full bg-red-600 justify-center items-center mb-3">
          <Ionicons name="radio" size={34} color="white" />
        </View>

        <Text className="text-red-400 font-extrabold text-sm uppercase tracking-widest text-center">
          EMERGENCY BEACON ACTIVE
        </Text>
        <Text className="text-white text-xl font-bold mt-1 text-center">
          DMC Response Dispatched
        </Text>
        <Text className="text-slate-300 text-xs mt-1 text-center">
          Broadcasting GPS to Rescue Volunteers & Operations Command
        </Text>

        <View className="bg-slate-900/90 w-full p-3.5 rounded-xl my-4 border border-slate-800">
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-slate-400 text-xs">Mission Status:</Text>
            <Text className="text-red-400 font-bold text-xs uppercase">{activeSos.status}</Text>
          </View>
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-slate-400 text-xs">Location:</Text>
            <Text className="text-white text-xs font-mono" numberOfLines={1}>
              {activeSos.location?.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-slate-400 text-xs">People in Danger:</Text>
            <Text className="text-white text-xs font-bold">{activeSos.peopleCount} Person(s)</Text>
          </View>

          {activeSos.assignedResponder && (
            <View className="mt-2 pt-2 border-t border-slate-800 flex-row items-center">
              <Ionicons name="shield-checkmark" size={16} color="#38BDF8" />
              <Text className="text-sky-300 text-xs font-semibold ml-1.5">
                Assigned: {activeSos.assignedResponder.name} ({activeSos.assignedResponder.agency || 'DMC Volunteer'})
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={handleCancel}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-600 px-6 py-2.5 rounded-xl"
        >
          <Text className="text-slate-200 font-bold text-xs">
            I AM SAFE • CANCEL SOS BEACON
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="items-center my-4">
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
        className="w-44 h-44 rounded-full bg-red-600 justify-center items-center shadow-2xl border-4 border-red-500/80"
        style={{
          shadowColor: '#EF4444',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.6,
          shadowRadius: 20
        }}
      >
        <Ionicons name="alert-circle" size={54} color="white" />
        <Text className="text-white font-extrabold text-2xl tracking-widest mt-1">
          SOS
        </Text>
        <Text className="text-red-100 text-xs font-semibold uppercase tracking-wider">
          Tap for Emergency
        </Text>
      </TouchableOpacity>

      <Text className="text-slate-400 text-xs mt-3 font-medium text-center">
        Sends live GPS location immediately to nearby rescue units
      </Text>

      {/* SOS Configuration Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-slate-900 border-t border-slate-800 p-6 rounded-t-3xl">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-red-600 justify-center items-center mr-2">
                  <Ionicons name="warning" size={18} color="white" />
                </View>
                <Text className="text-white font-bold text-lg">Confirm SOS Distress Signal</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-300 text-xs mb-3">
              Select nature of emergency (optional) to aid responders:
            </Text>

            <View className="flex-row flex-wrap mb-4">
              {[
                { id: 'general_danger', label: 'Danger' },
                { id: 'trapped', label: 'Trapped' },
                { id: 'flood_surround', label: 'Flood' },
                { id: 'fire_threat', label: 'Fire' },
                { id: 'medical_emergency', label: 'Medical' }
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setEmergencyType(item.id)}
                  className={`px-3 py-2 rounded-xl mr-2 mb-2 border ${
                    emergencyType === item.id
                      ? 'bg-red-600 border-red-500'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <Text className="text-white text-xs font-bold">{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-slate-300 text-xs mb-1">Number of people with you:</Text>
            <TextInput
              keyboardType="number-pad"
              value={peopleCount}
              onChangeText={setPeopleCount}
              className="bg-slate-800 text-white p-3 rounded-xl mb-4 border border-slate-700 text-sm"
              placeholder="e.g. 1"
              placeholderTextColor="#64748B"
            />

            <Text className="text-slate-300 text-xs mb-1">Brief note / Landmark (optional):</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              className="bg-slate-800 text-white p-3 rounded-xl mb-5 border border-slate-700 text-sm"
              placeholder="e.g. 2nd floor balcony, water up to stairs"
              placeholderTextColor="#64748B"
            />

            <TouchableOpacity
              onPress={handleTriggerQuickSos}
              disabled={isActivating}
              className="bg-red-600 py-3.5 rounded-xl items-center flex-row justify-center"
            >
              {isActivating ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-extrabold text-base tracking-wider uppercase">
                    TRANSMIT SOS SIGNAL
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
