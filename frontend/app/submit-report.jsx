import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocation } from '../hooks/useLocation';
import { incidentService } from '../services/incidentService';
import { LocationPickerMap } from '../components/LocationPickerMap';
import { GROUND_HAZARD_TYPES } from '../constants/disasterTypes';
import { reverseGeocode } from '../services/geocodingService';

export default function SubmitGroundReportScreen() {
  const router = useRouter();
  const { location, refreshLocation } = useLocation();

  const [disasterType, setDisasterType] = useState('flood');
  const [customDisasterType, setCustomDisasterType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 6.9271,
    longitude: 79.8612
  });
  const [currentAddress, setCurrentAddress] = useState('Colombo');
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [submittedTitle, setSubmittedTitle] = useState('');
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    let isCurrent = true;
    const lat = location?.latitude || 6.9271;
    const lon = location?.longitude || 79.8612;
    setSelectedLocation({ latitude: lat, longitude: lon });
    setResolvingAddress(true);
    reverseGeocode(lat, lon).then((addr) => {
      if (isCurrent && addr) {
        setCurrentAddress(addr);
        setResolvingAddress(false);
      }
    });
    return () => { isCurrent = false; };
  }, [location?.latitude, location?.longitude]);

  // Handle files selected via HTML input (Web)
  const handleWebFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    const available = 5 - photos.length;
    const newUris = selectedFiles
      .slice(0, available)
      .map((file) => URL.createObjectURL(file));
    setPhotos((prev) => [...prev, ...newUris].slice(0, 5));
    e.target.value = '';
  };

  const pickPhoto = async () => {
    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 5 photos.');
      return;
    }

    if (Platform.OS === 'web') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - photos.length,
        quality: 0.8
      });

      if (!result.canceled && result.assets) {
        const newUris = result.assets.map((asset) => asset.uri);
        setPhotos((prev) => [...prev, ...newUris].slice(0, 5));
      }
    } catch (e) {
      Alert.alert('Gallery Error', e.message);
    }
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLocation = async () => {
    refreshLocation();
    const lat = location?.latitude || selectedLocation.latitude;
    const lon = location?.longitude || selectedLocation.longitude;
    setResolvingAddress(true);
    const addr = await reverseGeocode(lat, lon);
    setCurrentAddress(addr);
    setResolvingAddress(false);
    Alert.alert('Location Updated', `Location detected: ${addr}`);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Description Required', 'Please enter a description of the ground hazard.');
      return;
    }

    if (disasterType === 'other' && !customDisasterType.trim()) {
      Alert.alert('Disaster Type Required', 'Please type the disaster type for this hazard.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      const selectedTypeConfig = GROUND_HAZARD_TYPES.find((h) => h.type === disasterType);
      const typeDisplay = disasterType === 'other' && customDisasterType.trim()
        ? customDisasterType.trim()
        : (selectedTypeConfig ? selectedTypeConfig.label : 'Ground Hazard');
      const defaultTitle = `${typeDisplay} Report`;
      const cleanTitle = title.trim() || description.trim().split('\n')[0].slice(0, 45) || defaultTitle;
      formData.append('title', cleanTitle);
      formData.append('description', description.trim());
      formData.append('latitude', String(selectedLocation.latitude));
      formData.append('longitude', String(selectedLocation.longitude));
      formData.append('address', currentAddress);
      formData.append('disasterType', disasterType);
      if (disasterType === 'other') {
        formData.append('customDisasterType', customDisasterType.trim());
      }
      formData.append('severity', 'medium');

      for (let i = 0; i < photos.length; i++) {
        const uri = photos[i];
        const filename = `photo_${Date.now()}_${i}.jpg`;
        const mimeType = 'image/jpeg';

        if (Platform.OS === 'web') {
          const res = await fetch(uri);
          const blob = await res.blob();
          formData.append('media', blob, filename);
        } else {
          formData.append('media', {
            uri,
            name: filename,
            type: mimeType
          });
        }
      }

      await incidentService.createIncident(formData);

      setSubmittedTitle(cleanTitle);
      setTitle('');
      setDescription('');
      setPhotos([]);
      setDisasterType('flood');
      setCustomDisasterType('');
      setSuccessModalVisible(true);
    } catch (err) {
      Alert.alert('Submission Failed', err.message || 'Could not submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Submission Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
            </View>

            <Text style={styles.modalTitle}>Report Submitted Successfully!</Text>
            <Text style={styles.modalSubText}>
              Your ground hazard report has been received and logged for response team verification.
            </Text>

            <View style={styles.modalDetailsBox}>
              <View style={styles.modalDetailRow}>
                <Ionicons name="document-text-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.modalDetailLabel}>Hazard:</Text>
                <Text style={styles.modalDetailValue} numberOfLines={1}>{submittedTitle || 'Ground Hazard Report'}</Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#16A34A" style={{ marginRight: 6 }} />
                <Text style={styles.modalDetailLabel}>Status:</Text>
                <Text style={styles.modalDetailStatus}>Under Review</Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Ionicons name="location-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.modalDetailLabel}>Location:</Text>
                <Text style={styles.modalDetailValue} numberOfLines={1}>{currentAddress}</Text>
              </View>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setSuccessModalVisible(false);
                  router.replace('/(tabs)/my-reports');
                }}
              >
                <Ionicons name="list" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalPrimaryBtnText}>View My Reports</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setSuccessModalVisible(false);
                  router.replace('/(tabs)');
                }}
              >
                <Text style={styles.modalSecondaryBtnText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Ground Report</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Hazard Type Selector */}
        <View style={{ marginBottom: 18 }}>
          <View style={styles.hazardTypeHeaderRow}>
            <Text style={styles.sectionLabel}>Hazard Type <Text style={styles.requiredStar}>*</Text></Text>
            <Text style={styles.hazardTypeSubLabel}>Choose ground disaster type</Text>
          </View>

          <View style={styles.hazardTypeGrid}>
            {GROUND_HAZARD_TYPES.map((item) => {
              const isSelected = disasterType === item.type;
              const isOther = item.type === 'other';

              return (
                <TouchableOpacity
                  key={item.type}
                  onPress={() => setDisasterType(item.type)}
                  activeOpacity={0.82}
                  style={[
                    styles.hazardTypeCard,
                    isOther && styles.hazardTypeCardOther,
                    isSelected && [styles.hazardTypeCardActive, { borderColor: item.color, backgroundColor: item.badgeBg }]
                  ]}
                >
                  {isOther ? (
                    <View style={styles.otherCardInner}>
                      <View style={styles.otherCardLeft}>
                        <View
                          style={[
                            styles.hazardIconCircle,
                            { backgroundColor: isSelected ? item.color : '#F1F5F9', marginRight: 10 }
                          ]}
                        >
                          <Ionicons
                            name={item.iconName}
                            size={18}
                            color={isSelected ? '#FFFFFF' : '#475569'}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.hazardTypeCardLabel,
                              { marginBottom: 1 },
                              isSelected && { color: item.color, fontWeight: '800' }
                            ]}
                          >
                            {item.label}
                          </Text>
                          <Text style={styles.hazardTypeCardDesc} numberOfLines={1}>
                            {item.description}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          isSelected && { borderColor: item.color }
                        ]}
                      >
                        {isSelected && (
                          <View style={[styles.radioInner, { backgroundColor: item.color }]} />
                        )}
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={styles.hazardTypeCardTop}>
                        <View
                          style={[
                            styles.hazardIconCircle,
                            { backgroundColor: isSelected ? item.color : '#F1F5F9' }
                          ]}
                        >
                          <Ionicons
                            name={item.iconName}
                            size={18}
                            color={isSelected ? '#FFFFFF' : '#475569'}
                          />
                        </View>
                        <View
                          style={[
                            styles.radioOuter,
                            isSelected && { borderColor: item.color }
                          ]}
                        >
                          {isSelected && (
                            <View style={[styles.radioInner, { backgroundColor: item.color }]} />
                          )}
                        </View>
                      </View>

                      <Text
                        style={[
                          styles.hazardTypeCardLabel,
                          isSelected && { color: item.color, fontWeight: '800' }
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.hazardTypeCardDesc,
                          isSelected && { color: '#334155' }
                        ]}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Disaster Type Input Field (when Other is selected) */}
          {disasterType === 'other' && (
            <View style={styles.customTypeContainer}>
              <View style={styles.customTypeHeaderRow}>
                <Text style={styles.sectionLabel}>
                  Specify Disaster Type <Text style={styles.requiredStar}>*</Text>
                </Text>
                <Text style={styles.customTypeSubLabel}>Type the disaster name</Text>
              </View>
              <View style={styles.customTypeInputBox}>
                <Feather name="edit-3" size={17} color="#C81E1E" style={{ marginRight: 8 }} />
                <TextInput
                  value={customDisasterType}
                  onChangeText={setCustomDisasterType}
                  placeholder="e.g. Sinkhole, Bridge Collapse, Toxic Leak..."
                  placeholderTextColor="#94A3B8"
                  style={styles.customTypeInput}
                />
              </View>
            </View>
          )}
        </View>

        {/* Hazard Title Input */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.sectionLabel}>Hazard Title</Text>
          <View style={styles.titleInputBox}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={
                disasterType === 'landslide'
                  ? 'e.g. Landslide blocking hillside road'
                  : disasterType === 'extreme_wind'
                  ? 'e.g. High winds damaged roof & uprooted trees'
                  : disasterType === 'heavy_rain_lightning'
                  ? 'e.g. Heavy rain & lightning strike near bridge'
                  : disasterType === 'other'
                  ? (customDisasterType.trim() ? `e.g. ${customDisasterType.trim()} near Main Junction` : 'e.g. Custom incident title / location tag')
                  : 'e.g. Flash flood on Main Street / Sector 4'
              }
              placeholderTextColor="#94A3B8"
              style={styles.titleInput}
            />
          </View>
        </View>

        {/* Photos Section */}
        <Text style={styles.sectionLabel}>Photos</Text>

        {Platform.OS === 'web' && (
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/jpg"
            multiple
            style={{ display: 'none' }}
            onChange={handleWebFileChange}
          />
        )}

        <TouchableOpacity
          onPress={pickPhoto}
          activeOpacity={0.8}
          style={styles.uploadDashedBox}
        >
          <Feather name="upload-cloud" size={32} color="#C81E1E" />
          <Text style={styles.uploadTitle}>Add Photos</Text>
          <Text style={styles.uploadSubtitle}>Upload JPG, JPEG or PNG (Max 5 photos)</Text>
        </TouchableOpacity>

        {photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoGallery}>
            {photos.map((uri, idx) => (
              <View key={idx} style={styles.photoThumbnailWrapper}>
                <Image source={{ uri }} style={styles.photoThumbnail} />
                <TouchableOpacity
                  onPress={() => removePhoto(idx)}
                  style={styles.photoDeleteBtn}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 5 && (
              <TouchableOpacity onPress={pickPhoto} style={styles.addMorePhotoBtn}>
                <Ionicons name="add" size={24} color="#64748B" />
                <Text style={styles.addMoreText}>Add</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {/* Hazard Description */}
        <View style={{ marginTop: 18 }}>
          <Text style={styles.sectionLabel}>Hazard Description</Text>
          <View style={styles.descriptionBox}>
            <TextInput
              value={description}
              onChangeText={(text) => {
                if (text.length <= 500) setDescription(text);
              }}
              multiline
              numberOfLines={5}
              placeholder="Describe the hazard, severity, and any immediate danger..."
              placeholderTextColor="#94A3B8"
              style={styles.descriptionInput}
            />
            <Text style={styles.charCounter}>{description.length} / 500</Text>
          </View>
        </View>

        {/* Location Section */}
        <View style={{ marginTop: 18 }}>
          <View style={styles.locationHeaderRow}>
            <Text style={styles.sectionLabel}>Hazard Location</Text>
            <View style={styles.coordinatesPill}>
              <Ionicons name="location-sharp" size={13} color="#C81E1E" style={{ marginRight: 4 }} />
              <Text style={styles.coordinatesPillText} numberOfLines={1}>
                {resolvingAddress ? 'Resolving area...' : currentAddress}
              </Text>
            </View>
          </View>

          <LocationPickerMap
            location={selectedLocation}
            address={currentAddress}
            onSelectLocation={async (coords) => {
              setSelectedLocation(coords);
              setResolvingAddress(true);
              const addr = await reverseGeocode(coords.latitude, coords.longitude);
              setCurrentAddress(addr);
              setResolvingAddress(false);
            }}
            height={240}
          />

          <View style={styles.mapFooterNote}>
            <Text style={styles.mapFooterNoteText}>
              📍 Tap anywhere on map to pin hazard. Coordinates save automatically.
            </Text>
          </View>
        </View>

        {/* Submit Report Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.88}
          style={styles.submitBtn}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.submitBtnContent}>
              <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Submit Report</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  backButton: {
    padding: 6
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  content: {
    padding: 20,
    paddingBottom: 40
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8
  },
  titleInputBox: {
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center'
  },
  titleInput: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600'
  },
  uploadDashedBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4
  },
  photoGallery: {
    marginTop: 12,
    flexDirection: 'row'
  },
  photoThumbnailWrapper: {
    position: 'relative',
    marginRight: 10
  },
  photoThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E2E8F0'
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#C81E1E',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addMorePhotoBtn: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  addMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2
  },
  descriptionBox: {
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 14
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500'
  },
  charCounter: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600'
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  coordinatesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '65%',
    flexShrink: 1
  },
  coordinatesPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
    flexShrink: 1
  },
  mapFooterNote: {
    marginTop: 6,
    paddingHorizontal: 4
  },
  mapFooterNoteText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500'
  },
  submitBtn: {
    backgroundColor: '#C81E1E',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#C81E1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10
  },
  modalIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8
  },
  modalSubText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18
  },
  modalDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 8
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  modalDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 6
  },
  modalDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1
  },
  modalDetailStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309'
  },
  modalActionsRow: {
    width: '100%',
    gap: 10
  },
  modalPrimaryBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15
  },
  modalSecondaryBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  modalSecondaryBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14
  },
  hazardTypeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8
  },
  hazardTypeSubLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500'
  },
  requiredStar: {
    color: '#DC2626',
    fontWeight: '700'
  },
  hazardTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10
  },
  hazardTypeCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 11,
    minHeight: 114,
    justifyContent: 'space-between'
  },
  hazardTypeCardActive: {
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3
  },
  hazardTypeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  hazardIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.8,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  hazardTypeCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3
  },
  hazardTypeCardDesc: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 14
  },
  hazardTypeCardOther: {
    width: '100%',
    minHeight: 64,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  otherCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  otherCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  customTypeContainer: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12
  },
  customTypeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6
  },
  customTypeSubLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500'
  },
  customTypeInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  customTypeInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '600'
  }
});
