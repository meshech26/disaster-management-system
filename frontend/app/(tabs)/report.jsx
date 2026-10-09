import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Header } from '../../components/Header';
import { useLocation } from '../../hooks/useLocation';
import { incidentService } from '../../services/incidentService';
import { DISASTER_TYPES_CONFIG } from '../../constants/disasterTypes';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ReportIncidentScreen() {
  const router = useRouter();
  const { location } = useLocation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [disasterType, setDisasterType] = useState('flood');
  const [severity, setSeverity] = useState('medium');
  const [trappedCount, setTrappedCount] = useState('0');
  const [selectedNeeds, setSelectedNeeds] = useState([]);
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const availableNeeds = [
    'Rescue Boat',
    'Drinking Water',
    'Paramedic Unit',
    'Heavy Machinery',
    'Shelter Tents',
    'Food Rations'
  ];

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch (e) {
      Alert.alert('Image Pick Error', e.message);
    }
  };

  const toggleNeed = (need) => {
    if (selectedNeeds.includes(need)) {
      setSelectedNeeds(selectedNeeds.filter((n) => n !== need));
    } else {
      setSelectedNeeds([...selectedNeeds, need]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Required Fields', 'Please provide a title and incident description.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('disasterType', disasterType);
      formData.append('severity', severity);
      formData.append('latitude', String(location.latitude));
      formData.append('longitude', String(location.longitude));
      formData.append('peopleTrappedCount', trappedCount || '0');

      selectedNeeds.forEach((need) => {
        formData.append('immediateNeeds[]', need);
      });

      images.forEach((uri, index) => {
        const filename = uri.split('/').pop() || `photo_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('media', {
          uri,
          name: filename,
          type
        });
      });

      await incidentService.createIncident(formData);
      Alert.alert('Incident Reported', 'Your disaster report has been transmitted to emergency dispatch.', [
        {
          text: 'OK',
          onPress: () => {
            setTitle('');
            setDescription('');
            setImages([]);
            router.push('/(tabs)');
          }
        }
      ]);
    } catch (err) {
      Alert.alert('Failed to report incident', err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      <Header title="REPORT DISASTER" />

      <ScrollView className="flex-1 p-4">
        {/* Disaster Type Selector */}
        <Text className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-2">
          1. Select Disaster Category
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {Object.entries(DISASTER_TYPES_CONFIG).map(([key, meta]) => {
            const isSelected = disasterType === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setDisasterType(key)}
                className={`mr-2.5 p-3 rounded-2xl border items-center w-24 ${
                  isSelected ? 'bg-red-600 border-red-500' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <Ionicons
                  name={meta.iconName}
                  size={24}
                  color={isSelected ? 'white' : meta.color}
                />
                <Text
                  className={`text-xs font-bold mt-1 text-center ${
                    isSelected ? 'text-white' : 'text-slate-300'
                  }`}
                  numberOfLines={1}
                >
                  {meta.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Severity Selector */}
        <Text className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-2">
          2. Threat Severity Level
        </Text>
        <View className="flex-row mb-4 space-x-2">
          {['low', 'medium', 'high', 'critical'].map((level) => {
            const isSelected = severity === level;
            return (
              <TouchableOpacity
                key={level}
                onPress={() => setSeverity(level)}
                className={`flex-1 py-2.5 rounded-xl items-center border mr-1.5 ${
                  isSelected
                    ? level === 'critical'
                      ? 'bg-red-600 border-red-500'
                      : level === 'high'
                      ? 'bg-orange-600 border-orange-500'
                      : level === 'medium'
                      ? 'bg-amber-600 border-amber-500'
                      : 'bg-emerald-600 border-emerald-500'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <Text
                  className={`text-xs font-black uppercase ${
                    isSelected ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Title & Description */}
        <Text className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-1">
          3. Incident Title
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Kelani River Water Level Rising Rapidly"
          placeholderTextColor="#64748B"
          className="bg-slate-900 border border-slate-800 text-white p-3.5 rounded-xl mb-4 text-sm"
        />

        <Text className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-1">
          4. Detailed Description & Situation
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholder="Describe damages, trapped civilians, immediate threats, road blockage..."
          placeholderTextColor="#64748B"
          className="bg-slate-900 border border-slate-800 text-white p-3.5 rounded-xl mb-4 text-sm"
          style={{ minHeight: 90, textAlignVertical: 'top' }}
        />

        {/* Trapped Civilians Count */}
        <Text className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-1">
          5. People Trapped or Injured (Estimate)
        </Text>
        <TextInput
          value={trappedCount}
          onChangeText={setTrappedCount}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#64748B"
          className="bg-slate-900 border border-slate-800 text-white p-3.5 rounded-xl mb-4 text-sm"
        />

        {/* Immediate Needs Tags */}
        <Text className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-2">
          6. Urgent Needs Required
        </Text>
        <View className="flex-row flex-wrap mb-4">
          {availableNeeds.map((need) => {
            const isChecked = selectedNeeds.includes(need);
            return (
              <TouchableOpacity
                key={need}
                onPress={() => toggleNeed(need)}
                className={`px-3 py-1.5 rounded-xl mr-2 mb-2 border ${
                  isChecked ? 'bg-sky-600 border-sky-500' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isChecked ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {isChecked ? '✓ ' : '+ '}
                  {need}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Photo Upload */}
        <Text className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-2">
          7. Visual Evidence (Photos)
        </Text>
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={pickImage}
            className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 justify-center items-center mr-3"
          >
            <Ionicons name="camera" size={26} color="#94A3B8" />
            <Text className="text-slate-400 text-[10px] font-bold mt-1">+ Photo</Text>
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((imgUri, i) => (
              <View key={i} className="relative mr-2">
                <Image source={{ uri: imgUri }} className="w-20 h-20 rounded-2xl bg-slate-800" />
                <TouchableOpacity
                  onPress={() => setImages(images.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 bg-red-600 rounded-full w-5 h-5 justify-center items-center"
                >
                  <Ionicons name="close" size={12} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          className="bg-red-600 py-4 rounded-2xl items-center shadow-2xl mb-8 flex-row justify-center"
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="shield-outline" size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-extrabold text-base tracking-wider uppercase">
                DISPATCH INCIDENT REPORT
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
