import React, { useState, useEffect } from 'react';
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
  Linking
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { alertService } from '../services/alertService';
import { shelterService } from '../services/shelterService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CitizenHomeView({ user, logout, router }) {
  // Navigation tabs matching panel 3, 4, 5 in mock: 'home' | 'shelters' | 'instructions'
  const [currentTab, setCurrentTab] = useState('home');

  // Screen 4 toggle: 'map' | 'list'
  const [shelterViewMode, setShelterViewMode] = useState('map');

  // Screen 5 filter: 'all' | 'floods' | 'landslides' | 'heavy_rain'
  const [instructionCategory, setInstructionCategory] = useState('all');

  // Data
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [shelters, setShelters] = useState([]);

  // Contacts Modal
  const [contactsModalVisible, setContactsModalVisible] = useState(false);

  // Selected Alert Detail Modal
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Selected Shelter Detail Modal
  const [selectedShelter, setSelectedShelter] = useState(null);

  const displayName = user?.name ? user.name.split(' ')[0] : 'Sahan';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsRes, sheltersRes] = await Promise.all([
        alertService.getActiveAlerts(),
        shelterService.getShelters({ district: user?.district || 'Colombo' })
      ]);
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
  };

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
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* Top Greeting Bar */}
          <View style={styles.topGreetingBar}>
            <View>
              <Text style={styles.greetingTitle}>
                Good Morning,{'\n'}
                <Text style={styles.greetingName}>{displayName} 👋</Text>
              </Text>
            </View>

            <View style={styles.topActionsRow}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/alerts')}
                style={styles.bellBtn}
              >
                <Ionicons name="notifications" size={24} color="#1E3A8A" />
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>3</Text>
                </View>
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

          {/* RED ACTIVE DISASTER BANNER */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (alerts.length > 0) setSelectedAlert(alerts[0]);
            }}
            style={styles.redAlertBanner}
          >
            <View style={styles.redAlertLeft}>
              <View style={styles.warningIconWhiteCircle}>
                <Ionicons name="warning" size={20} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.redAlertTitle}>
                  {alerts.length || 2} Active Disaster Alerts
                </Text>
                <Text style={styles.redAlertSubtitle}>in your area</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={22} color="#FFFFFF" />
          </TouchableOpacity>

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
                      source={{ uri: getAlertImage(alert.disasterType) }}
                      style={styles.alertCardImg}
                    />
                    <View style={styles.alertCardBody}>
                      <View style={[styles.cardBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.cardBadgeText, { color: badge.text }]}>
                          {badge.label}
                        </Text>
                      </View>
                      <Text style={styles.cardTitle} numberOfLines={1}>
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

          {/* 3 QUICK ACCESS BUTTONS (MATCHING SCREEN 3) */}
          <View style={styles.quickAccessRow}>
            {/* Nearby Shelters */}
            <TouchableOpacity
              onPress={() => setCurrentTab('shelters')}
              activeOpacity={0.85}
              style={styles.quickAccessCard}
            >
              <View style={styles.quickIconCircle}>
                <Ionicons name="home" size={24} color="#1E3A8A" />
              </View>
              <Text style={styles.quickAccessText}>Nearby{'\n'}Shelters</Text>
            </TouchableOpacity>

            {/* Emergency Instructions */}
            <TouchableOpacity
              onPress={() => setCurrentTab('instructions')}
              activeOpacity={0.85}
              style={styles.quickAccessCard}
            >
              <View style={styles.quickIconCircle}>
                <Ionicons name="document-text" size={24} color="#1E3A8A" />
              </View>
              <Text style={styles.quickAccessText}>Emergency{'\n'}Instructions</Text>
            </TouchableOpacity>

            {/* Emergency Contacts */}
            <TouchableOpacity
              onPress={() => setContactsModalVisible(true)}
              activeOpacity={0.85}
              style={styles.quickAccessCard}
            >
              <View style={[styles.quickIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="call" size={24} color="#DC2626" />
              </View>
              <Text style={styles.quickAccessText}>Emergency{'\n'}Contacts</Text>
            </TouchableOpacity>
          </View>
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
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.screenHeader}>
            <TouchableOpacity
              onPress={() => setCurrentTab('home')}
              style={styles.headerBackBtn}
            >
              <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>Emergency Instructions</Text>
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsScroll}
          >
            {[
              { id: 'all', label: 'All' },
              { id: 'floods', label: 'Floods' },
              { id: 'landslides', label: 'Landslides' },
              { id: 'heavy_rain', label: 'Heavy Rain' }
            ].map((cat) => {
              const isSel = instructionCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setInstructionCategory(cat.id)}
                  style={[
                    styles.instructionPill,
                    isSel && styles.instructionPillActive
                  ]}
                >
                  <Text
                    style={[
                      styles.instructionPillText,
                      isSel && styles.instructionPillTextActive
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Instruction Cards (Screen 5 mockup) */}
          <View style={styles.instructionsContainer}>
            {/* During Floods */}
            {(instructionCategory === 'all' || instructionCategory === 'floods') && (
              <View style={styles.instructionCard}>
                <View style={[styles.instIconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="warning" size={24} color="#DC2626" />
                </View>
                <View style={styles.instContent}>
                  <Text style={styles.instTitle}>During Floods</Text>
                  <Text style={styles.instBullet}>• Move to higher ground</Text>
                  <Text style={styles.instBullet}>• Avoid walking or driving through flood water</Text>
                  <Text style={styles.instBullet}>• Turn off electricity if water enters your home</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#DC2626" />
              </View>
            )}

            {/* During Landslides */}
            {(instructionCategory === 'all' || instructionCategory === 'landslides') && (
              <View style={styles.instructionCard}>
                <View style={[styles.instIconCircle, { backgroundColor: '#FFEDD5' }]}>
                  <Ionicons name="warning" size={24} color="#EA580C" />
                </View>
                <View style={styles.instContent}>
                  <Text style={styles.instTitle}>During Landslides</Text>
                  <Text style={styles.instBullet}>• Move away from hilly areas</Text>
                  <Text style={styles.instBullet}>• Watch for unusual sounds</Text>
                  <Text style={styles.instBullet}>• Do not return until authorities say it is safe</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#EA580C" />
              </View>
            )}

            {/* During Heavy Rain */}
            {(instructionCategory === 'all' || instructionCategory === 'heavy_rain') && (
              <View style={styles.instructionCard}>
                <View style={[styles.instIconCircle, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="warning" size={24} color="#7C3AED" />
                </View>
                <View style={styles.instContent}>
                  <Text style={styles.instTitle}>During Heavy Rain</Text>
                  <Text style={styles.instBullet}>• Stay indoors if possible</Text>
                  <Text style={styles.instBullet}>• Keep emergency supplies ready</Text>
                  <Text style={styles.instBullet}>• Avoid unnecessary travel</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#7C3AED" />
              </View>
            )}

            {/* General Safety Tips */}
            {instructionCategory === 'all' && (
              <View style={styles.instructionCard}>
                <View style={[styles.instIconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="shield-checkmark" size={24} color="#16A34A" />
                </View>
                <View style={styles.instContent}>
                  <Text style={styles.instTitle}>General Safety Tips</Text>
                  <Text style={styles.instBullet}>• Keep your phone charged</Text>
                  <Text style={styles.instBullet}>• Follow official alerts and instructions</Text>
                  <Text style={styles.instBullet}>• Help vulnerable people in your community</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#16A34A" />
              </View>
            )}
          </View>
        </ScrollView>
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
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAlert(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Disaster Warning</Text>
              <TouchableOpacity onPress={() => setSelectedAlert(null)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedAlert && (
              <ScrollView style={{ maxHeight: 380 }}>
                <Image
                  source={{ uri: getAlertImage(selectedAlert.disasterType) }}
                  style={styles.alertModalImg}
                />
                <Text style={styles.alertModalTitle}>{selectedAlert.title}</Text>
                <Text style={styles.alertModalLocation}>
                  📍 {selectedAlert.affectedArea?.address || `${selectedAlert.affectedDistrict} District`}
                </Text>
                <Text style={styles.alertModalDesc}>{selectedAlert.message}</Text>

                {selectedAlert.actionInstructions && selectedAlert.actionInstructions.length > 0 && (
                  <View style={styles.modalInstructionsBox}>
                    <Text style={styles.modalInstructionsHeading}>Safety Actions:</Text>
                    {selectedAlert.actionInstructions.map((inst, i) => (
                      <Text key={i} style={styles.modalInstBullet}>• {inst}</Text>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={() => setSelectedAlert(null)}
              style={styles.modalDoneBtn}
            >
              <Text style={styles.modalDoneBtnText}>Understood</Text>
            </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 90
  },
  topGreetingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 8
  },
  greetingTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '500'
  },
  greetingName: {
    color: '#0F172A',
    fontSize: 22,
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
    backgroundColor: '#EFF6FF',
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
    fontSize: 10,
    fontWeight: '800'
  },
  profileLogoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  redAlertBanner: {
    backgroundColor: '#E11D48',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#E11D48',
    shadowOpacity: 0.25,
    shadowRadius: 8
  },
  redAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  warningIconWhiteCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  redAlertTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  redAlertSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionHeading: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800'
  },
  viewAllText: {
    color: '#2563EB',
    fontSize: 13,
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
    color: '#64748B',
    fontSize: 13,
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
    fontSize: 10,
    fontWeight: '800'
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3
  },
  cardLocationText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500'
  },
  cardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardTimeText: {
    color: '#94A3B8',
    fontSize: 11
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  quickAccessCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1
  },
  quickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  quickAccessText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16
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
    fontSize: 20,
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
    fontSize: 13,
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
    fontSize: 17,
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
    fontSize: 14,
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
    fontSize: 11
  },
  shelterBedsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  shelterBedsText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600'
  },
  filterPillsScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 4
  },
  instructionPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE'
  },
  instructionPillActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A'
  },
  instructionPillText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700'
  },
  instructionPillTextActive: {
    color: '#FFFFFF'
  },
  instructionsContainer: {
    gap: 14
  },
  instructionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4
  },
  instIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  instContent: {
    flex: 1
  },
  instTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6
  },
  instBullet: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
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
    fontSize: 11,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
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
    fontSize: 17,
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
    fontSize: 13,
    fontWeight: '700'
  },
  contactDesc: {
    color: '#94A3B8',
    fontSize: 11
  },
  contactNumber: {
    color: '#DC2626',
    fontSize: 14,
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
    fontSize: 14,
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
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6
  },
  alertModalLocation: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 10
  },
  alertModalDesc: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 19,
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
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6
  },
  modalInstBullet: {
    color: '#1E293B',
    fontSize: 12,
    lineHeight: 18
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
    fontSize: 11,
    fontWeight: '600'
  },
  shelterBedStatValue: {
    color: '#0F172A',
    fontSize: 14,
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
    fontSize: 13,
    fontWeight: '700'
  }
});
