import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  Dimensions,
  Linking,
  useWindowDimensions
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { alertService } from '../services/alertService';
import { shelterService } from '../services/shelterService';
import EmergencyInstructions from './EmergencyInstructions';
import { useFocusEffect } from 'expo-router';
import { storage } from '../utils/storage';
import { socketService } from '../services/socketService';
import { getCitizenGreeting, countUnreadAlerts } from '../utils/citizenHeader';
import DmcDistrictMap from './DmcDistrictMap';
import { getWarningLocation, getWarningImage } from '../utils/warningDisplay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CitizenHomeView({ user, logout, router }) {
  // Navigation tabs matching panel 3, 4, 5 in mock: 'home' | 'shelters' | 'instructions'
  const [currentTab, setCurrentTab] = useState('home');

  // Screen 4 toggle: 'map' | 'list'
  const [shelterViewMode, setShelterViewMode] = useState('map');

  // Data
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [readAlertIds, setReadAlertIds] = useState([]);
  const [headerTime, setHeaderTime] = useState(new Date());
  const unreadCount = countUnreadAlerts(alerts, readAlertIds);
  useEffect(() => {
    const timer = setInterval(() => setHeaderTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const [shelters, setShelters] = useState([]);

  // Contacts Modal
  const [contactsModalVisible, setContactsModalVisible] = useState(false);

  // Selected Alert Detail Modal
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alertMapExpanded, setAlertMapExpanded] = useState(false);
  const { height: viewportHeight } = useWindowDimensions();
  useEffect(() => {
    if (Platform.OS !== 'web' || !selectedAlert) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (alertMapExpanded) setAlertMapExpanded(false);
        else setSelectedAlert(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedAlert, alertMapExpanded]);
  useEffect(() => { if (!selectedAlert) setAlertMapExpanded(false); }, [selectedAlert]);
  const renderWarningMap = (height) => {
    const location = getWarningLocation(selectedAlert);
    if (!location.coordinates) return <Text style={styles.alertModalDesc}>Map coordinates are unavailable for this warning.</Text>;
    return <DmcDistrictMap
      districtName={selectedAlert.affectedDistrict}
      latitude={location.coordinates[1]}
      longitude={location.coordinates[0]}
      address={location.address}
      affectedGeometry={selectedAlert.affectedArea?.geometry || null}
      height={height}
      interactive
      showRadius={false}
      editable={false}
    />;
  };

  // Selected Shelter Detail Modal
  const [selectedShelter, setSelectedShelter] = useState(null);

  const displayName = user?.name ? user.name.split(' ')[0] : 'Citizen';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, sheltersRes, savedRead] = await Promise.all([
        alertService.getActiveAlerts(),
        shelterService.getShelters({ district: user?.district || 'Colombo' }).catch(() => ({ data: [] })),
        storage.getItem('read_alert_ids')
      ]);
      try {
        const ids = JSON.parse(savedRead || '[]');
        setReadAlertIds(Array.isArray(ids) ? ids : []);
      } catch { setReadAlertIds([]); }
      const rawAlerts = alertsRes.data || [];
      // Prioritize Critical -> High -> Medium/Advisory
      const severityScore = { critical: 3, high: 2, medium: 1, low: 0 };
      const sortedAlerts = [...rawAlerts].sort((a, b) => {
        const scoreA = severityScore[a.severity?.toLowerCase()] ?? 1;
        const scoreB = severityScore[b.severity?.toLowerCase()] ?? 1;
        return scoreB - scoreA;
      });
      setAlerts(sortedAlerts);

      const rawShelters = sheltersRes.data || [];
      setShelters(rawShelters);
    } catch (err) {
      console.warn('Failed to fetch citizen data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.district]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  useEffect(() => {
    const socket = socketService.getSocket();
    const events = ['emergency_alert_broadcast', 'warning_completed', 'connect'];
    events.forEach((event) => socket.on(event, loadData));
    return () => events.forEach((event) => socket.off(event, loadData));
  }, [loadData]);

  useEffect(() => {
    if (!selectedAlert) return;
    const id = selectedAlert._id || selectedAlert.id;
    if (!id) return;
    if (readAlertIds.includes(id)) return;
    const updated = [...readAlertIds, id];
    setReadAlertIds(updated);
    storage.setItem('read_alert_ids', JSON.stringify(updated));
  }, [selectedAlert, readAlertIds]);

  // Helper images for alerts matching mock
  const getAlertImage = (type) => {
    switch (type) {
      case 'flood':
        return 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80';
      case 'landslide':
        return 'https://images.unsplash.com/photo-1602980085566-48358499c72e?auto=format&fit=crop&w=600&q=80';
      case 'heavy_rain':
      case 'heavy_rain_lightning':
        return 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80';
      default:
        return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80';
    }
  };

  // Helper images for shelters
  const getShelterImage = (idx) => {
    const list = [
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80'
    ];
    return list[idx % list.length];
  };

  // Helper for severity pill styling
  const getSeverityBadge = (severity) => {
    const s = (severity || '').toLowerCase();
    if (s === 'critical') {
      return { bg: '#DC2626', text: '#FFFFFF', label: 'Critical' };
    }
    if (s === 'high') {
      return { bg: '#EA580C', text: '#FFFFFF', label: 'High' };
    }
    return { bg: '#EAB308', text: '#FFFFFF', label: 'Advisory' };
  };

  // Format date helper
  const formatCardDate = (dateString) => {
    if (!dateString) return '09 Oct 2026, 10:30 AM';
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${formattedHours}:${mins} ${ampm}`;
  };

  // Emergency dialer
  const handleDial = (number) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert('Emergency Contact', `Please call ${number}`);
    });
  };

  return (
    <View style={styles.container}>
      {/* ========================================================================= */}
      {/* SCREEN 3: CITIZEN HOME */}
      {/* ========================================================================= */}
      {currentTab === 'home' && (
        <ScrollView style={styles.scrollArea} contentContainerStyle={[styles.scrollContent, styles.homeScrollContent]}>
          {/* Top Greeting Bar */}
          <View style={styles.topGreetingBar}>
            <View style={styles.citizenGreetingBody}>
              <View style={styles.citizenRoleRow}>
                <View style={styles.citizenStatusDot} />
                <Text style={styles.citizenRoleLabel}>CITIZEN PORTAL</Text>
              </View>
              <Text style={styles.greetingName}>{getCitizenGreeting(headerTime)}, {displayName} {String.fromCodePoint(0x1F44B)}</Text>
              <Text style={styles.citizenDistrict}>{user?.district ? `${user.district.replace(/\s+district$/i, '')} District` : 'District not set'}</Text>
            </View>

            <View style={styles.topActionsRow}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/alerts')}
                style={styles.bellBtn}
              >
                <Ionicons name="notifications-outline" size={22} color="#334155" />
                {unreadCount > 0 && <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  logout();
                  router.replace('/(auth)/login');
                }}
                style={styles.profileLogoutBtn}
              >
                <Feather name="log-out" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ACTIVE DISASTER ALERTS SECTION */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Active Disaster Alerts</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/alerts')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#1E3A8A" style={{ marginVertical: 20 }} />
          ) : alerts.length === 0 ? (
            <View style={styles.noAlertsBox}>
              <Feather name="shield" size={32} color="#10B981" />
              <Text style={styles.noAlertsText}>No active warnings in your district.</Text>
            </View>
          ) : (
            <View style={styles.alertsList}>
              {alerts.slice(0, 3).map((alert, idx) => {
                const badge = getSeverityBadge(alert.severity);
                return (
                  <TouchableOpacity
                    key={alert._id || idx}
                    activeOpacity={0.88}
                    onPress={() => setSelectedAlert(alert)}
                    style={styles.alertCard}
                  >
                    <Image
                      source={{ uri: getWarningImage(alert) || getAlertImage(alert.disasterType) }}
                      style={styles.alertCardImg}
                    />
                    <View style={styles.alertCardBody}>
                      <View style={[styles.cardBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.cardBadgeText, { color: badge.text }]}>
                          {badge.label}
                        </Text>
                      </View>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {alert.title}
                      </Text>
                      <View style={styles.cardLocationRow}>
                        <Ionicons name="location-sharp" size={13} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.cardLocationText} numberOfLines={1}>
                          {alert.affectedArea?.address || `${alert.affectedDistrict} District`}
                        </Text>
                      </View>
                      <View style={styles.cardTimeRow}>
                        <Ionicons name="time-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.cardTimeText}>
                          {formatCardDate(alert.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

        </ScrollView>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4: NEARBY SHELTERS */}
      {/* ========================================================================= */}
      {currentTab === 'shelters' && (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.screenHeader}>
            <TouchableOpacity
              onPress={() => setCurrentTab('home')}
              style={styles.headerBackBtn}
            >
              <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>Nearby Shelters</Text>
          </View>

          {/* Map View / List View Segment Toggle */}
          <View style={styles.segmentToggleBox}>
            <TouchableOpacity
              onPress={() => setShelterViewMode('map')}
              style={[
                styles.segmentBtn,
                shelterViewMode === 'map' && styles.segmentBtnActive
              ]}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  shelterViewMode === 'map' && styles.segmentBtnTextActive
                ]}
              >
                Map View
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShelterViewMode('list')}
              style={[
                styles.segmentBtn,
                shelterViewMode === 'list' && styles.segmentBtnActive
              ]}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  shelterViewMode === 'list' && styles.segmentBtnTextActive
                ]}
              >
                List View
              </Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Map Visual (Screen 4 mockup) */}
          {shelterViewMode === 'map' && (
            <View style={styles.shelterMapCanvas}>
              {/* Map grid streets */}
              <View style={styles.mapGridPattern} />

              {/* User location with pulsing blue circle */}
              <View style={styles.userLocationPulseBox}>
                <View style={styles.userLocationPulseOuter} />
                <View style={styles.userLocationDot} />
              </View>

              {/* Red shelter pins placed around */}
              <View style={[styles.mapShelterPin, { top: 40, left: 60 }]}>
                <Ionicons name="location-sharp" size={30} color="#DC2626" />
              </View>
              <View style={[styles.mapShelterPin, { top: 35, right: 80 }]}>
                <Ionicons name="location-sharp" size={30} color="#DC2626" />
              </View>
              <View style={[styles.mapShelterPin, { bottom: 50, left: 70 }]}>
                <Ionicons name="location-sharp" size={30} color="#DC2626" />
              </View>
              <View style={[styles.mapShelterPin, { bottom: 70, right: 60 }]}>
                <Ionicons name="location-sharp" size={30} color="#DC2626" />
              </View>

              {/* Recenter Button */}
              <TouchableOpacity
                onPress={() => Alert.alert('Recenter', 'Centered map on your current GPS location.')}
                style={styles.recenterMapBtn}
              >
                <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>
          )}

          {/* List of Nearby Shelters */}
          <Text style={styles.nearbySheltersHeading}>Nearby Shelters</Text>

          {loading ? (
            <ActivityIndicator size="small" color="#1E3A8A" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.sheltersList}>
              {(shelters.length > 0
                ? shelters
                : [
                    {
                      _id: '1',
                      name: 'Sugathadasa Indoor Complex',
                      location: { address: 'Mulleriyawa' },
                      totalCapacity: 4000,
                      currentOccupancy: 2300,
                      distanceKm: 3.5
                    },
                    {
                      _id: '2',
                      name: 'Kolonnawa Central Vidyalaya',
                      location: { address: 'Kelanimulla' },
                      totalCapacity: 2000,
                      currentOccupancy: 1200,
                      distanceKm: 2.1
                    },
                    {
                      _id: '3',
                      name: 'Sedawatta Rajamaha Vihara',
                      location: { address: 'Colombo' },
                      totalCapacity: 1200,
                      currentOccupancy: 110,
                      distanceKm: 4.2
                    }
                  ]
              ).map((sh, idx) => (
                <TouchableOpacity
                  key={sh._id || idx}
                  activeOpacity={0.88}
                  onPress={() => setSelectedShelter(sh)}
                  style={styles.shelterCard}
                >
                  <Image
                    source={{ uri: getShelterImage(idx) }}
                    style={styles.shelterImg}
                  />
                  <View style={styles.shelterBody}>
                    <Text style={styles.shelterName} numberOfLines={1}>
                      {sh.name}
                    </Text>
                    <View style={styles.shelterDistanceRow}>
                      <Ionicons name="location-sharp" size={13} color="#64748B" style={{ marginRight: 4 }} />
                      <Text style={styles.shelterDistanceText}>
                        {sh.distanceKm ? `${Number(sh.distanceKm).toFixed(1)} km • ` : '2.5 km • '}
                        {sh.location?.address || 'Colombo District'}
                      </Text>
                    </View>
                    <View style={styles.shelterBedsRow}>
                      <MaterialCommunityIcons name="bed" size={14} color="#64748B" style={{ marginRight: 6 }} />
                      <Text style={styles.shelterBedsText}>
                        {sh.currentOccupancy || 0} / {sh.totalCapacity || 100} beds
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 5: EMERGENCY INSTRUCTIONS */}
      {/* ========================================================================= */}
      {currentTab === 'instructions' && (
        <EmergencyInstructions onBack={() => setCurrentTab('home')} />
      )}

      {currentTab === 'home' && (
        <TouchableOpacity
          onPress={() => setContactsModalVisible(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Emergency contacts"
          accessibilityHint="Opens the emergency hotline numbers"
          style={styles.emergencyContactsButton}
        >
          <Ionicons name="call" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM NAVIGATION BAR (MATCHING SCREEN 3, 4, 5) */}
      {/* ========================================================================= */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          onPress={() => setCurrentTab('home')}
          style={styles.tabItem}
        >
          <Ionicons
            name={currentTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={currentTab === 'home' ? '#2563EB' : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabItemText,
              currentTab === 'home' && styles.tabItemTextActive
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentTab('shelters')}
          style={styles.tabItem}
        >
          <Ionicons
            name={currentTab === 'shelters' ? 'location' : 'location-outline'}
            size={22}
            color={currentTab === 'shelters' ? '#2563EB' : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabItemText,
              currentTab === 'shelters' && styles.tabItemTextActive
            ]}
          >
            Shelters
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentTab('instructions')}
          style={styles.tabItem}
        >
          <Ionicons
            name={currentTab === 'instructions' ? 'document-text' : 'document-text-outline'}
            size={22}
            color={currentTab === 'instructions' ? '#2563EB' : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabItemText,
              currentTab === 'instructions' && styles.tabItemTextActive
            ]}
          >
            Instructions
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================================= */}
      {/* MODAL: EMERGENCY CONTACTS */}
      {/* ========================================================================= */}
      <Modal
        visible={contactsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setContactsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Emergency Hotlines</Text>
              <TouchableOpacity onPress={() => setContactsModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.contactList}>
              {[
                { name: 'DMC National Emergency Hotline', number: '117', desc: '24/7 Disaster Operations' },
                { name: 'Suwa Seriya Ambulance', number: '1990', desc: 'Emergency Medical Service' },
                { name: 'Police Emergency Response', number: '119', desc: 'Law enforcement & search' },
                { name: 'Fire & Rescue Brigade', number: '110', desc: 'Fire & heavy extrication' },
                { name: 'NBRO Landslide Unit', number: '011 258 8946', desc: 'National Building Research' }
              ].map((c) => (
                <TouchableOpacity
                  key={c.number}
                  onPress={() => handleDial(c.number)}
                  style={styles.contactItem}
                >
                  <View style={styles.contactIconCircle}>
                    <Ionicons name="call" size={18} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.contactName}>{c.name}</Text>
                    <Text style={styles.contactDesc}>{c.desc}</Text>
                  </View>
                  <Text style={styles.contactNumber}>{c.number}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setContactsModalVisible(false)}
              style={styles.modalDoneBtn}
            >
              <Text style={styles.modalDoneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ALERT DETAIL */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedAlert}
        transparent={!alertMapExpanded}
        animationType="fade"
        onRequestClose={() => alertMapExpanded ? setAlertMapExpanded(false) : setSelectedAlert(null)}
      >
        <View style={alertMapExpanded ? styles.alertMapFullscreen : styles.modalBackdrop}>
          <View style={alertMapExpanded ? styles.alertMapFullscreenBody : [styles.modalCard, styles.alertDetailCard]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { flex: 1 }]}>{alertMapExpanded ? `Affected Area - ${getWarningLocation(selectedAlert).address}` : 'Disaster Warning'}</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={alertMapExpanded ? 'Exit full screen map' : 'Close warning'} onPress={() => alertMapExpanded ? setAlertMapExpanded(false) : setSelectedAlert(null)}>
                {alertMapExpanded && <Text style={styles.alertExpandText}>Exit full screen</Text>}
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedAlert && (alertMapExpanded ? renderWarningMap(Math.max(160, viewportHeight - 100)) : (
              <ScrollView style={{ flexShrink: 1 }}>
                <Image
                  source={{ uri: getWarningImage(selectedAlert) || getAlertImage(selectedAlert.disasterType) }}
                  style={styles.alertModalImg}
                />
                <Text style={styles.alertModalTitle}>{selectedAlert.title}</Text>
                <Text style={styles.alertModalLocation}>
                  📍 {selectedAlert.affectedArea?.address || `${selectedAlert.affectedDistrict} District`}
                </Text>
                <Text style={styles.alertModalDesc}>{selectedAlert.message}</Text>
                <View style={styles.alertMapCard}>
                  <View style={styles.alertMapHeadingRow}>
                    <Text style={styles.alertMapTitle}>Affected Area - {getWarningLocation(selectedAlert).address}</Text>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Expand affected area map" onPress={() => setAlertMapExpanded(true)} style={styles.alertExpandButton}>
                      <Feather name="maximize" size={18} color="#1D4ED8" />
                      <Text style={styles.alertExpandText}>Expand map</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.alertMapSubtitle}>{selectedAlert.title}{selectedAlert.affectedArea?.geometry ? ' - Custom boundary drawn' : ' - Reported location'}</Text>
                  {renderWarningMap(380)}
                </View>

                {selectedAlert.actionInstructions && selectedAlert.actionInstructions.length > 0 && (
                  <View style={styles.modalInstructionsBox}>
                    <Text style={styles.modalInstructionsHeading}>Safety Actions:</Text>
                    {selectedAlert.actionInstructions.map((inst, i) => (
                      <Text key={i} style={styles.modalInstBullet}>• {inst}</Text>
                    ))}
                  </View>
                )}
              </ScrollView>
            ))}

            {!alertMapExpanded && <TouchableOpacity
              onPress={() => setSelectedAlert(null)}
              style={styles.modalDoneBtn}
            >
              <Text style={styles.modalDoneBtnText}>Understood</Text>
            </TouchableOpacity>}
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: SHELTER DETAIL */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedShelter}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedShelter(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Shelter Facility</Text>
              <TouchableOpacity onPress={() => setSelectedShelter(null)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedShelter && (
              <View>
                <Text style={styles.alertModalTitle}>{selectedShelter.name}</Text>
                <Text style={styles.alertModalLocation}>
                  📍 {selectedShelter.location?.address || 'Colombo District'}
                </Text>

                <View style={styles.shelterBedDetailBox}>
                  <View style={styles.shelterBedStat}>
                    <Text style={styles.shelterBedStatLabel}>Total Bed Capacity</Text>
                    <Text style={styles.shelterBedStatValue}>{selectedShelter.totalCapacity} beds</Text>
                  </View>
                  <View style={styles.shelterBedStat}>
                    <Text style={styles.shelterBedStatLabel}>Current Occupancy</Text>
                    <Text style={styles.shelterBedStatValue}>{selectedShelter.currentOccupancy} beds</Text>
                  </View>
                </View>

                {selectedShelter.contactPhone && (
                  <TouchableOpacity
                    onPress={() => handleDial(selectedShelter.contactPhone)}
                    style={styles.shelterCallBtn}
                  >
                    <Ionicons name="call" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.shelterCallBtnText}>Call Shelter: {selectedShelter.contactPhone}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <TouchableOpacity
              onPress={() => setSelectedShelter(null)}
              style={[styles.modalDoneBtn, { marginTop: 14 }]}
            >
              <Text style={styles.modalDoneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  citizenGreetingBody: { flex: 1, minWidth: 180 },
  citizenRoleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  citizenStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  citizenRoleLabel: { color: '#1E3A8A', fontSize: 14, lineHeight: 21, fontWeight: '800', letterSpacing: 0.6 },
  citizenDistrict: { color: '#64748B', fontSize: 16, lineHeight: 24, fontWeight: '500', marginTop: 3 },
  alertDetailCard: { maxWidth: 960, maxHeight: '92%' },
  alertMapFullscreen: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },
  alertMapFullscreenBody: { flex: 1 },
  alertMapCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, marginBottom: 16 },
  alertMapHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  alertMapTitle: { flex: 1, fontSize: 18, lineHeight: 27, fontWeight: '700', color: '#1E3A8A' },
  alertExpandButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, backgroundColor: '#EFF6FF', borderRadius: 8 },
  alertExpandText: { color: '#1D4ED8', fontSize: 16, lineHeight: 24, fontWeight: '600' },
  alertMapSubtitle: { color: '#64748B', fontSize: 14, lineHeight: 21, marginVertical: 8 },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    alignSelf: 'center',
    maxWidth: 960,
    width: '100%',
    padding: 20,
    paddingBottom: 120
  },
  homeScrollContent: {
    paddingBottom: 160
  },
  emergencyContactsButton: {
    position: 'absolute',
    right: 18,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  topGreetingBar: {
    gap: 12,
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 8
  },
  greetingName: {
    color: '#0F172A',
    fontSize: 22, lineHeight: 33,
    fontWeight: '900'
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 10
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#DC2626',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 14, lineHeight: 21,
    fontWeight: '800'
  },
  profileLogoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionHeading: {
    color: '#0F172A',
    fontSize: 20, lineHeight: 30,
    fontWeight: '800'
  },
  viewAllText: {
    color: '#2563EB',
    fontSize: 16, lineHeight: 24,
    fontWeight: '700'
  },
  noAlertsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16
  },
  noAlertsText: {
    flexShrink: 1,
    color: '#64748B',
    fontSize: 16, lineHeight: 24,
    marginTop: 8
  },
  alertsList: {
    gap: 12,
    marginBottom: 24
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  alertCardImg: {
    width: 105,
    height: '100%',
    minHeight: 100,
    resizeMode: 'cover'
  },
  alertCardBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'center'
  },
  cardBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4
  },
  cardBadgeText: {
    fontSize: 14, lineHeight: 21,
    fontWeight: '800'
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 18, lineHeight: 27,
    fontWeight: '800',
    marginBottom: 4
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3
  },
  cardLocationText: {
    flexShrink: 1,
    color: '#64748B',
    fontSize: 14, lineHeight: 21,
    fontWeight: '500'
  },
  cardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardTimeText: {
    color: '#64748B',
    fontSize: 14, lineHeight: 21
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  headerBackBtn: {
    padding: 6,
    marginRight: 10
  },
  screenHeaderTitle: {
    color: '#0F172A',
    fontSize: 20, lineHeight: 30,
    fontWeight: '900'
  },
  segmentToggleBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  segmentBtnActive: {
    backgroundColor: '#1E3A8A'
  },
  segmentBtnText: {
    color: '#64748B',
    fontSize: 16, lineHeight: 24,
    fontWeight: '700'
  },
  segmentBtnTextActive: {
    color: '#FFFFFF'
  },
  shelterMapCanvas: {
    height: 240,
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  mapGridPattern: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)'
  },
  userLocationPulseBox: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  userLocationPulseOuter: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(37, 99, 235, 0.25)'
  },
  userLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    borderWidth: 3,
    borderColor: '#FFFFFF'
  },
  mapShelterPin: {
    position: 'absolute'
  },
  recenterMapBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  nearbySheltersHeading: {
    color: '#0F172A',
    fontSize: 20, lineHeight: 30,
    fontWeight: '800',
    marginBottom: 12
  },
  sheltersList: {
    gap: 12
  },
  shelterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4
  },
  shelterImg: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: 12
  },
  shelterBody: {
    flex: 1
  },
  shelterName: {
    color: '#0F172A',
    fontSize: 16, lineHeight: 24,
    fontWeight: '800',
    marginBottom: 4
  },
  shelterDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3
  },
  shelterDistanceText: {
    color: '#64748B',
    fontSize: 14, lineHeight: 21
  },
  shelterBedsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  shelterBedsText: {
    color: '#64748B',
    fontSize: 14, lineHeight: 21,
    fontWeight: '600'
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 6
  },
  tabItemText: {
    color: '#94A3B8',
    fontSize: 14, lineHeight: 21,
    fontWeight: '600',
    marginTop: 2
  },
  tabItemTextActive: {
    color: '#2563EB',
    fontWeight: '800'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 680,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 20, lineHeight: 30,
    fontWeight: '800'
  },
  contactList: {
    gap: 10
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  contactIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  contactName: {
    color: '#0F172A',
    fontSize: 16, lineHeight: 24,
    fontWeight: '700'
  },
  contactDesc: {
    color: '#64748B',
    fontSize: 14, lineHeight: 21
  },
  contactNumber: {
    color: '#DC2626',
    fontSize: 16, lineHeight: 24,
    fontWeight: '800'
  },
  modalDoneBtn: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 16, lineHeight: 24,
    fontWeight: '700'
  },
  alertModalImg: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12
  },
  alertModalTitle: {
    color: '#0F172A',
    fontSize: 20, lineHeight: 30,
    fontWeight: '800',
    marginBottom: 6
  },
  alertModalLocation: {
    flexShrink: 1,
    color: '#64748B',
    fontSize: 16, lineHeight: 24,
    marginBottom: 10
  },
  alertModalDesc: {
    color: '#334155',
    fontSize: 18,
    lineHeight: 27,
    marginBottom: 14
  },
  modalInstructionsBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10
  },
  modalInstructionsHeading: {
    color: '#1E3A8A',
    fontSize: 20, lineHeight: 30,
    fontWeight: '800',
    marginBottom: 6
  },
  modalInstBullet: {
    color: '#1E293B',
    fontSize: 16,
    lineHeight: 24
  },
  shelterBedDetailBox: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 14
  },
  shelterBedStat: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  shelterBedStatLabel: {
    color: '#64748B',
    fontSize: 14, lineHeight: 21,
    fontWeight: '600'
  },
  shelterBedStatValue: {
    color: '#0F172A',
    fontSize: 16, lineHeight: 24,
    fontWeight: '800',
    marginTop: 4
  },
  shelterCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10
  },
  shelterCallBtnText: {
    color: '#FFFFFF',
    fontSize: 16, lineHeight: 24,
    fontWeight: '700'
  }
});
