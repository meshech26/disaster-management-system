import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, switchRoleDemo } = useAuth();

  const [addContactModal, setAddContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('Family');

  const handleAddContact = async () => {
    if (!contactName || !contactPhone) {
      Alert.alert('Required', 'Please enter contact name and phone');
      return;
    }

    try {
      await authService.addEmergencyContact({
        name: contactName,
        phone: contactPhone,
        relation: contactRelation
      });
      Alert.alert('Success', 'Emergency contact saved');
      setAddContactModal(false);
      setContactName('');
      setContactPhone('');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-slate-950">
      <Header title="USER PROFILE & CONTACTS" />

      <ScrollView className="flex-1 p-4">
        {/* User Card */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-5 items-center">
          <View className="w-20 h-20 rounded-full bg-slate-800 justify-center items-center border-2 border-red-500 mb-3">
            <Ionicons name="person" size={40} color="#F8FAFC" />
          </View>

          <Text className="text-white font-extrabold text-xl">{user?.name || 'Anonymous User'}</Text>
          <Text className="text-slate-400 text-xs mt-0.5">{user?.email || 'Not logged in'}</Text>

          <View className="flex-row items-center mt-3">
            <View className="bg-red-950 px-3 py-1 rounded-full border border-red-800 mr-2">
              <Text className="text-red-400 text-xs font-bold uppercase tracking-wider">
                {user?.role || 'Citizen'}
              </Text>
            </View>
            {user?.agency && (
              <View className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                <Text className="text-slate-300 text-xs">{user.agency}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Role Simulator Switcher for Reviewing all user capabilities */}
        <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5">
          <Text className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-2">
            Switch Active Role (Demo Mode):
          </Text>
          <View className="flex-row space-x-2">
            {[
              { role: 'citizen', label: 'Citizen', icon: 'person' },
              { role: 'responder', label: 'Responder', icon: 'shield' },
              { role: 'admin', label: 'HQ Admin', icon: 'speedometer' }
            ].map((item) => (
              <TouchableOpacity
                key={item.role}
                onPress={() => switchRoleDemo(item.role)}
                className={`flex-1 py-2.5 rounded-xl items-center border mr-1.5 ${
                  user?.role === item.role
                    ? 'bg-red-600 border-red-500'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={user?.role === item.role ? 'white' : '#94A3B8'}
                />
                <Text
                  className={`text-xs font-bold mt-1 ${
                    user?.role === item.role ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Emergency Contacts List */}
        <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Ionicons name="call" size={16} color="#EF4444" style={{ marginRight: 6 }} />
              <Text className="text-white font-bold text-sm">Emergency Contacts</Text>
            </View>
            <TouchableOpacity onPress={() => setAddContactModal(true)}>
              <Text className="text-red-400 text-xs font-bold">+ Add Contact</Text>
            </TouchableOpacity>
          </View>

          {user?.emergencyContacts && user.emergencyContacts.length > 0 ? (
            user.emergencyContacts.map((contact, i) => (
              <View
                key={i}
                className="bg-slate-800/80 p-3 rounded-xl mb-2 flex-row justify-between items-center"
              >
                <View>
                  <Text className="text-white font-bold text-xs">{contact.name}</Text>
                  <Text className="text-slate-400 text-[10px]">{contact.relation || 'Family'}</Text>
                </View>
                <Text className="text-red-400 font-mono text-xs">{contact.phone}</Text>
              </View>
            ))
          ) : (
            <Text className="text-slate-500 text-xs text-center py-2">
              No emergency contacts added yet. Add trusted contacts who receive SOS alerts.
            </Text>
          )}
        </View>

        {/* Account Actions */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-slate-900 border border-slate-800 py-3.5 rounded-2xl items-center mb-8 flex-row justify-center"
        >
          <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
          <Text className="text-red-400 font-bold text-sm">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal visible={addContactModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-slate-900 border-t border-slate-800 p-6 rounded-t-3xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white font-bold text-lg">Add Emergency Contact</Text>
              <TouchableOpacity onPress={() => setAddContactModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TextInput
              value={contactName}
              onChangeText={setContactName}
              placeholder="Full Name (e.g. Sarah Connor)"
              placeholderTextColor="#64748B"
              className="bg-slate-800 text-white p-3.5 rounded-xl mb-3 text-sm"
            />

            <TextInput
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
              placeholder="Mobile Phone"
              placeholderTextColor="#64748B"
              className="bg-slate-800 text-white p-3.5 rounded-xl mb-3 text-sm"
            />

            <TextInput
              value={contactRelation}
              onChangeText={setContactRelation}
              placeholder="Relation (e.g. Spouse, Parent, Sibling)"
              placeholderTextColor="#64748B"
              className="bg-slate-800 text-white p-3.5 rounded-xl mb-5 text-sm"
            />

            <TouchableOpacity
              onPress={handleAddContact}
              className="bg-red-600 py-3.5 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-base">Save Emergency Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
