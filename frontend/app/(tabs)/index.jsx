import React, { useState, useEffect, useRef } from 'react';
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
  RefreshControl,
  Platform,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../hooks/useLocation';
import { incidentService } from '../../services/incidentService';
import { shelterService } from '../../services/shelterService';
import { LocationPickerMap } from '../../components/LocationPickerMap';
import { storage } from '../../utils/storage';
import { GROUND_HAZARD_TYPES } from '../../constants/disasterTypes';
import { reverseGeocode } from '../../services/geocodingService';
import CitizenHomeView from '../../components/CitizenHomeView';

export default function VolunteerHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (user?.role === 'citizen') {
    return <CitizenHomeView user={user} logout={logout} router={router} />;
  }

  const { location, refreshLocation } = useLocation();

  // Form State
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
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
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

  // Reports & Alerts State
  const [recentReports, setRecentReports] = useState([]);
  const [alertCount, setAlertCount] = useState(3);
  const [refreshing, setRefreshing] = useState(false);

  const descriptionInputRef = useRef(null);
  const formSectionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'Volunteer';

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await logout();
      } catch (e) {
        console.warn('Logout error:', e);
      } finally {
        router.replace('/(auth)/login');
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Do you wish to log out of Community Volunteer Portal?')) {
        await performLogout();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Do you wish to log out of Community Volunteer Portal?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: performLogout
          }
        ]
      );
    }
  };

  const fetchData = async () => {
    try {
      const [incRes, alertsRes, savedRead] = await Promise.all([
        incidentService.getIncidents({ limit: 6 }),
        shelterService.getBroadcasts(),
        storage.getItem('read_alert_ids')
      ]);

      const allIncidents = incRes.data || [];
      // Prioritize user's own reports if available
      const myReports = allIncidents.filter(
        (i) => i.reportedBy?._id === user?._id || i.reportedBy === user?._id
      );
      const targetList = myReports.length > 0 ? myReports : allIncidents;
      // Strictly show only the last 4 recent submitted reports
      setRecentReports(targetList.slice(0, 4));

      if (alertsRes?.data) {
        let readIds = [];
        if (savedRead) {
          try {
            readIds = JSON.parse(savedRead);
          } catch (e) {}
        }
        const unread = alertsRes.data.filter((a) => !readIds.includes(a._id)).length;
        setAlertCount(unread);
      }
    } catch (e) {
      console.warn('Failed to load volunteer home data:', e.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

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

  // 1. Pick Photos (cross-platform)
  const handlePhotoSelect = async () => {
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
      console.warn('Image picker error:', e);
      Alert.alert('Gallery Error', e.message);
    }
  };

  // 2. Camera Take Photo
  const takePhoto = async () => {
    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 5 photos.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPhotos((prev) => [...prev, result.assets[0].uri].slice(0, 5));
      }
    } catch (e) {
      Alert.alert('Camera Error', e.message);
    }
  };

  // 3. Remove Photo
  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // 4. Update GPS Location
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

  // 5. Submit Ground Report
  const handleSubmitReport = async () => {
    if (!description.trim()) {
      Alert.alert('Description Required', 'Please enter a description of the ground hazard.');
      descriptionInputRef.current?.focus();
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

      // Append photos properly for web & mobile
      for (let i = 0; i < photos.length; i++) {
        const uri = photos[i];
        const filename = `ground_photo_${Date.now()}_${i}.jpg`;
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
      setShowSuccessBanner(true);
      setSuccessModalVisible(true);
      fetchData();
    } catch (err) {
      Alert.alert('Submission Failed', err.message || 'Could not submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const getHazardTypeBadge = (type, customType) => {
    const t = (type || '').toLowerCase();
    if (t === 'flood') return { label: 'Flood', color: '#0284C7', bg: '#E0F2FE' };
    if (t === 'landslide' || t === 'land slide') return { label: 'Land Slide', color: '#D97706', bg: '#FEF3C7' };
    if (t === 'extreme_wind' || t === 'extreme wind') return { label: 'Extreme Wind', color: '#0D9488', bg: '#CCFBF1' };
    if (t === 'heavy_rain_lightning' || t === 'heavy rain with lightning' || t === 'heavy_rain_with_lightning') return { label: 'Rain & Lightning', color: '#6366F1', bg: '#EEF2FF' };
    if (customType) return { label: customType, color: '#64748B', bg: '#F1F5F9' };
    return { label: 'Other', color: '#64748B', bg: '#F1F5F9' };
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'verified') {
      return { label: 'Verified', bg: '#DCFCE7', text: '#15803D' };
    }
    if (s === 'rejected' || s === 'dismissed') {
      return { label: 'Rejected', bg: '#FEE2E2', text: '#B91C1C' };
    }
    return { label: 'Under Review', bg: '#FEF3C7', text: '#B45309' };
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
                  router.push('/(tabs)/my-reports');
                }}
              >
                <Ionicons name="list" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalPrimaryBtnText}>View My Reports</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                activeOpacity={0.85}
                onPress={() => setSuccessModalVisible(false)}
              >
                <Text style={styles.modalSecondaryBtnText}>Submit Another Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C81E1E" />}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header: Greeting & Notification Bell */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.roleTagRow}>
              <View style={styles.greenDot} />
              <Text style={styles.roleTagText}>COMMUNITY VOLUNTEER</Text>
            </View>
            <Text style={styles.greetingTitle}>
              {getGreeting()}, {displayName} 👋
            </Text>
            <Text style={styles.subGreeting}>
              {user?.district ? `${user.district} District` : 'DMC Sri Lanka'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/alerts')}
              style={styles.bellButton}
            >
              <Ionicons name="notifications-outline" size={22} color="#0F172A" />
              {alertCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{alertCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <Feather name="log-out" size={19} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>


        {/* Ground Hazard Report Form Section */}
        <View style={styles.formContainer}>
          {/* Dismissible Success Banner */}
          {showSuccessBanner && (
            <View style={styles.inlineSuccessBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.inlineSuccessTitle}>Report Submitted Successfully!</Text>
                <Text style={styles.inlineSuccessText}>Your report is under review by DMC coordinators.</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSuccessBanner(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={18} color="#15803D" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.formHeaderRow}>
            <Ionicons name="warning-outline" size={20} color="#C81E1E" style={{ marginRight: 6 }} />
            <Text style={styles.formSectionTitle}>Ground Hazard Form</Text>
          </View>

          {/* Hazard Type Selector */}
          <View style={{ marginBottom: 16 }}>
            <View style={styles.hazardTypeHeaderRow}>
              <Text style={styles.inputLabel}>Hazard Type <Text style={styles.requiredStar}>*</Text></Text>
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
                  <Text style={styles.inputLabel}>
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
          <View style={{ marginBottom: 14 }}>
            <Text style={styles.inputLabel}>Hazard Title</Text>
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

          {/* 1. Upload JPG / JPEG / PNG photos */}
          <Text style={styles.inputLabel}>Photos</Text>

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
            onPress={handlePhotoSelect}
            activeOpacity={0.8}
            style={styles.uploadDashedBox}
          >
            <Feather name="upload-cloud" size={28} color="#C81E1E" />
            <Text style={styles.uploadTitle}>Add Photos</Text>
            <Text style={styles.uploadSubtitle}>Upload JPG, JPEG or PNG (Max 5 photos)</Text>
          </TouchableOpacity>

          {/* Photo Previews Gallery */}
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
                <TouchableOpacity onPress={handlePhotoSelect} style={styles.addMorePhotoBtn}>
                  <Ionicons name="add" size={24} color="#64748B" />
                  <Text style={styles.addMoreText}>Add</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {/* 2. Hazard Description */}
          <View style={{ marginTop: 14 }}>
            <Text style={styles.inputLabel}>Hazard Description</Text>
            <View style={styles.descriptionBox}>
              <TextInput
                ref={descriptionInputRef}
                value={description}
                onChangeText={(text) => {
                  if (text.length <= 500) setDescription(text);
                }}
                multiline
                numberOfLines={4}
                placeholder="Describe the hazard, severity, and any immediate danger..."
                placeholderTextColor="#94A3B8"
                style={styles.descriptionInput}
              />
              <Text style={styles.charCounter}>{description.length} / 500</Text>
            </View>
          </View>

          {/* 3. Location Map View */}
          <View style={{ marginTop: 14 }}>
            <View style={styles.locationHeaderRow}>
              <Text style={styles.inputLabel}>Hazard Location</Text>
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
              height={230}
            />

            <View style={styles.mapFooterNote}>
              <Text style={styles.mapFooterNoteText}>
                📍 Tap anywhere on map to pin hazard. Coordinates save automatically.
              </Text>
            </View>
          </View>

          {/* 4. Submit Report Button */}
          <TouchableOpacity
            onPress={handleSubmitReport}
            disabled={submitting}
            activeOpacity={0.88}
            style={styles.submitReportBtn}
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
        </View>

        {/* Recent Submitted Reports Section */}
        <View style={styles.recentReportsHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Submitted Reports</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/my-reports')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* List of Recent Reports */}
        <View style={styles.reportsList}>
          {recentReports.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="clipboard-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No submitted reports yet</Text>
              <Text style={styles.emptySubtitle}>
                Reports you submit will appear here with live verification status.
              </Text>
            </View>
          ) : (
            recentReports.slice(0, 4).map((report) => {
              const badge = getStatusBadge(report.status);
              const typeBadge = getHazardTypeBadge(report.disasterType, report.customDisasterType);
              const photoUri = report.mediaUrls?.[0]?.url;

              return (
                <TouchableOpacity
                  key={report._id}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/my-reports')}
                  style={styles.reportCard}
                >
                  <View style={styles.reportCardLeft}>
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.reportThumbnail} />
                    ) : (
                      <View style={styles.reportThumbnailPlaceholder}>
                        <Ionicons name="warning" size={24} color="#C81E1E" />
                      </View>
                    )}
                  </View>

                  <View style={styles.reportCardBody}>
                    <View style={styles.reportCardTitleRow}>
                      <Text style={styles.reportCardTitle} numberOfLines={1}>
                        {report.title || 'Ground Hazard Report'}
                      </Text>
                    </View>

                    <View style={styles.reportLocationRow}>
                      <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                      <Text style={styles.reportLocationText} numberOfLines={1}>
                        {report.location?.address || 'Kaduwela, Western Province'}
                      </Text>
                    </View>

                    <View style={styles.reportFooterRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: 6 }}>
                        <View style={[styles.hazardPill, { backgroundColor: typeBadge.bg, marginRight: 6 }]}>
                          <Text style={[styles.hazardPillText, { color: typeBadge.color }]}>
                            {typeBadge.label}
                          </Text>
                        </View>
                        <Text style={styles.reportDateText}>
                          {new Date(report.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 36
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 6
  },
  roleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.8
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A'
  },
  subGreeting: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    marginRight: 8
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#C81E1E',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A'
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  inputLabel: {
    fontSize: 13,
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
    backgroundColor: '#F8FAFC',
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8
  },
  uploadSubtitle: {
    fontSize: 11,
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
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#E2E8F0'
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#C81E1E',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addMorePhotoBtn: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  addMoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2
  },
  descriptionBox: {
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 12
  },
  descriptionInput: {
    minHeight: 88,
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
  submitReportBtn: {
    backgroundColor: '#C81E1E',
    borderRadius: 16,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
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
  recentReportsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C81E1E'
  },
  reportsList: {
    marginBottom: 16
  },
  reportCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2
  },
  reportCardLeft: {
    marginRight: 12
  },
  reportThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E2E8F0'
  },
  reportThumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  reportCardBody: {
    flex: 1,
    justifyContent: 'space-between'
  },
  reportCardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reportCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1
  },
  reportLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  reportLocationText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1
  },
  reportFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6
  },
  reportDateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4
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
  inlineSuccessBanner: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  inlineSuccessTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D'
  },
  inlineSuccessText: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2
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
  hazardPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  hazardPillText: {
    fontSize: 10.5,
    fontWeight: '700'
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
