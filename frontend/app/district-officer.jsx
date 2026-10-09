import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { alertService } from '../services/alertService';
import { shelterService } from '../services/shelterService';
import { rescueService } from '../services/rescueService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DistrictOfficerScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { socket } = useSocket();

  // Active Sidebar Nav Item: 'dashboard' | 'shelters' | 'rescue_teams' | 'track_status' | 'reports'
  const [activeNav, setActiveNav] = useState('dashboard');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [sheltersLoading, setSheltersLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Data states
  const [activeDisasters, setActiveDisasters] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [teamCategories, setTeamCategories] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [activeMissions, setActiveMissions] = useState([]);
  const [currentTrackingMission, setCurrentTrackingMission] = useState(null);

  // Selected disaster for assigning shelter / rescue
  const [selectedDisaster, setSelectedDisaster] = useState(null);

  // District filter dropdown
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);

  // Profile menu dropdown
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Manage Shelters state
  const [shelterForm, setShelterForm] = useState({
    name: 'Galle Central College (Temporary Shelter)',
    address: 'Galle District',
    latitude: 6.037,
    longitude: 80.218,
    occupancyBeds: '150', // Number of beds
    currentOccupancy: '120'
  });
  const [editingShelter, setEditingShelter] = useState(null);
  const [editOccupancyVal, setEditOccupancyVal] = useState('');
  const [editCapacityVal, setEditCapacityVal] = useState('');
  const [shelterModalOpen, setShelterModalOpen] = useState(false);

  // Assign Rescue Team state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTeamUnit, setSelectedTeamUnit] = useState(null);
  const [dispatchDestination, setDispatchDestination] = useState('');
  const [dispatchInstructions, setDispatchInstructions] = useState('');
  const [dispatching, setDispatching] = useState(false);

  // View Details Modal for completed events (Panel 6)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState(null);

  // Load all initial data
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDisasters(),
        fetchShelters(),
        fetchRescueCategories(),
        fetchActiveMissions()
      ]);
    } catch (err) {
      console.warn('Error loading District Officer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Socket.IO real-time event listeners
  useEffect(() => {
    if (!socket) return;

    const handleMissionUpdated = (updatedMission) => {
      setActiveMissions((prev) =>
        prev.map((m) => (m._id === updatedMission._id ? updatedMission : m))
      );
      if (currentTrackingMission && currentTrackingMission._id === updatedMission._id) {
        setCurrentTrackingMission(updatedMission);
      }
    };

    const handleMissionCompleted = (completedMission) => {
      setActiveMissions((prev) =>
        prev.map((m) => (m._id === completedMission._id ? completedMission : m))
      );
      if (currentTrackingMission && currentTrackingMission._id === completedMission._id) {
        setCurrentTrackingMission(completedMission);
      }
      fetchDisasters();
      fetchRescueCategories();
    };

    const handleMissionAssigned = (newMission) => {
      setActiveMissions((prev) => [newMission, ...prev]);
      setCurrentTrackingMission(newMission);
      fetchRescueCategories();
    };

    const handleShelterUpdated = (updatedShelter) => {
      setShelters((prev) =>
        prev.map((s) => (s._id === updatedShelter._id ? updatedShelter : s))
      );
    };

    const handleShelterCreated = (newShelter) => {
      setShelters((prev) => [newShelter, ...prev]);
    };

    socket.on('mission_status_updated', handleMissionUpdated);
    socket.on('mission_update_message', handleMissionUpdated);
    socket.on('mission_completed', handleMissionCompleted);
    socket.on('mission_assigned', handleMissionAssigned);
    socket.on('shelter_updated', handleShelterUpdated);
    socket.on('shelter_created', handleShelterCreated);

    return () => {
      socket.off('mission_status_updated', handleMissionUpdated);
      socket.off('mission_update_message', handleMissionUpdated);
      socket.off('mission_completed', handleMissionCompleted);
      socket.off('mission_assigned', handleMissionAssigned);
      socket.off('shelter_updated', handleShelterUpdated);
      socket.off('shelter_created', handleShelterCreated);
    };
  }, [socket, currentTrackingMission]);

  // Fetch disaster warnings
  const fetchDisasters = async () => {
    try {
      setEventsLoading(true);
      const res = await alertService.getActiveAlerts();
      const list = res.data || [];
      setActiveDisasters(list);
      if (!selectedDisaster && list.length > 0) {
        setSelectedDisaster(list[0]);
      }
    } catch (err) {
      console.warn('Failed to fetch disaster events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  // Fetch shelters in Galle District
  const fetchShelters = async () => {
    try {
      setSheltersLoading(true);
      const res = await shelterService.getShelters({ district: 'Galle' });
      const data = res.data || [];
      // Ensure defaults if database has fewer than 3
      if (data.length === 0) {
        setShelters([
          { _id: '1', name: 'Galle Central College', location: { address: 'Galle' }, totalCapacity: 150, currentOccupancy: 120, status: 'open' },
          { _id: '2', name: 'Hikkaduwa School', location: { address: 'Hikkaduwa' }, totalCapacity: 100, currentOccupancy: 100, status: 'full' },
          { _id: '3', name: 'Unawatuna Community Hall', location: { address: 'Unawatuna' }, totalCapacity: 80, currentOccupancy: 45, status: 'open' }
        ]);
      } else {
        setShelters(data);
      }
    } catch (err) {
      console.warn('Failed to fetch shelters:', err);
    } finally {
      setSheltersLoading(false);
    }
  };

  // Fetch rescue categories (4 types)
  const fetchRescueCategories = async () => {
    try {
      setTeamsLoading(true);
      const res = await rescueService.getCategories({ district: 'Galle' });
      setTeamCategories(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch rescue categories:', err);
    } finally {
      setTeamsLoading(false);
    }
  };

  // Fetch active missions
  const fetchActiveMissions = async () => {
    try {
      const res = await rescueService.getMissions({ district: 'Galle' });
      const missions = res.data || [];
      setActiveMissions(missions);
      if (missions.length > 0) {
        setCurrentTrackingMission(missions[0]);
      }
    } catch (err) {
      console.warn('Failed to fetch active missions:', err);
    }
  };

  // Save new shelter (Panel 3)
  const handleSaveShelter = async () => {
    if (!shelterForm.name.trim()) {
      Alert.alert('Required', 'Please enter shelter name.');
      return;
    }

    try {
      const beds = parseInt(shelterForm.occupancyBeds, 10) || 150;
      await shelterService.createShelter({
        name: shelterForm.name.trim(),
        address: shelterForm.address.trim(),
        district: 'Galle',
        latitude: parseFloat(shelterForm.latitude) || 6.037,
        longitude: parseFloat(shelterForm.longitude) || 80.218,
        totalCapacity: beds,
        currentOccupancy: parseInt(shelterForm.currentOccupancy, 10) || 0
      });

      Alert.alert('Success', 'Shelter created successfully.');
      fetchShelters();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not save shelter.');
    }
  };

  // Update shelter occupancy (Panel 3 table action)
  const handleUpdateShelterOccupancy = async () => {
    if (!editingShelter) return;
    try {
      const payload = {};
      if (editOccupancyVal !== '') payload.currentOccupancy = parseInt(editOccupancyVal, 10);
      if (editCapacityVal !== '') payload.totalCapacity = parseInt(editCapacityVal, 10);

      await shelterService.updateOccupancy(editingShelter._id, payload);
      setShelterModalOpen(false);
      setEditingShelter(null);
      fetchShelters();
      Alert.alert('Updated', 'Shelter details updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update occupancy.');
    }
  };

  // Open Assign Team modal (Panel 4)
  const handleOpenAssignModal = async (category) => {
    setSelectedCategory(category);
    try {
      const res = await rescueService.getTeams({ type: category.type, district: 'Galle' });
      const list = res.data || [];
      setAvailableTeams(list);
      if (list.length > 0) setSelectedTeamUnit(list[0]);
      setDispatchDestination('Multiple DS Divisions, Galle District');
      setDispatchInstructions('Deploy immediate flood rescue operations along Gin Ganga basin.');
      setAssignModalOpen(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to retrieve available rescue teams.');
    }
  };

  // Confirm Dispatch (Panel 4 -> Panel 5)
  const handleConfirmDispatch = async () => {
    if (!selectedTeamUnit) {
      Alert.alert('Rescue Unit Required', 'Please select a rescue unit before dispatching.');
      return;
    }

    setDispatching(true);
    try {
      const payload = {
        disasterEventId: selectedDisaster?._id || null,
        disasterTitle: selectedDisaster?.title || 'Severe Flooding - Galle District',
        teamType: selectedCategory?.type || selectedTeamUnit.type,
        teamId: selectedTeamUnit._id,
        district: 'Galle',
        destinationAddress: dispatchDestination || 'Multiple DS Divisions, Galle District',
        destinationLat: 6.046,
        destinationLng: 80.216,
        instructions: [dispatchInstructions]
      };

      const res = await rescueService.assignTeam(payload);
      setAssignModalOpen(false);
      await fetchRescueCategories();
      await fetchActiveMissions();

      setCurrentTrackingMission(res.data);
      setActiveNav('track_status');
      Alert.alert('Dispatched', `${selectedTeamUnit.name} has been deployed!`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Dispatch failed.');
    } finally {
      setDispatching(false);
    }
  };

  // Icon helper for disaster cards
  const renderDisasterIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('flood')) {
      return (
        <View style={[styles.disasterIconContainer, { backgroundColor: '#FEE2E2' }]}>
          <MaterialCommunityIcons name="waves" size={28} color="#DC2626" />
        </View>
      );
    }
    if (t.includes('rain') || t.includes('wind')) {
      return (
        <View style={[styles.disasterIconContainer, { backgroundColor: '#FEF3C7' }]}>
          <MaterialCommunityIcons name="weather-pouring" size={28} color="#0284C7" />
        </View>
      );
    }
    return (
      <View style={[styles.disasterIconContainer, { backgroundColor: '#FEE2E2' }]}>
        <MaterialCommunityIcons name="image-filter-hdr" size={28} color="#DC2626" />
      </View>
    );
  };

  return (
    <View style={styles.windowContainer}>
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (DARK NAVY - MATCHING IMAGES) */}
      {/* ========================================================================= */}
      <View style={styles.sidebar}>
        {/* Logo at Top */}
        <View style={styles.sidebarLogoBox}>
          <View style={styles.goldCrestIcon}>
            <MaterialCommunityIcons name="shield-sun" size={22} color="#F59E0B" />
          </View>
          <View>
            <Text style={styles.sidebarLogoTitle}>DMC SRI LANKA</Text>
            <Text style={styles.sidebarLogoSubtitle}>DISTRICT OFFICER</Text>
          </View>
        </View>

        {/* Navigation Menu Items */}
        <View style={styles.sidebarMenu}>
          {/* Dashboard */}
          <TouchableOpacity
            onPress={() => setActiveNav('dashboard')}
            style={[
              styles.navItem,
              activeNav === 'dashboard' && styles.navItemActive
            ]}
          >
            <Feather
              name="home"
              size={18}
              color={activeNav === 'dashboard' ? '#FFFFFF' : '#94A3B8'}
              style={styles.navItemIcon}
            />
            <Text
              style={[
                styles.navItemText,
                activeNav === 'dashboard' && styles.navItemTextActive
              ]}
            >
              Dashboard
            </Text>
          </TouchableOpacity>

          {/* Shelters */}
          <TouchableOpacity
            onPress={() => setActiveNav('shelters')}
            style={[
              styles.navItem,
              activeNav === 'shelters' && styles.navItemActive
            ]}
          >
            <MaterialCommunityIcons
              name="tent"
              size={19}
              color={activeNav === 'shelters' ? '#FFFFFF' : '#94A3B8'}
              style={styles.navItemIcon}
            />
            <Text
              style={[
                styles.navItemText,
                activeNav === 'shelters' && styles.navItemTextActive
              ]}
            >
              Shelters
            </Text>
          </TouchableOpacity>

          {/* Rescue Teams */}
          <TouchableOpacity
            onPress={() => {
              if (activeDisasters.length > 0 && !selectedDisaster) {
                setSelectedDisaster(activeDisasters[0]);
              }
              setActiveNav('rescue_teams');
            }}
            style={[
              styles.navItem,
              activeNav === 'rescue_teams' && styles.navItemActive
            ]}
          >
            <Feather
              name="users"
              size={18}
              color={activeNav === 'rescue_teams' ? '#FFFFFF' : '#94A3B8'}
              style={styles.navItemIcon}
            />
            <Text
              style={[
                styles.navItemText,
                activeNav === 'rescue_teams' && styles.navItemTextActive
              ]}
            >
              Rescue Teams
            </Text>
          </TouchableOpacity>

          {/* Track Status */}
          <TouchableOpacity
            onPress={() => setActiveNav('track_status')}
            style={[
              styles.navItem,
              activeNav === 'track_status' && styles.navItemActive
            ]}
          >
            <Feather
              name="map-pin"
              size={18}
              color={activeNav === 'track_status' ? '#FFFFFF' : '#94A3B8'}
              style={styles.navItemIcon}
            />
            <Text
              style={[
                styles.navItemText,
                activeNav === 'track_status' && styles.navItemTextActive
              ]}
            >
              Track Status
            </Text>
          </TouchableOpacity>

          {/* Reports */}
          <TouchableOpacity
            onPress={() => setActiveNav('reports')}
            style={[
              styles.navItem,
              activeNav === 'reports' && styles.navItemActive
            ]}
          >
            <Feather
              name="file-text"
              size={18}
              color={activeNav === 'reports' ? '#FFFFFF' : '#94A3B8'}
              style={styles.navItemIcon}
            />
            <Text
              style={[
                styles.navItemText,
                activeNav === 'reports' && styles.navItemTextActive
              ]}
            >
              Reports
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA (LIGHT THEME - MATCHING IMAGES) */}
      {/* ========================================================================= */}
      <View style={styles.mainContent}>
        {/* Top Header Bar */}
        <View style={styles.topHeaderBar}>
          <View />
          <View style={styles.topHeaderRight}>
            {/* Notification Bell with Badge */}
            <TouchableOpacity
              onPress={() => Alert.alert('Notifications', '3 Active disaster updates received.')}
              style={styles.bellBtn}
            >
              <Feather name="bell" size={19} color="#475569" />
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {activeNav === 'shelters' ? '1' : '3'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* User Profile Pill Dropdown */}
            <TouchableOpacity
              onPress={() => setProfileDropdownOpen(!profileDropdownOpen)}
              style={styles.profilePill}
            >
              <Text style={styles.profilePillText}>Galle District Officer</Text>
              <Feather name="chevron-down" size={16} color="#64748B" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            {/* Profile Menu Popup */}
            {profileDropdownOpen && (
              <View style={styles.profileDropdownMenu}>
                <View style={styles.profileInfoBox}>
                  <Text style={styles.profileUserName}>Sunil Jayawardena</Text>
                  <Text style={styles.profileUserRole}>District Officer • Galle</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setProfileDropdownOpen(false);
                    logout();
                    router.replace('/(auth)/login');
                  }}
                  style={styles.logoutMenuItem}
                >
                  <Feather name="log-out" size={14} color="#DC2626" style={{ marginRight: 8 }} />
                  <Text style={styles.logoutMenuText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Scrollable View Content */}
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentInner}>
          {/* ========================================================================= */}
          {/* PANEL 2 & PANEL 6: DASHBOARD (ACTIVE & COMPLETED EVENTS) */}
          {/* ========================================================================= */}
          {activeNav === 'dashboard' && (
            <View>
              {/* Header Row with Title & District Dropdown */}
              <View style={styles.dashboardHeaderRow}>
                <View>
                  <Text style={styles.dashboardTitle}>
                    {activeMissions.some((m) => m.status === 'completed')
                      ? 'Disaster Events Dashboard'
                      : 'Active Disaster Events'}
                  </Text>
                  <Text style={styles.dashboardSubtitle}>
                    {activeMissions.some((m) => m.status === 'completed')
                      ? 'Monitor all disaster events and their current status.'
                      : 'Disaster warnings and events from DMC Headquarters'}
                  </Text>
                </View>

                {/* All Districts Dropdown */}
                <TouchableOpacity
                  onPress={() => setDistrictDropdownOpen(!districtDropdownOpen)}
                  style={styles.districtDropdownBtn}
                >
                  <Text style={styles.districtDropdownText}>{districtFilter}</Text>
                  <Feather name="chevron-down" size={15} color="#475569" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>

              {/* District Dropdown Menu */}
              {districtDropdownOpen && (
                <View style={styles.districtMenuBox}>
                  {['All Districts', 'Galle', 'Matara', 'Ratnapura', 'Colombo'].map((d) => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => {
                        setDistrictFilter(d);
                        setDistrictDropdownOpen(false);
                      }}
                      style={styles.districtMenuItem}
                    >
                      <Text style={[styles.districtMenuText, districtFilter === d && { color: '#0066FF', fontWeight: '700' }]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Disaster Event Cards List (Matching Panel 2 & Panel 6) */}
              <View style={styles.disastersList}>
                {/* 1. SEVERE FLOODING CARD */}
                {(() => {
                  const isCompleted = activeMissions.some(
                    (m) =>
                      m.status === 'completed' &&
                      (m.title?.includes('Flooding') || m.disasterEventId?.title?.includes('Flooding'))
                  );
                  return (
                    <View
                      style={[
                        styles.disasterCard,
                        isCompleted
                          ? styles.disasterCardCompleted
                          : styles.disasterCardPink
                      ]}
                    >
                      {/* Left Icon */}
                      <View style={styles.disasterCardLeft}>
                        {renderDisasterIcon('flood')}
                        <View style={{ marginLeft: 16 }}>
                          <Text style={styles.disasterTitle}>Severe Flooding</Text>
                          <View style={styles.locationLine}>
                            <Feather name="map-pin" size={13} color="#64748B" style={{ marginRight: 4 }} />
                            <Text style={styles.locationLineText}>Galle District</Text>
                          </View>
                          <View style={styles.locationLine}>
                            <Feather name="map-pin" size={13} color="#64748B" style={{ marginRight: 4 }} />
                            <Text style={styles.locationLineText}>Multiple DS Divisions</Text>
                          </View>
                        </View>
                      </View>

                      {/* Middle Badge & Timestamp */}
                      <View style={styles.disasterCardMid}>
                        <View style={styles.highBadge}>
                          <Text style={styles.highBadgeText}>High</Text>
                        </View>
                        <Text style={styles.timePrimaryText}>Today, 08:30 AM</Text>
                        <Text style={styles.timeSecondaryText}>
                          {isCompleted ? '' : '2 hours ago'}
                        </Text>
                      </View>

                      {/* Status Tag for Completed State (Panel 6) */}
                      {isCompleted && (
                        <View style={styles.completedTagBox}>
                          <View style={styles.completedPill}>
                            <Text style={styles.completedPillText}>Completed</Text>
                          </View>
                          <Text style={styles.completedTimeText}>Today, 02:15 PM</Text>
                        </View>
                      )}

                      {/* Right Action Buttons */}
                      <View style={styles.disasterCardActions}>
                        {isCompleted ? (
                          <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                              onPress={() => {
                                setDetailsEvent({
                                  title: 'Severe Flooding - Galle District',
                                  location: 'Multiple DS Divisions, Galle',
                                  status: 'Completed',
                                  completedAt: 'Today, 02:15 PM',
                                  peopleRescued: 14,
                                  summary: 'All 14 marooned families evacuated safely to Galle Central College shelter.'
                                });
                                setDetailsModalOpen(true);
                              }}
                              style={styles.viewDetailsBtn}
                            >
                              <Text style={styles.viewDetailsBtnText}>View Details</Text>
                            </TouchableOpacity>

                            <View style={styles.trackingCompletedBtn}>
                              <Text style={styles.trackingCompletedBtnText}>Tracking Completed</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.stackedActionBtns}>
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedDisaster(activeDisasters[0]);
                                setActiveNav('shelters');
                              }}
                              style={styles.solidBlueBtn}
                            >
                              <Text style={styles.solidBlueBtnText}>Manage Shelters</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => {
                                setSelectedDisaster(activeDisasters[0]);
                                setActiveNav('rescue_teams');
                              }}
                              style={styles.outlineBlueBtn}
                            >
                              <Text style={styles.outlineBlueBtnText}>Assign Rescue Team</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })()}

                {/* 2. HEAVY RAINFALL CARD */}
                <View style={[styles.disasterCard, styles.disasterCardAmber]}>
                  {/* Left Icon */}
                  <View style={styles.disasterCardLeft}>
                    {renderDisasterIcon('rain')}
                    <View style={{ marginLeft: 16 }}>
                      <Text style={styles.disasterTitle}>Heavy Rainfall</Text>
                      <View style={styles.locationLine}>
                        <Feather name="map-pin" size={13} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.locationLineText}>Matara District</Text>
                      </View>
                      <View style={styles.locationLine}>
                        <Feather name="map-pin" size={13} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.locationLineText}>Coastal Areas</Text>
                      </View>
                    </View>
                  </View>

                  {/* Middle Badge & Timestamp */}
                  <View style={styles.disasterCardMid}>
                    <View style={styles.mediumBadge}>
                      <Text style={styles.mediumBadgeText}>Medium</Text>
                    </View>
                    <Text style={styles.timePrimaryText}>Today, 06:15 AM</Text>
                    <Text style={styles.timeSecondaryText}>4 hours ago</Text>
                  </View>

                  {/* Right Action Buttons */}
                  <View style={styles.disasterCardActions}>
                    <View style={styles.stackedActionBtns}>
                      <TouchableOpacity
                        onPress={() => setActiveNav('shelters')}
                        style={styles.solidBlueBtn}
                      >
                        <Text style={styles.solidBlueBtnText}>Manage Shelters</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setActiveNav('rescue_teams')}
                        style={styles.outlineBlueBtn}
                      >
                        <Text style={styles.outlineBlueBtnText}>Assign Rescue Team</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* 3. LANDSLIDE RISK CARD */}
                <View style={[styles.disasterCard, styles.disasterCardPink]}>
                  {/* Left Icon */}
                  <View style={styles.disasterCardLeft}>
                    {renderDisasterIcon('landslide')}
                    <View style={{ marginLeft: 16 }}>
                      <Text style={styles.disasterTitle}>Landslide Risk</Text>
                      <View style={styles.locationLine}>
                        <Feather name="map-pin" size={13} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.locationLineText}>Ratnapura District</Text>
                      </View>
                      <View style={styles.locationLine}>
                        <Feather name="map-pin" size={13} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.locationLineText}>Hillside Areas</Text>
                      </View>
                    </View>
                  </View>

                  {/* Middle Badge & Timestamp */}
                  <View style={styles.disasterCardMid}>
                    <View style={styles.highBadge}>
                      <Text style={styles.highBadgeText}>High</Text>
                    </View>
                    <Text style={styles.timePrimaryText}>Today, 05:40 AM</Text>
                    <Text style={styles.timeSecondaryText}>5 hours ago</Text>
                  </View>

                  {/* Right Action Buttons */}
                  <View style={styles.disasterCardActions}>
                    <View style={styles.stackedActionBtns}>
                      <TouchableOpacity
                        onPress={() => setActiveNav('shelters')}
                        style={styles.solidBlueBtn}
                      >
                        <Text style={styles.solidBlueBtnText}>Manage Shelters</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setActiveNav('rescue_teams')}
                        style={styles.outlineBlueBtn}
                      >
                        <Text style={styles.outlineBlueBtnText}>Assign Rescue Team</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ========================================================================= */}
          {/* PANEL 3: MANAGE SHELTERS / CREATE SHELTER */}
          {/* ========================================================================= */}
          {activeNav === 'shelters' && (
            <View>
              {/* Header Row */}
              <View style={styles.dashboardHeaderRow}>
                <View>
                  <Text style={styles.dashboardTitle}>Manage Shelters</Text>
                  <Text style={styles.dashboardSubtitle}>
                    Create and manage evacuation shelters in your district.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setShelterForm({
                      name: '',
                      address: 'Galle District',
                      latitude: 6.037,
                      longitude: 80.218,
                      occupancyBeds: '100',
                      currentOccupancy: '0'
                    });
                  }}
                  style={styles.createNewShelterBtn}
                >
                  <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.createNewShelterBtnText}>Create New Shelter</Text>
                </TouchableOpacity>
              </View>

              {/* Two Column Section: Create Shelter (Left) & Map View (Right) */}
              <View style={styles.shelterSplitRow}>
                {/* Left Card: Create Shelter Form */}
                <View style={styles.createShelterCard}>
                  <Text style={styles.cardInternalTitle}>Create Shelter</Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Shelter Name *</Text>
                    <TextInput
                      value={shelterForm.name}
                      onChangeText={(t) => setShelterForm({ ...shelterForm, name: t })}
                      placeholder="Galle Central College (Temporary Shelter)"
                      placeholderTextColor="#94A3B8"
                      style={styles.lightTextInput}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>District / Location *</Text>
                    <View style={styles.inputWithIcon}>
                      <TextInput
                        value={shelterForm.address}
                        onChangeText={(t) => setShelterForm({ ...shelterForm, address: t })}
                        placeholder="Galle District"
                        placeholderTextColor="#94A3B8"
                        style={styles.lightTextInputInner}
                      />
                      <Feather name="map-pin" size={16} color="#64748B" style={styles.inputEndIcon} />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Total Capacity (Beds) *</Text>
                    <TextInput
                      value={shelterForm.occupancyBeds}
                      onChangeText={(t) => setShelterForm({ ...shelterForm, occupancyBeds: t })}
                      keyboardType="numeric"
                      placeholder="150"
                      placeholderTextColor="#94A3B8"
                      style={styles.lightTextInput}
                    />
                  </View>

                  {/* Info Notice (Exact copy from Mockup) */}
                  <View style={styles.occupancyInfoNotice}>
                    <Feather name="info" size={15} color="#0066FF" style={{ marginRight: 8 }} />
                    <Text style={styles.occupancyInfoText}>
                      Enter the total number of beds, including occupied beds.
                    </Text>
                  </View>

                  {/* Place Pin on Map Button */}
                  <TouchableOpacity
                    onPress={() => Alert.alert('Pin Placed', 'Location marker placed on the map in Galle.')}
                    style={styles.placePinBtn}
                  >
                    <Feather name="map-pin" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.placePinBtnText}>Place Pin on Map</Text>
                  </TouchableOpacity>
                </View>

                {/* Right Card: Map View */}
                <View style={styles.shelterMapCard}>
                  <View style={styles.coastalMapCanvas}>
                    {/* Map Grid & Background */}
                    <View style={styles.mapCanvasGrid} />

                    {/* Coastal Place Names */}
                    <Text style={[styles.mapPlaceName, { top: 24, left: 35 }]}>Ahangama</Text>
                    <Text style={[styles.mapPlaceName, { top: 75, left: 45 }]}>Hikkaduwa</Text>
                    <Text style={[styles.mapPlaceName, { top: 120, right: 35 }]}>Unawatuna</Text>
                    <Text style={[styles.mapPlaceName, { bottom: 30, left: 95 }]}>Galle</Text>

                    {/* Zoom Buttons on Top Right */}
                    <View style={styles.mapZoomControls}>
                      <TouchableOpacity style={styles.zoomBtn}>
                        <Feather name="plus" size={14} color="#0F172A" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.zoomBtn}>
                        <Feather name="minus" size={14} color="#0F172A" />
                      </TouchableOpacity>
                    </View>

                    {/* Red Marker with Tooltip */}
                    <View style={styles.mapMarkerCenter}>
                      <View style={styles.markerTooltipBubble}>
                        <Text style={styles.markerTooltipTitle}>
                          {shelterForm.name || 'Galle Central College (Temporary Shelter)'}
                        </Text>
                      </View>
                      <Ionicons name="location-sharp" size={32} color="#DC2626" />
                    </View>
                  </View>

                  {/* Save Shelter Button below map */}
                  <TouchableOpacity
                    onPress={handleSaveShelter}
                    style={styles.saveShelterBtn}
                  >
                    <Feather name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveShelterBtnText}>Save Shelter</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom Table: Shelter List (Galle District) */}
              <View style={styles.shelterTableCard}>
                <Text style={styles.tableCardTitle}>Shelter List (Galle District)</Text>

                <View style={styles.tableWrapper}>
                  {/* Table Header */}
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.thCol, { width: 40 }]}>#</Text>
                    <Text style={[styles.thCol, { flex: 2 }]}>Shelter Name</Text>
                    <Text style={[styles.thCol, { flex: 1.5 }]}>Location</Text>
                    <Text style={[styles.thCol, { flex: 1.5, textAlign: 'center' }]}>Occupancy (Beds)</Text>
                    <Text style={[styles.thCol, { flex: 1.2, textAlign: 'center' }]}>Current</Text>
                    <Text style={[styles.thCol, { flex: 1.2, textAlign: 'center' }]}>Status</Text>
                    <Text style={[styles.thCol, { flex: 1.2, textAlign: 'center' }]}>Actions</Text>
                  </View>

                  {/* Table Rows */}
                  {shelters.map((item, index) => {
                    const isFull = item.status === 'full' || item.currentOccupancy >= item.totalCapacity;
                    return (
                      <View key={item._id || index} style={styles.tableDataRow}>
                        <Text style={[styles.tdCol, { width: 40 }]}>{index + 1}</Text>
                        <Text style={[styles.tdCol, styles.tdBold, { flex: 2 }]}>{item.name}</Text>
                        <Text style={[styles.tdCol, { flex: 1.5 }]}>
                          {item.location?.address?.split(',')[0] || 'Galle'}
                        </Text>
                        <Text style={[styles.tdCol, { flex: 1.5, textAlign: 'center' }]}>
                          {item.totalCapacity}
                        </Text>
                        <Text style={[styles.tdCol, { flex: 1.2, textAlign: 'center' }]}>
                          {item.currentOccupancy}
                        </Text>
                        <View style={[styles.tdCol, { flex: 1.2, alignItems: 'center' }]}>
                          {isFull ? (
                            <View style={styles.statusPillFull}>
                              <Feather name="alert-circle" size={11} color="#DC2626" style={{ marginRight: 4 }} />
                              <Text style={styles.statusPillFullText}>Full</Text>
                            </View>
                          ) : (
                            <View style={styles.statusPillOpen}>
                              <Feather name="check" size={11} color="#16A34A" style={{ marginRight: 4 }} />
                              <Text style={styles.statusPillOpenText}>Open</Text>
                            </View>
                          )}
                        </View>
                        <View style={[styles.tdCol, { flex: 1.2, alignItems: 'center' }]}>
                          <TouchableOpacity
                            onPress={() => {
                              setEditingShelter(item);
                              setEditOccupancyVal(String(item.currentOccupancy));
                              setEditCapacityVal(String(item.totalCapacity));
                              setShelterModalOpen(true);
                            }}
                            style={styles.tableUpdateBtn}
                          >
                            <Text style={styles.tableUpdateBtnText}>Update</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* ========================================================================= */}
          {/* PANEL 4: ASSIGN RESCUE TEAM */}
          {/* ========================================================================= */}
          {activeNav === 'rescue_teams' && (
            <View>
              {/* Header */}
              <View style={styles.dashboardHeaderRow}>
                <View>
                  <Text style={styles.dashboardTitle}>Assign Rescue Team</Text>
                  <Text style={styles.dashboardSubtitle}>
                    Select a disaster event and deploy an available rescue team.
                  </Text>
                </View>
              </View>

              {/* Selected Disaster Banner (Top Red Box) */}
              <View style={styles.selectedEventCardPink}>
                <View style={styles.bannerIconTriangle}>
                  <Ionicons name="warning" size={24} color="#DC2626" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.bannerDisasterTitle}>
                    {selectedDisaster?.title || 'Severe Flooding - Galle District'}
                  </Text>
                  <View style={styles.locationLine}>
                    <Feather name="map-pin" size={13} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.locationLineText}>
                      {selectedDisaster?.affectedArea?.address || 'Multiple DS Divisions'}
                    </Text>
                  </View>
                </View>

                <View style={styles.bannerRightBadgeCol}>
                  <View style={styles.highBadge}>
                    <Text style={styles.highBadgeText}>High</Text>
                  </View>
                  <Text style={styles.bannerTimeText}>Today, 08:30 AM</Text>
                </View>
              </View>

              {/* Section Subheading matching media_1791460456297_a5cc53be.png */}
              <Text style={styles.availableTeamsHeading}>Available Rescue Teams</Text>
              <Text style={styles.availableTeamsSub}>
                Select from 4 specialized regional rescue units to deploy into the disaster zone.
              </Text>

              {/* 2x2 Grid of 4 Categories */}
              <View style={styles.rescueTeamsGrid}>
                {/* 1. Water Rescue Team */}
                <View style={styles.rescueCategoryCard}>
                  <View style={[styles.catCardIconCircle, { backgroundColor: '#DBEAFE' }]}>
                    <MaterialCommunityIcons name="sail-boat" size={28} color="#1D4ED8" />
                  </View>
                  <Text style={styles.catCardTitle}>Water Rescue Team</Text>
                  <Text style={styles.catCardDesc}>
                    Specialized in flood and water rescue operations
                  </Text>
                  <View style={styles.catCardAvailableBadge}>
                    <Feather name="check" size={12} color="#16A34A" style={{ marginRight: 4 }} />
                    <Text style={styles.catCardAvailableText}>2 Available Teams</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleOpenAssignModal({ type: 'water_rescue', typeName: 'Water Rescue Team' })}
                    style={styles.assignTeamSolidBtn}
                  >
                    <Feather name="user-plus" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.assignTeamSolidBtnText}>Assign Team</Text>
                  </TouchableOpacity>
                </View>

                {/* 2. Medical Response Team */}
                <View style={styles.rescueCategoryCard}>
                  <View style={[styles.catCardIconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <MaterialCommunityIcons name="ambulance" size={28} color="#DC2626" />
                  </View>
                  <Text style={styles.catCardTitle}>Medical Response Team</Text>
                  <Text style={styles.catCardDesc}>
                    Provide emergency medical care and first aid
                  </Text>
                  <View style={styles.catCardAvailableBadge}>
                    <Feather name="check" size={12} color="#16A34A" style={{ marginRight: 4 }} />
                    <Text style={styles.catCardAvailableText}>4 Available Teams</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleOpenAssignModal({ type: 'medical_response', typeName: 'Medical Response Team' })}
                    style={styles.assignTeamSolidBtn}
                  >
                    <Feather name="user-plus" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.assignTeamSolidBtnText}>Assign Team</Text>
                  </TouchableOpacity>
                </View>

                {/* 3. Fire & Rescue Team */}
                <View style={styles.rescueCategoryCard}>
                  <View style={[styles.catCardIconCircle, { backgroundColor: '#FFEDD5' }]}>
                    <MaterialCommunityIcons name="fire-truck" size={28} color="#EA580C" />
                  </View>
                  <Text style={styles.catCardTitle}>Fire & Rescue Team</Text>
                  <Text style={styles.catCardDesc}>
                    Fire suppression and technical rescue
                  </Text>
                  <View style={styles.catCardAvailableBadge}>
                    <Feather name="check" size={12} color="#16A34A" style={{ marginRight: 4 }} />
                    <Text style={styles.catCardAvailableText}>2 Available Teams</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleOpenAssignModal({ type: 'fire_rescue', typeName: 'Fire & Rescue Team' })}
                    style={styles.assignTeamSolidBtn}
                  >
                    <Feather name="user-plus" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.assignTeamSolidBtnText}>Assign Team</Text>
                  </TouchableOpacity>
                </View>

                {/* 4. Evacuation Support Team */}
                <View style={styles.rescueCategoryCard}>
                  <View style={[styles.catCardIconCircle, { backgroundColor: '#DCFCE7' }]}>
                    <MaterialCommunityIcons name="bus-alert" size={28} color="#16A34A" />
                  </View>
                  <Text style={styles.catCardTitle}>Evacuation Support Team</Text>
                  <Text style={styles.catCardDesc}>
                    Support evacuation and community assistance
                  </Text>
                  <View style={styles.catCardAvailableBadge}>
                    <Feather name="check" size={12} color="#16A34A" style={{ marginRight: 4 }} />
                    <Text style={styles.catCardAvailableText}>5 Available Teams</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleOpenAssignModal({ type: 'evacuation_support', typeName: 'Evacuation Support Team' })}
                    style={styles.assignTeamSolidBtn}
                  >
                    <Feather name="user-plus" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.assignTeamSolidBtnText}>Assign Team</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ========================================================================= */}
          {/* PANEL 5: TRACK RESCUE TEAM STATUS */}
          {/* ========================================================================= */}
          {activeNav === 'track_status' && (
            <View>
              {/* Header Row with Event Selector Dropdown */}
              <View style={styles.dashboardHeaderRow}>
                <View>
                  <Text style={styles.dashboardTitle}>Rescue Team Tracking</Text>
                  <Text style={styles.dashboardSubtitle}>
                    Live location and status updates for assigned teams.
                  </Text>
                </View>

                <TouchableOpacity style={styles.districtDropdownBtn}>
                  <Text style={styles.districtDropdownText}>Severe Flooding - Galle District</Text>
                  <Feather name="chevron-down" size={15} color="#475569" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>

              {/* Two Column Split: Team Info & Map (Left) vs Timeline (Right) */}
              <View style={styles.trackingSplitRow}>
                {/* Left Column: Team Info + Route Map */}
                <View style={styles.trackingLeftCol}>
                  {/* Team Information Card */}
                  <View style={styles.teamInfoCard}>
                    <Text style={styles.cardInternalTitle}>Team Information</Text>

                    <View style={styles.teamInfoInnerRow}>
                      <View style={styles.catCardIconBox}>
                        <MaterialCommunityIcons name="sail-boat" size={32} color="#0066FF" />
                      </View>

                      <View style={{ flex: 1, marginLeft: 16 }}>
                        <View style={styles.teamInfoHeaderTop}>
                          <Text style={styles.teamNameText}>
                            {currentTrackingMission?.teamName || 'Water Rescue Team - 01'}
                          </Text>
                          <View style={styles.enRoutePill}>
                            <Text style={styles.enRoutePillText}>
                              {currentTrackingMission?.status === 'completed'
                                ? 'Completed'
                                : currentTrackingMission?.status === 'at_destination'
                                ? 'At Destination'
                                : 'En Route'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.teamDetailLine}>
                          Assigned to: {currentTrackingMission?.district || 'Galle District'}
                        </Text>
                        <Text style={styles.teamDetailLine}>
                          Team Members: {currentTrackingMission?.teamId?.membersCount || 6}
                        </Text>
                        <Text style={styles.teamDetailLine}>
                          Vehicle: {currentTrackingMission?.teamId?.vehicle || 'Rescue Boat WB-01'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Coastal Interactive Tracking Map Card */}
                  <View style={styles.trackingRouteMapCard}>
                    <View style={styles.trackingCoastCanvas}>
                      <View style={styles.mapCanvasGrid} />

                      {/* Landmarks */}
                      <Text style={[styles.mapPlaceName, { top: 30, left: 25 }]}>Hikkaduwa</Text>
                      <Text style={[styles.mapPlaceName, { bottom: 25, right: 90 }]}>Galle</Text>

                      {/* Route Arc Line (Dashed) */}
                      <View style={styles.routeDashedArc} />

                      {/* Moving Boat Marker */}
                      <View style={styles.movingBoatPin}>
                        <MaterialCommunityIcons name="sail-boat" size={26} color="#0066FF" />
                        <View style={styles.boatTooltipBubble}>
                          <Text style={styles.boatTooltipText}>
                            {currentTrackingMission?.status === 'at_destination'
                              ? 'Rescue Team (At Target)'
                              : 'Rescue Team (En Route)'}
                          </Text>
                        </View>
                      </View>

                      {/* Destination Red Pin */}
                      <View style={styles.destRedMarkerPin}>
                        <Ionicons name="location-sharp" size={32} color="#DC2626" />
                      </View>

                      {/* Status Tag in Map Corner */}
                      <View style={styles.mapCornerStatusPill}>
                        <Text style={styles.mapCornerStatusText}>
                          {currentTrackingMission?.status === 'completed' ? 'Cleared' : 'Ongoing'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Right Column: Status Timeline Card */}
                <View style={styles.trackingRightCol}>
                  <View style={styles.statusTimelineCard}>
                    <Text style={styles.cardInternalTitle}>Status Timeline</Text>

                    <View style={styles.timelineListContainer}>
                      {/* 1. Assigned */}
                      <View style={styles.timelineRowItem}>
                        <View style={[styles.timelineCircle, styles.timelineCircleDone]}>
                          <Feather name="check" size={14} color="#FFFFFF" />
                        </View>
                        <View style={styles.timelineTextBox}>
                          <Text style={styles.timelineNodeTitle}>Assigned</Text>
                          <Text style={styles.timelineNodeTime}>Today, 08:45 AM</Text>
                        </View>
                      </View>

                      {/* 2. En Route */}
                      <View style={styles.timelineRowItem}>
                        <View
                          style={[
                            styles.timelineCircle,
                            ['en_route', 'at_destination', 'rescue_in_progress', 'completed'].includes(
                              currentTrackingMission?.status
                            )
                              ? styles.timelineCircleBlue
                              : styles.timelineCirclePending
                          ]}
                        >
                          <Feather name="check" size={14} color="#FFFFFF" />
                        </View>
                        <View style={styles.timelineTextBox}>
                          <Text style={styles.timelineNodeTitle}>En Route</Text>
                          <Text style={styles.timelineNodeTime}>Today, 09:10 AM</Text>
                        </View>
                      </View>

                      {/* 3. Arrived at Destination */}
                      <View style={styles.timelineRowItem}>
                        <View
                          style={[
                            styles.timelineCircle,
                            ['at_destination', 'rescue_in_progress', 'completed'].includes(
                              currentTrackingMission?.status
                            )
                              ? styles.timelineCircleDone
                              : styles.timelineCirclePending
                          ]}
                        >
                          <Feather name="map-pin" size={13} color="#94A3B8" />
                        </View>
                        <View style={styles.timelineTextBox}>
                          <Text style={styles.timelineNodeTitle}>Arrived at Destination</Text>
                          <Text style={styles.timelineNodeTime}>
                            {['at_destination', 'rescue_in_progress', 'completed'].includes(
                              currentTrackingMission?.status
                            )
                              ? 'Today, 09:25 AM'
                              : 'Pending'}
                          </Text>
                        </View>
                      </View>

                      {/* 4. Rescue in Progress */}
                      <View style={styles.timelineRowItem}>
                        <View
                          style={[
                            styles.timelineCircle,
                            ['rescue_in_progress', 'completed'].includes(
                              currentTrackingMission?.status
                            )
                              ? styles.timelineCircleDone
                              : styles.timelineCirclePending
                          ]}
                        >
                          <Feather name="life-buoy" size={13} color="#94A3B8" />
                        </View>
                        <View style={styles.timelineTextBox}>
                          <Text style={styles.timelineNodeTitle}>Rescue in Progress</Text>
                          <Text style={styles.timelineNodeTime}>
                            {['rescue_in_progress', 'completed'].includes(
                              currentTrackingMission?.status
                            )
                              ? 'In Progress'
                              : 'Pending'}
                          </Text>
                        </View>
                      </View>

                      {/* 5. Completed */}
                      <View style={styles.timelineRowItem}>
                        <View
                          style={[
                            styles.timelineCircle,
                            currentTrackingMission?.status === 'completed'
                              ? styles.timelineCircleDone
                              : styles.timelineCirclePending
                          ]}
                        >
                          <Feather name="flag" size={13} color="#94A3B8" />
                        </View>
                        <View style={styles.timelineTextBox}>
                          <Text style={styles.timelineNodeTitle}>Completed</Text>
                          <Text style={styles.timelineNodeTime}>
                            {currentTrackingMission?.status === 'completed'
                              ? 'Today, 02:15 PM'
                              : 'Pending'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Bottom Box: Latest Update from Team (Exact copy from mockup) */}
              <View style={styles.latestUpdateTickerBox}>
                <Text style={styles.latestUpdateHeading}>Latest Update from Team</Text>
                <View style={styles.latestUpdateMessageRow}>
                  <View style={styles.timeTickerPill}>
                    <Text style={styles.timeTickerPillText}>09:25 AM</Text>
                  </View>
                  <MaterialCommunityIcons name="sail-boat" size={18} color="#0066FF" style={{ marginHorizontal: 10 }} />
                  <Text style={styles.latestUpdateMessageText}>
                    "{currentTrackingMission?.latestUpdate?.message ||
                      'Arrived at destination - beginning rescue operations.'}"
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ========================================================================= */}
          {/* PANEL: REPORTS SUMMARY */}
          {/* ========================================================================= */}
          {activeNav === 'reports' && (
            <View>
              <View style={styles.dashboardHeaderRow}>
                <View>
                  <Text style={styles.dashboardTitle}>District Emergency Reports</Text>
                  <Text style={styles.dashboardSubtitle}>
                    Post-event summary logs, evacuation counts, and shelter telemetry.
                  </Text>
                </View>
              </View>

              <View style={styles.reportSummaryCard}>
                <Text style={styles.cardInternalTitle}>Galle District Operation Summary</Text>
                <View style={styles.reportStatsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxNum}>14</Text>
                    <Text style={styles.statBoxLabel}>Persons Rescued</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxNum}>3</Text>
                    <Text style={styles.statBoxLabel}>Active Shelters</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxNum}>330</Text>
                    <Text style={styles.statBoxLabel}>Total Beds Occupied</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxNum}>4</Text>
                    <Text style={styles.statBoxLabel}>Rescue Units Assigned</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN RESCUE TEAM CONFIRMATION */}
      {/* ========================================================================= */}
      <Modal
        visible={assignModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAssignModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Deploy {selectedCategory?.typeName || 'Rescue Team'}
              </Text>
              <TouchableOpacity onPress={() => setAssignModalOpen(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={styles.modalFieldLabel}>Select Specific Team Unit *</Text>
              {availableTeams.map((team) => {
                const isSelected = selectedTeamUnit?._id === team._id;
                return (
                  <TouchableOpacity
                    key={team._id}
                    onPress={() => setSelectedTeamUnit(team)}
                    style={[
                      styles.teamUnitSelectRow,
                      isSelected && styles.teamUnitSelectRowActive
                    ]}
                  >
                    <View style={styles.unitRadioDot}>
                      {isSelected && <View style={styles.unitRadioInner} />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.unitNameTitle}>{team.name}</Text>
                      <Text style={styles.unitMetaText}>
                        Leader: {team.leaderName} • {team.vehicle} • {team.membersCount} members
                      </Text>
                    </View>
                    <Text style={styles.unitAvailableBadge}>Available</Text>
                  </TouchableOpacity>
                );
              })}

              <View style={[styles.formGroup, { marginTop: 14 }]}>
                <Text style={styles.formLabel}>Target Destination Address *</Text>
                <TextInput
                  value={dispatchDestination}
                  onChangeText={setDispatchDestination}
                  placeholder="Multiple DS Divisions, Galle District"
                  style={styles.lightTextInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Field Operation Directive *</Text>
                <TextInput
                  value={dispatchInstructions}
                  onChangeText={setDispatchInstructions}
                  multiline
                  numberOfLines={3}
                  placeholder="Deploy rescue craft immediately..."
                  style={[styles.lightTextInput, { height: 75, textAlignVertical: 'top' }]}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setAssignModalOpen(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmDispatch}
                disabled={dispatching}
                style={styles.modalDispatchBtn}
              >
                {dispatching ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalDispatchBtnText}>Deploy Team</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: UPDATE SHELTER OCCUPANCY */}
      {/* ========================================================================= */}
      <Modal
        visible={shelterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setShelterModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 440 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Shelter Capacity</Text>
              <TouchableOpacity onPress={() => setShelterModalOpen(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ marginVertical: 12 }}>
              <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
                {editingShelter?.name}
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Total Bed Capacity</Text>
                <TextInput
                  value={editCapacityVal}
                  onChangeText={setEditCapacityVal}
                  keyboardType="numeric"
                  style={styles.lightTextInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Current Occupancy (Occupied Beds)</Text>
                <TextInput
                  value={editOccupancyVal}
                  onChangeText={setEditOccupancyVal}
                  keyboardType="numeric"
                  style={styles.lightTextInput}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShelterModalOpen(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdateShelterOccupancy}
                style={styles.modalDispatchBtn}
              >
                <Text style={styles.modalDispatchBtnText}>Save Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: VIEW DETAILS (PANEL 6 COMPLETED EVENT) */}
      {/* ========================================================================= */}
      <Modal
        visible={detailsModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{detailsEvent?.title}</Text>
              <TouchableOpacity onPress={() => setDetailsModalOpen(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ marginVertical: 12, gap: 10 }}>
              <View style={styles.detailRow}>
                <Text style={styles.detailRowLabel}>Location:</Text>
                <Text style={styles.detailRowVal}>{detailsEvent?.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailRowLabel}>Status:</Text>
                <Text style={[styles.detailRowVal, { color: '#16A34A', fontWeight: '800' }]}>
                  {detailsEvent?.status} ({detailsEvent?.completedAt})
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailRowLabel}>People Rescued:</Text>
                <Text style={[styles.detailRowVal, { fontWeight: '800' }]}>
                  {detailsEvent?.peopleRescued} civilians
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailRowLabel}>Operation Summary:</Text>
                <Text style={styles.detailRowVal}>{detailsEvent?.summary}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setDetailsModalOpen(false)}
              style={styles.modalCancelBtn}
            >
              <Text style={[styles.modalCancelBtnText, { textAlign: 'center' }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  windowContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F4F6F9',
    height: '100%'
  },

  /* 1. SIDEBAR STYLES (MATCHING IMAGES) */
  sidebar: {
    width: 215,
    backgroundColor: '#0D2040',
    paddingTop: 18,
    borderRightWidth: 1,
    borderRightColor: '#1A2F54'
  },
  sidebarLogoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)'
  },
  goldCrestIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  sidebarLogoTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  sidebarLogoSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3
  },
  sidebarMenu: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 4
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6
  },
  navItemActive: {
    backgroundColor: '#0066FF'
  },
  navItemIcon: {
    marginRight: 12
  },
  navItemText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600'
  },
  navItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },

  /* 2. MAIN CONTENT & TOPBAR */
  mainContent: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  topHeaderBar: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 10
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative'
  },
  bellBtn: {
    position: 'relative',
    marginRight: 18,
    padding: 6
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#DC2626',
    width: 15,
    height: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900'
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  profilePillText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '600'
  },
  profileDropdownMenu: {
    position: 'absolute',
    top: 42,
    right: 0,
    width: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 50
  },
  profileInfoBox: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8
  },
  profileUserName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700'
  },
  profileUserRole: {
    color: '#64748B',
    fontSize: 11
  },
  logoutMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6
  },
  logoutMenuText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700'
  },

  /* 3. CONTENT AREA & HEADERS */
  contentScroll: {
    flex: 1
  },
  contentInner: {
    padding: 24,
    paddingBottom: 60
  },
  dashboardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
    position: 'relative'
  },
  dashboardTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800'
  },
  dashboardSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2
  },
  districtDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  districtDropdownText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '600'
  },
  districtMenuBox: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 40,
    width: 140
  },
  districtMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  districtMenuText: {
    color: '#334155',
    fontSize: 12
  },

  /* 4. DISASTER EVENT CARDS (PANEL 2 & 6) */
  disastersList: {
    gap: 14
  },
  disasterCard: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  disasterCardPink: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FEE2E2'
  },
  disasterCardAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7'
  },
  disasterCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7'
  },
  disasterCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2
  },
  disasterIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  disasterTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4
  },
  locationLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  locationLineText: {
    color: '#475569',
    fontSize: 12
  },
  disasterCardMid: {
    flex: 1.2,
    alignItems: 'flex-start',
    paddingLeft: 12
  },
  highBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginBottom: 4
  },
  highBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  mediumBadge: {
    backgroundColor: '#F97316',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4
  },
  mediumBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  timePrimaryText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600'
  },
  timeSecondaryText: {
    color: '#DC2626',
    fontSize: 11,
    marginTop: 1
  },
  completedTagBox: {
    flex: 1.2,
    alignItems: 'flex-start'
  },
  completedPill: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 4
  },
  completedPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  completedTimeText: {
    color: '#475569',
    fontSize: 11
  },
  disasterCardActions: {
    minWidth: 160,
    alignItems: 'flex-end'
  },
  stackedActionBtns: {
    gap: 7,
    width: 155
  },
  solidBlueBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 5,
    paddingVertical: 7,
    alignItems: 'center'
  },
  solidBlueBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  outlineBlueBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0066FF',
    borderRadius: 5,
    paddingVertical: 6,
    alignItems: 'center'
  },
  outlineBlueBtnText: {
    color: '#0066FF',
    fontSize: 12,
    fontWeight: '700'
  },
  viewDetailsBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0066FF',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center'
  },
  viewDetailsBtnText: {
    color: '#0066FF',
    fontSize: 11,
    fontWeight: '700'
  },
  trackingCompletedBtn: {
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center'
  },
  trackingCompletedBtnText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700'
  },

  /* 5. PANEL 3: SHELTERS STYLES */
  createNewShelterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  createNewShelterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  shelterSplitRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 20
  },
  createShelterCard: {
    flex: 1.1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18
  },
  shelterMapCard: {
    flex: 1.2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18
  },
  cardInternalTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14
  },
  formGroup: {
    marginBottom: 12
  },
  formLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5
  },
  lightTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: '#0F172A',
    fontSize: 12
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    backgroundColor: '#FFFFFF'
  },
  lightTextInputInner: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: '#0F172A',
    fontSize: 12
  },
  inputEndIcon: {
    marginRight: 10
  },
  occupancyInfoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    padding: 10,
    marginTop: 4,
    marginBottom: 14
  },
  occupancyInfoText: {
    color: '#1E40AF',
    fontSize: 11,
    fontWeight: '500',
    flex: 1
  },
  placePinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    borderRadius: 6,
    paddingVertical: 9
  },
  placePinBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  coastalMapCanvas: {
    height: 195,
    backgroundColor: '#FEF9C3', // Light yellow land / coast map tint
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden'
  },
  mapCanvasGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    borderWidth: 1,
    borderColor: '#0284C7'
  },
  mapPlaceName: {
    position: 'absolute',
    color: '#475569',
    fontSize: 11,
    fontWeight: '600'
  },
  mapZoomControls: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  zoomBtn: {
    padding: 4,
    alignItems: 'center'
  },
  mapMarkerCenter: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -16,
    alignItems: 'center'
  },
  markerTooltipBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 2
  },
  markerTooltipTitle: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '700'
  },
  saveShelterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    borderRadius: 6,
    paddingVertical: 9,
    marginTop: 12
  },
  saveShelterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  shelterTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18
  },
  tableCardTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden'
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  thCol: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700'
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF'
  },
  tdCol: {
    color: '#334155',
    fontSize: 12
  },
  tdBold: {
    color: '#0F172A',
    fontWeight: '700'
  },
  statusPillOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  statusPillOpenText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '700'
  },
  statusPillFull: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  statusPillFullText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '700'
  },
  tableUpdateBtn: {
    borderWidth: 1,
    borderColor: '#0066FF',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  tableUpdateBtnText: {
    color: '#0066FF',
    fontSize: 11,
    fontWeight: '700'
  },

  /* 6. PANEL 4: ASSIGN RESCUE TEAM */
  selectedEventCardPink: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  bannerIconTriangle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bannerDisasterTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2
  },
  bannerRightBadgeCol: {
    alignItems: 'flex-end'
  },
  bannerTimeText: {
    color: '#475569',
    fontSize: 11,
    marginTop: 4
  },
  availableTeamsHeading: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4
  },
  availableTeamsSub: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 16
  },
  rescueTeamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  rescueCategoryCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    alignItems: 'center',
    textAlign: 'center'
  },
  catCardIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  catCardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  catCardTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center'
  },
  catCardDesc: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
    minHeight: 32
  },
  catCardAvailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 16,
    marginBottom: 14
  },
  catCardAvailableText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '800'
  },
  assignTeamSolidBtn: {
    backgroundColor: '#0066FF',
    width: '100%',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  assignTeamSolidBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },

  /* 7. PANEL 5: TRACKING STYLES */
  trackingSplitRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 18
  },
  trackingLeftCol: {
    flex: 1.4,
    gap: 14
  },
  trackingRightCol: {
    flex: 1
  },
  teamInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16
  },
  teamInfoInnerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  teamInfoHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  teamNameText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800'
  },
  enRoutePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  enRoutePillText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '800'
  },
  teamDetailLine: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2
  },
  trackingRouteMapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14
  },
  trackingCoastCanvas: {
    height: 180,
    backgroundColor: '#FEF9C3',
    borderRadius: 6,
    position: 'relative',
    overflow: 'hidden'
  },
  routeDashedArc: {
    position: 'absolute',
    top: 50,
    left: 70,
    width: 200,
    height: 80,
    borderBottomWidth: 2,
    borderColor: '#0066FF',
    borderStyle: 'dashed',
    borderRadius: 100
  },
  movingBoatPin: {
    position: 'absolute',
    top: 55,
    left: 80,
    alignItems: 'center'
  },
  boatTooltipBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 2
  },
  boatTooltipText: {
    color: '#0F172A',
    fontSize: 9,
    fontWeight: '700'
  },
  destRedMarkerPin: {
    position: 'absolute',
    bottom: 25,
    right: 70
  },
  mapCornerStatusPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  mapCornerStatusText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '700'
  },
  statusTimelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    height: '100%'
  },
  timelineListContainer: {
    gap: 16,
    paddingLeft: 4
  },
  timelineRowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1
  },
  timelineCircleDone: {
    backgroundColor: '#16A34A'
  },
  timelineCircleBlue: {
    backgroundColor: '#0066FF'
  },
  timelineCirclePending: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  timelineTextBox: {
    flex: 1
  },
  timelineNodeTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700'
  },
  timelineNodeTime: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1
  },
  latestUpdateTickerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16
  },
  latestUpdateHeading: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10
  },
  latestUpdateMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    padding: 10
  },
  timeTickerPill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  timeTickerPillText: {
    color: '#1E40AF',
    fontSize: 11,
    fontWeight: '800'
  },
  latestUpdateMessageText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
    flex: 1
  },

  /* 8. PANEL: REPORTS */
  reportSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18
  },
  reportStatsGrid: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 12
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  statBoxNum: {
    color: '#0066FF',
    fontSize: 24,
    fontWeight: '900'
  },
  statBoxLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4
  },

  /* 9. MODALS */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: '100%',
    maxWidth: 520,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800'
  },
  modalFieldLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8
  },
  teamUnitSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  teamUnitSelectRowActive: {
    borderColor: '#0066FF',
    backgroundColor: '#EFF6FF'
  },
  unitRadioDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  unitRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0066FF'
  },
  unitNameTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700'
  },
  unitMetaText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1
  },
  unitAvailableBadge: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '800'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9'
  },
  modalCancelBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600'
  },
  modalDispatchBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  modalDispatchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6
  },
  detailRowLabel: {
    color: '#64748B',
    fontSize: 12,
    width: 140
  },
  detailRowVal: {
    color: '#0F172A',
    fontSize: 12,
    flex: 1
  }
});
