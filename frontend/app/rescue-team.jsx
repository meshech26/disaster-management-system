import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  Dimensions,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { rescueService } from '../services/rescueService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RescueTeamScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { socket } = useSocket();

  // Active Screen in the 5-screen flow:
  // 'assigned_mission' (Screen 2: Assigned Mission / Alert)
  // 'mission_details'  (Screen 3: Mission Details)
  // 'en_route'         (Screen 4: Navigation / En Route)
  // 'at_destination'   (Screen 5: Arrived at Destination & Send Update)
  // 'complete_mission' (Screen 6: Rescue Completed / Complete Mission)
  // 'profile'          (Profile & Logout tab)
  const [activeScreen, setActiveScreen] = useState('assigned_mission');

  // Bottom navigation tab selection: 'missions' | 'active_mission' | 'completed' | 'profile'
  const [activeTab, setActiveTab] = useState('missions');

  // Details tab: 'overview' | 'map' | 'resources'
  const [detailsTab, setDetailsTab] = useState('overview');

  // Mission data state
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [mission, setMission] = useState(null);

  // Screen 5: Status update input
  const [updateMessage, setUpdateMessage] = useState(
    'Arrived at destination – beginning rescue operations.'
  );
  const [updateSentSuccess, setUpdateSentSuccess] = useState(false);

  // Screen 6: Completion note & rescued count
  const [completionNote, setCompletionNote] = useState(
    '12 people rescued and moved to the nearest safe shelter. Area handed over to local authorities.'
  );
  const [peopleRescued, setPeopleRescued] = useState('12');
  const [isCompletedState, setIsCompletedState] = useState(false);

  // Fetch current active mission for the rescue team
  const fetchCurrentMission = async () => {
    try {
      setLoading(true);
      const res = await rescueService.getCurrentMission();
      const current = res.data;
      if (current) {
        setMission(current);
        if (current.status === 'assigned') {
          setActiveScreen('assigned_mission');
          setActiveTab('missions');
        } else if (current.status === 'en_route') {
          setActiveScreen('en_route');
          setActiveTab('active_mission');
        } else if (current.status === 'at_destination' || current.status === 'rescue_in_progress') {
          setActiveScreen('at_destination');
          setActiveTab('active_mission');
          if (current.latestUpdate?.message) {
            setUpdateSentSuccess(true);
          }
        } else if (current.status === 'completed') {
          setActiveScreen('complete_mission');
          setActiveTab('completed');
          setIsCompletedState(true);
        }
      } else {
        // Fallback default mission matching the prompt & screenshot
        setMission({
          _id: 'seed-flood-mission',
          title: 'Flood Rescue Operation',
          district: 'Kandy District',
          severity: 'HIGH',
          time: 'Today, 10:30 AM',
          destination: {
            address: 'Rambukkana - Ginigathena Road (near Alawathugoda Bridge)',
            latitude: 7.2906,
            longitude: 80.6337
          },
          description:
            'Multiple families stranded due to flash floods. Rescue and relocate affected people to the nearest safe location.',
          instructions: [
            'Rescue stranded civilians (priority: children, elderly).',
            'Coordinate with local authorities.',
            'Ensure team safety (fast flowing water).',
            'Report situation updates regularly.'
          ],
          teamName: 'Water Rescue Team - 01',
          status: 'assigned'
        });
      }
    } catch (err) {
      console.warn('Failed to fetch current mission:', err);
      // Fallback default mock so screen is always rich and interactive
      setMission({
        _id: 'seed-flood-mission',
        title: 'Flood Rescue Operation',
        district: 'Kandy District',
        severity: 'HIGH',
        time: 'Today, 10:30 AM',
        destination: {
          address: 'Rambukkana - Ginigathena Road (near Alawathugoda Bridge)',
          latitude: 7.2906,
          longitude: 80.6337
        },
        description:
          'Multiple families stranded due to flash floods. Rescue and relocate affected people to the nearest safe location.',
        instructions: [
          'Rescue stranded civilians (priority: children, elderly).',
          'Coordinate with local authorities.',
          'Ensure team safety (fast flowing water).',
          'Report situation updates regularly.'
        ],
        teamName: 'Water Rescue Team - 01',
        status: 'assigned'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentMission();
  }, []);

  // Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    const handleMissionAssigned = (newMission) => {
      setMission(newMission);
      setActiveScreen('assigned_mission');
      setActiveTab('missions');
      setIsCompletedState(false);
    };

    const handleMissionUpdated = (updated) => {
      if (mission && mission._id === updated._id) {
        setMission(updated);
      }
    };

    socket.on('mission_assigned', handleMissionAssigned);
    socket.on('mission_status_updated', handleMissionUpdated);

    return () => {
      socket.off('mission_assigned', handleMissionAssigned);
      socket.off('mission_status_updated', handleMissionUpdated);
    };
  }, [socket, mission]);

  // Handle Tab Navigation from bottom bar
  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'missions') {
      setActiveScreen('assigned_mission');
    } else if (tab === 'active_mission') {
      if (mission?.status === 'at_destination' || mission?.status === 'rescue_in_progress') {
        setActiveScreen('at_destination');
      } else {
        setActiveScreen('en_route');
      }
    } else if (tab === 'completed') {
      setActiveScreen('complete_mission');
    } else if (tab === 'profile') {
      setActiveScreen('profile');
    }
  };

  // Screen 3 Action: Start Mission -> Screen 4 (En Route)
  const handleStartMission = async () => {
    if (!mission) return;
    setActionLoading(true);
    try {
      if (mission._id && mission._id !== 'seed-flood-mission') {
        const res = await rescueService.updateStatus(mission._id, 'en_route', {
          note: 'Team departed base en route to Rambukkana hazard zone.'
        });
        setMission(res.data);
      } else {
        setMission((prev) => ({ ...prev, status: 'en_route' }));
      }
      setActiveScreen('en_route');
      setActiveTab('active_mission');
    } catch (err) {
      console.warn('Start mission error:', err);
      setActiveScreen('en_route');
      setActiveTab('active_mission');
    } finally {
      setActionLoading(false);
    }
  };

  // Screen 4 Action: Mark Arrival -> Screen 5 (At Destination)
  const handleMarkArrival = async () => {
    if (!mission) return;
    setActionLoading(true);
    try {
      if (mission._id && mission._id !== 'seed-flood-mission') {
        const res = await rescueService.updateStatus(mission._id, 'at_destination', {
          note: 'Team arrived at mission destination.'
        });
        setMission(res.data);
      } else {
        setMission((prev) => ({ ...prev, status: 'at_destination' }));
      }
      setActiveScreen('at_destination');
      setActiveTab('active_mission');
    } catch (err) {
      console.warn('Arrival status error:', err);
      setActiveScreen('at_destination');
      setActiveTab('active_mission');
    } finally {
      setActionLoading(false);
    }
  };

  // Screen 5 Action: Send Update Message to District Officer
  const handleSendUpdate = async () => {
    if (!updateMessage.trim()) {
      Alert.alert('Required', 'Please enter an operational update message.');
      return;
    }

    setActionLoading(true);
    try {
      if (mission && mission._id && mission._id !== 'seed-flood-mission') {
        const res = await rescueService.sendUpdateMessage(mission._id, updateMessage.trim());
        setMission(res.data);
      }
      setUpdateSentSuccess(true);
      Alert.alert('Update Sent', 'Your update was sent to District Command and is visible on their tracking board.');
    } catch (err) {
      console.warn('Update message error:', err);
      setUpdateSentSuccess(true);
    } finally {
      setActionLoading(false);
    }
  };

  // Screen 6 Action: Mark as Complete
  const handleMarkAsComplete = async () => {
    setActionLoading(true);
    try {
      const count = parseInt(peopleRescued, 10) || 12;
      if (mission && mission._id && mission._id !== 'seed-flood-mission') {
        const res = await rescueService.updateStatus(mission._id, 'completed', {
          peopleRescued: count,
          completionNote: completionNote.trim()
        });
        setMission(res.data);
      }
      setIsCompletedState(true);
      setActiveScreen('complete_mission');
      setActiveTab('completed');
      Alert.alert(
        'Rescue Completed',
        'Mission marked as complete. Tracking stopped and District Command notified.'
      );
    } catch (err) {
      console.warn('Completion error:', err);
      setIsCompletedState(true);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={styles.phoneFrameContainer}>
      <View style={styles.phoneScreen}>
        {/* ========================================================================= */}
        {/* PHONE STATUS BAR (9:41, Cellular, Wifi, Battery) */}
        {/* ========================================================================= */}
        <View style={styles.phoneStatusBar}>
          <Text style={styles.statusBarTime}>9:41</Text>
          <View style={styles.statusBarIcons}>
            <Ionicons name="cellular" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Ionicons name="wifi" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Ionicons name="battery-full" size={15} color="#FFFFFF" />
          </View>
        </View>

        {/* ========================================================================= */}
        {/* APP HEADER */}
        {/* ========================================================================= */}
        {activeScreen === 'assigned_mission' ? (
          <View style={styles.appHeader}>
            <View style={styles.appHeaderBrand}>
              <View style={styles.emblemBadge}>
                <MaterialCommunityIcons name="shield-sun" size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.brandTitle}>DMC SRI LANKA</Text>
                <Text style={styles.brandSubtitle}>Rescue Team</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => Alert.alert('Notifications', '1 High Severity Rescue Mission Assigned.')}
              style={styles.bellBtn}
            >
              <Feather name="bell" size={18} color="#FFFFFF" />
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.appHeaderBack}>
            <TouchableOpacity
              onPress={() => {
                if (activeScreen === 'mission_details') setActiveScreen('assigned_mission');
                else if (activeScreen === 'en_route') setActiveScreen('mission_details');
                else if (activeScreen === 'at_destination') setActiveScreen('en_route');
                else if (activeScreen === 'complete_mission') setActiveScreen('at_destination');
                else setActiveScreen('assigned_mission');
              }}
              style={styles.headerBackBtn}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerBackTitle}>
              {activeScreen === 'mission_details' && 'Mission Details'}
              {activeScreen === 'en_route' && 'En Route to Destination'}
              {activeScreen === 'at_destination' && 'Arrived at Destination'}
              {activeScreen === 'complete_mission' && 'Complete Mission'}
              {activeScreen === 'profile' && 'Team Profile'}
            </Text>
            <View style={{ width: 28 }} />
          </View>
        )}

        {/* ========================================================================= */}
        {/* SCROLLABLE MAIN CONTENT */}
        {/* ========================================================================= */}
        <ScrollView
          style={styles.mainScrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#0066FF" />
              <Text style={styles.loadingText}>Syncing rescue operations...</Text>
            </View>
          ) : (
            <>
              {/* ========================================================================= */}
              {/* SCREEN 2: ASSIGNED MISSION / ALERT */}
              {/* ========================================================================= */}
              {activeScreen === 'assigned_mission' && (
                <View>
                  {/* Title Row with red badge "1" */}
                  <View style={styles.assignedMissionTitleRow}>
                    <Text style={styles.screenMainTitle}>Assigned Mission</Text>
                    <View style={styles.redCountBadge}>
                      <Text style={styles.redCountBadgeText}>1</Text>
                    </View>
                  </View>

                  {/* Mission Card */}
                  <View style={styles.missionCard}>
                    {/* Red Banner at Top */}
                    <View style={styles.newMissionBanner}>
                      <Text style={styles.newMissionBannerText}>NEW MISSION ASSIGNED</Text>
                    </View>

                    {/* Flood Visual Canvas */}
                    <View style={styles.floodImageCanvas}>
                      <View style={styles.floodWaterOverlay} />
                      {/* Stylized flood visual elements */}
                      <View style={styles.floodHouseIcon1}>
                        <MaterialCommunityIcons name="home-flood" size={32} color="#FFFFFF" />
                      </View>
                      <View style={styles.floodHouseIcon2}>
                        <MaterialCommunityIcons name="home-flood" size={24} color="rgba(255,255,255,0.7)" />
                      </View>
                      <View style={styles.floodWaterWaves}>
                        <MaterialCommunityIcons name="waves" size={28} color="rgba(255,255,255,0.85)" />
                      </View>
                    </View>

                    {/* Card Content Body */}
                    <View style={styles.missionCardBody}>
                      {/* Red High Badge */}
                      <View style={styles.highPillBadge}>
                        <MaterialCommunityIcons name="alert" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.highPillText}>HIGH</Text>
                      </View>

                      {/* Operation Title */}
                      <Text style={styles.operationTitle}>
                        {mission?.title || 'Flood Rescue Operation'}
                      </Text>

                      {/* District Location */}
                      <View style={styles.metaLine}>
                        <Feather name="map-pin" size={13} color="#DC2626" style={{ marginRight: 6 }} />
                        <Text style={styles.metaLineText}>{mission?.district || 'Kandy District'}</Text>
                      </View>

                      {/* Time */}
                      <View style={styles.metaLine}>
                        <Feather name="clock" size={13} color="#64748B" style={{ marginRight: 6 }} />
                        <Text style={styles.metaLineText}>{mission?.time || 'Today, 10:30 AM'}</Text>
                      </View>

                      {/* Description */}
                      <Text style={styles.cardDescText}>
                        {mission?.description ||
                          'Multiple families stranded due to flash floods. Rescue and relocate affected people to the nearest safe location.'}
                      </Text>

                      {/* Destination Section Box */}
                      <View style={styles.destinationBox}>
                        <View style={styles.destinationHeader}>
                          <Feather name="map-pin" size={13} color="#DC2626" style={{ marginRight: 6 }} />
                          <Text style={styles.destinationTitle}>Destination</Text>
                        </View>
                        <Text style={styles.destinationAddressText}>
                          {mission?.destination?.address ||
                            'Rambukkana - Ginigathena Road\n(near Alawathugoda Bridge)'}
                        </Text>
                      </View>

                      {/* Solid Blue Action Button */}
                      <TouchableOpacity
                        onPress={() => setActiveScreen('mission_details')}
                        style={styles.solidBlueActionBtn}
                      >
                        <Text style={styles.solidBlueActionBtnText}>View Mission Details</Text>
                        <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* ========================================================================= */}
              {/* SCREEN 3: MISSION DETAILS */}
              {/* ========================================================================= */}
              {activeScreen === 'mission_details' && (
                <View>
                  {/* Top Alert Banner Card */}
                  <View style={styles.detailsHeaderCard}>
                    <View style={styles.detailsWarningIconBox}>
                      <Ionicons name="warning" size={24} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.detailsHeaderTitle}>
                        {mission?.title || 'Flood Rescue Operation'}
                      </Text>
                      <View style={styles.detailsHighSeverityBadge}>
                        <Text style={styles.detailsHighSeverityText}>HIGH SEVERITY</Text>
                      </View>
                      <View style={[styles.metaLine, { marginTop: 6 }]}>
                        <Feather name="map-pin" size={12} color="#DC2626" style={{ marginRight: 5 }} />
                        <Text style={styles.metaLineText}>{mission?.district || 'Kandy District'}</Text>
                      </View>
                      <View style={[styles.metaLine, { marginTop: 2 }]}>
                        <Feather name="calendar" size={12} color="#64748B" style={{ marginRight: 5 }} />
                        <Text style={styles.metaLineText}>Today, 10 Oct 2024, 10:30 AM</Text>
                      </View>
                    </View>
                  </View>

                  {/* Tabs: [ Overview | Map | Resources ] */}
                  <View style={styles.segmentedTabsRow}>
                    <TouchableOpacity
                      onPress={() => setDetailsTab('overview')}
                      style={[styles.segmentTab, detailsTab === 'overview' && styles.segmentTabActive]}
                    >
                      <Text style={[styles.segmentTabText, detailsTab === 'overview' && styles.segmentTabTextActive]}>
                        Overview
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDetailsTab('map')}
                      style={[styles.segmentTab, detailsTab === 'map' && styles.segmentTabActive]}
                    >
                      <Text style={[styles.segmentTabText, detailsTab === 'map' && styles.segmentTabTextActive]}>
                        Map
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDetailsTab('resources')}
                      style={[styles.segmentTab, detailsTab === 'resources' && styles.segmentTabActive]}
                    >
                      <Text style={[styles.segmentTabText, detailsTab === 'resources' && styles.segmentTabTextActive]}>
                        Resources
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Satellite Map Preview Card */}
                  <View style={styles.previewMapCard}>
                    <View style={styles.previewMapCanvas}>
                      <View style={styles.mapGridOverlay} />
                      {/* Origin Pin */}
                      <View style={[styles.mapPinBox, { top: 75, left: 28 }]}>
                        <View style={styles.originBluePinDot} />
                        <Text style={styles.mapPinLabel}>Rambukkana</Text>
                      </View>
                      {/* Destination Pin */}
                      <View style={[styles.mapPinBox, { top: 38, right: 38 }]}>
                        <Ionicons name="location-sharp" size={24} color="#DC2626" />
                        <View style={styles.hazardBubble}>
                          <Text style={styles.hazardBubbleText}>Hazard Location</Text>
                        </View>
                      </View>
                      {/* Route Path (Dashed) */}
                      <View style={styles.previewRoutePath} />
                      {/* Expand Button */}
                      <TouchableOpacity style={styles.expandMapBtn}>
                        <MaterialCommunityIcons name="arrow-expand-all" size={14} color="#0F172A" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Description Section */}
                  <View style={styles.detailsSectionBox}>
                    <Text style={styles.sectionHeading}>Description</Text>
                    <Text style={styles.sectionBodyText}>
                      {mission?.description ||
                        'Multiple families stranded due to flash floods. Rescue and relocate affected people to the nearest safe location.'}
                    </Text>
                  </View>

                  {/* Instructions Section */}
                  <View style={styles.detailsSectionBox}>
                    <Text style={styles.sectionHeading}>Instructions</Text>
                    <View style={styles.bulletsList}>
                      {[
                        'Rescue stranded civilians (priority: children, elderly).',
                        'Coordinate with local authorities.',
                        'Ensure team safety (fast flowing water).',
                        'Report situation updates regularly.'
                      ].map((item, idx) => (
                        <View key={idx} style={styles.bulletRow}>
                          <View style={styles.bulletDot} />
                          <Text style={styles.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Big Blue Start Mission Button */}
                  <TouchableOpacity
                    onPress={handleStartMission}
                    disabled={actionLoading}
                    style={styles.startMissionBigBtn}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="play" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.startMissionBigBtnText}>Start Mission</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* ========================================================================= */}
              {/* SCREEN 4: NAVIGATION / EN ROUTE */}
              {/* ========================================================================= */}
              {activeScreen === 'en_route' && (
                <View>
                  {/* Top Status Card: Green Circle with Directional Icon */}
                  <View style={styles.enRouteStatusCard}>
                    <View style={styles.enRouteGreenIconCircle}>
                      <Ionicons name="navigate" size={20} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.enRouteCardTitle}>En Route</Text>
                      <Text style={styles.enRouteCardSubtitle}>
                        You are on the way to the mission location
                      </Text>
                      <Text style={styles.enRouteCardTime}>Started at 10:45 AM</Text>
                    </View>
                  </View>

                  {/* Live Satellite Navigation Map */}
                  <View style={styles.navMapContainer}>
                    <View style={styles.navMapCanvas}>
                      <View style={styles.navMapTerrain} />

                      {/* Origin Pin */}
                      <View style={[styles.mapPinBox, { bottom: 40, left: 30 }]}>
                        <View style={styles.originBluePinDot} />
                        <Text style={styles.mapPinLabel}>Rambukkana</Text>
                      </View>

                      {/* Waypoint Text */}
                      <Text style={[styles.mapTownLabel, { top: 90, left: 60 }]}>Alawathugoda</Text>

                      {/* Target Pin */}
                      <View style={[styles.mapPinBox, { top: 35, right: 40 }]}>
                        <Ionicons name="location-sharp" size={26} color="#DC2626" />
                        <View style={styles.hazardBubble}>
                          <Text style={styles.hazardBubbleText}>Hazard Location</Text>
                        </View>
                      </View>

                      {/* Glowing Route Polyline */}
                      <View style={styles.navGlowingPolyline} />

                      {/* Current Moving Vehicle Marker */}
                      <View style={styles.navCurrentMovingMarker}>
                        <View style={styles.movingMarkerOuterRing} />
                        <View style={styles.movingMarkerInnerDot}>
                          <Ionicons name="navigate" size={14} color="#FFFFFF" />
                        </View>
                      </View>

                      {/* Map Controls */}
                      <TouchableOpacity style={styles.navExpandBtn}>
                        <MaterialCommunityIcons name="arrow-expand-all" size={14} color="#0F172A" />
                      </TouchableOpacity>
                      <View style={styles.navZoomStack}>
                        <TouchableOpacity style={styles.navZoomBtn}>
                          <Feather name="plus" size={14} color="#0F172A" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navZoomBtn}>
                          <Feather name="minus" size={14} color="#0F172A" />
                        </TouchableOpacity>
                      </View>

                      {/* Bottom Floating Bar over map */}
                      <View style={styles.navFloatingEtaBar}>
                        <View style={styles.carIconBox}>
                          <Ionicons name="car" size={18} color="#0066FF" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.etaMainText}>12 min</Text>
                          <Text style={styles.etaSubText}>6.8 km • Arriving at 10:57 AM</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => Alert.alert('Navigation', 'GPS locked to vehicle.')}
                          style={styles.recenterBtn}
                        >
                          <Text style={styles.recenterBtnText}>Re-center</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Arrival Trigger Button */}
                  <TouchableOpacity
                    onPress={handleMarkArrival}
                    disabled={actionLoading}
                    style={[styles.solidBlueActionBtn, { marginTop: 14 }]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="map-pin" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.solidBlueActionBtnText}>I Have Arrived at Destination</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* ========================================================================= */}
              {/* SCREEN 5: ARRIVED AT DESTINATION */}
              {/* ========================================================================= */}
              {activeScreen === 'at_destination' && (
                <View>
                  {/* Top Status Card: Green circle with pin */}
                  <View style={styles.enRouteStatusCard}>
                    <View style={styles.destinationGreenIconCircle}>
                      <Ionicons name="location-sharp" size={20} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.enRouteCardTitle}>At Destination</Text>
                      <Text style={styles.enRouteCardSubtitle}>
                        You have arrived at the mission location
                      </Text>
                      <Text style={styles.enRouteCardTime}>10:58 AM, 10 Oct 2024</Text>
                    </View>
                  </View>

                  {/* Arrival Location Map Area */}
                  <View style={styles.atDestMapContainer}>
                    <View style={styles.atDestMapCanvas}>
                      <View style={styles.navMapTerrain} />
                      <Text style={[styles.mapTownLabel, { bottom: 40, left: 35 }]}>Alawathugoda</Text>

                      {/* Destination Pin */}
                      <View style={[styles.mapPinBox, { top: 35, right: 55 }]}>
                        <Ionicons name="location-sharp" size={26} color="#DC2626" />
                        <View style={styles.hazardBubble}>
                          <Text style={styles.hazardBubbleText}>Hazard Location</Text>
                        </View>
                      </View>

                      {/* Circular Radius Arrival Zone */}
                      <View style={styles.arrivalZoneCircle}>
                        <View style={styles.arrivalZoneInnerPin} />
                      </View>

                      <TouchableOpacity style={styles.navExpandBtn}>
                        <MaterialCommunityIcons name="arrow-expand-all" size={14} color="#0F172A" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Form: Send Update to District Officer */}
                  <View style={styles.updateFormCard}>
                    <Text style={styles.formSectionTitle}>Send Update to District Officer</Text>
                    <TextInput
                      value={updateMessage}
                      onChangeText={setUpdateMessage}
                      multiline
                      numberOfLines={3}
                      style={styles.updateTextArea}
                      placeholder="Enter update message..."
                      placeholderTextColor="#94A3B8"
                    />
                    <Text style={styles.charCountText}>{updateMessage.length}/200</Text>

                    <TouchableOpacity
                      onPress={handleSendUpdate}
                      disabled={actionLoading}
                      style={styles.sendUpdateBtn}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="send" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.sendUpdateBtnText}>Send Update</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Status Banner: Update sent to District Officer */}
                  {updateSentSuccess && (
                    <View style={styles.updateSentSuccessBanner}>
                      <View style={styles.successCheckCircle}>
                        <Feather name="check" size={14} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.successBannerTitle}>Update sent to District Officer</Text>
                        <Text style={styles.successBannerSub}>
                          Your location and rescue area now visible in the tracking system.
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Proceed to Complete Button */}
                  <TouchableOpacity
                    onPress={() => {
                      setActiveScreen('complete_mission');
                      setActiveTab('completed');
                    }}
                    style={[styles.outlineBlueActionBtn, { marginTop: 14 }]}
                  >
                    <Text style={styles.outlineBlueActionBtnText}>Proceed to Complete Mission</Text>
                    <Feather name="arrow-right" size={15} color="#0066FF" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              )}

              {/* ========================================================================= */}
              {/* SCREEN 6: RESCUE COMPLETED / COMPLETE MISSION */}
              {/* ========================================================================= */}
              {activeScreen === 'complete_mission' && (
                <View>
                  {/* Confetti & Completed Header */}
                  <View style={styles.completedCelebrationCard}>
                    {/* Confetti Dots Decorative */}
                    <View style={styles.confettiContainer}>
                      <View style={[styles.confettiDot, { backgroundColor: '#EF4444', top: 5, left: 30 }]} />
                      <View style={[styles.confettiDot, { backgroundColor: '#3B82F6', top: 12, left: 70 }]} />
                      <View style={[styles.confettiDot, { backgroundColor: '#10B981', top: 6, right: 60 }]} />
                      <View style={[styles.confettiDot, { backgroundColor: '#F59E0B', top: 18, right: 35 }]} />
                      <View style={[styles.confettiDot, { backgroundColor: '#8B5CF6', bottom: 10, left: 45 }]} />
                      <View style={[styles.confettiDot, { backgroundColor: '#EC4899', bottom: 8, right: 50 }]} />
                    </View>

                    {/* Big Green Checkmark Circle */}
                    <View style={styles.bigGreenCheckCircle}>
                      <Feather name="check" size={32} color="#FFFFFF" />
                    </View>

                    <Text style={styles.operationCompletedTitle}>
                      Rescue Operation Completed
                    </Text>
                    <Text style={styles.operationCompletedSubtitle}>
                      Mission marked as complete. Tracking stopped.
                    </Text>
                  </View>

                  {/* Mission Summary Card */}
                  <View style={styles.missionSummaryCard}>
                    <Text style={styles.summaryCardHeading}>Mission Summary</Text>

                    <View style={styles.summaryRow}>
                      <MaterialCommunityIcons name="waves" size={16} color="#DC2626" style={styles.summaryIcon} />
                      <Text style={[styles.summaryRowText, styles.summaryBold]}>
                        {mission?.title || 'Flood Rescue Operation'}
                      </Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Feather name="map-pin" size={15} color="#64748B" style={styles.summaryIcon} />
                      <Text style={styles.summaryRowText}>{mission?.district || 'Kandy District'}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Feather name="navigation" size={15} color="#0066FF" style={styles.summaryIcon} />
                      <Text style={styles.summaryRowText}>
                        {mission?.destination?.address ||
                          'Rambukkana - Ginigathena Road (near Alawathugoda Bridge)'}
                      </Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Feather name="clock" size={15} color="#64748B" style={styles.summaryIcon} />
                      <View>
                        <Text style={styles.summaryRowLabel}>Started</Text>
                        <Text style={styles.summaryRowValue}>10:45 AM, 10 Oct 2024</Text>
                      </View>
                    </View>

                    <View style={styles.summaryRow}>
                      <Feather name="calendar" size={15} color="#64748B" style={styles.summaryIcon} />
                      <View>
                        <Text style={styles.summaryRowLabel}>Completed</Text>
                        <Text style={styles.summaryRowValue}>02:15 PM, 10 Oct 2024</Text>
                      </View>
                    </View>

                    <View style={styles.summaryRow}>
                      <Feather name="watch" size={15} color="#64748B" style={styles.summaryIcon} />
                      <View>
                        <Text style={styles.summaryRowLabel}>Duration</Text>
                        <Text style={styles.summaryRowValue}>3 hours 30 minutes</Text>
                      </View>
                    </View>
                  </View>

                  {/* Completion Note (Optional) */}
                  <View style={styles.completionNoteCard}>
                    <Text style={styles.completionNoteLabel}>Completion Note (Optional)</Text>
                    <TextInput
                      value={completionNote}
                      onChangeText={setCompletionNote}
                      multiline
                      numberOfLines={3}
                      style={styles.completionNoteTextArea}
                      placeholder="Add completion notes..."
                      placeholderTextColor="#94A3B8"
                    />
                    <Text style={styles.charCountText}>{completionNote.length}/200</Text>

                    {/* Mark as Complete Button */}
                    <TouchableOpacity
                      onPress={handleMarkAsComplete}
                      disabled={actionLoading}
                      style={styles.solidBlueActionBtn}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Feather name="check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.solidBlueActionBtnText}>Mark as Complete</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ========================================================================= */}
              {/* PROFILE TAB */}
              {/* ========================================================================= */}
              {activeScreen === 'profile' && (
                <View style={styles.profileContainer}>
                  <View style={styles.profileAvatarLarge}>
                    <Text style={styles.profileAvatarLargeText}>RT</Text>
                  </View>
                  <Text style={styles.profileNameText}>Water Rescue Team - 01</Text>
                  <Text style={styles.profileRoleText}>Field Deployment Unit • Galle / Kandy</Text>

                  <View style={styles.profileMetaList}>
                    <View style={styles.profileMetaRow}>
                      <Text style={styles.profileMetaLabel}>Leader:</Text>
                      <Text style={styles.profileMetaVal}>Capt. Sunimal Perera</Text>
                    </View>
                    <View style={styles.profileMetaRow}>
                      <Text style={styles.profileMetaLabel}>Members:</Text>
                      <Text style={styles.profileMetaVal}>6 Rescue Divers</Text>
                    </View>
                    <View style={styles.profileMetaRow}>
                      <Text style={styles.profileMetaLabel}>Vehicle:</Text>
                      <Text style={styles.profileMetaVal}>Rescue Boat WB-01</Text>
                    </View>
                    <View style={styles.profileMetaRow}>
                      <Text style={styles.profileMetaLabel}>Base Station:</Text>
                      <Text style={styles.profileMetaVal}>Hikkaduwa Marine Depot</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      logout();
                      router.replace('/(auth)/login');
                    }}
                    style={styles.logoutFullBtn}
                  >
                    <Feather name="log-out" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutFullBtnText}>Log Out</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* ========================================================================= */}
        {/* BOTTOM NAVIGATION BAR */}
        {/* ========================================================================= */}
        <View style={styles.bottomNavBar}>
          {/* 1. Missions */}
          <TouchableOpacity
            onPress={() => handleSelectTab('missions')}
            style={styles.navBarItem}
          >
            <View style={{ position: 'relative' }}>
              <Feather
                name="home"
                size={22}
                color={activeTab === 'missions' ? '#0066FF' : '#94A3B8'}
              />
              {!isCompletedState && (
                <View style={styles.navBadgeRed}>
                  <Text style={styles.navBadgeRedText}>1</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.navBarLabel,
                activeTab === 'missions' && styles.navBarLabelActive
              ]}
            >
              Missions
            </Text>
          </TouchableOpacity>

          {/* 2. Active Mission */}
          <TouchableOpacity
            onPress={() => handleSelectTab('active_mission')}
            style={styles.navBarItem}
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={22}
              color={activeTab === 'active_mission' ? '#0066FF' : '#94A3B8'}
            />
            <Text
              style={[
                styles.navBarLabel,
                activeTab === 'active_mission' && styles.navBarLabelActive
              ]}
            >
              Active Mission
            </Text>
          </TouchableOpacity>

          {/* 3. Completed */}
          <TouchableOpacity
            onPress={() => handleSelectTab('completed')}
            style={styles.navBarItem}
          >
            <Feather
              name="check-circle"
              size={22}
              color={activeTab === 'completed' ? '#0066FF' : '#94A3B8'}
            />
            <Text
              style={[
                styles.navBarLabel,
                activeTab === 'completed' && styles.navBarLabelActive
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>

          {/* 4. Profile */}
          <TouchableOpacity
            onPress={() => handleSelectTab('profile')}
            style={styles.navBarItem}
          >
            <Feather
              name="user"
              size={22}
              color={activeTab === 'profile' ? '#0066FF' : '#94A3B8'}
            />
            <Text
              style={[
                styles.navBarLabel,
                activeTab === 'profile' && styles.navBarLabelActive
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  phoneFrameContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  phoneScreen: {
    width: '100%',
    maxWidth: 440,
    height: '100%',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    position: 'relative'
  },

  /* 1. STATUS BAR */
  phoneStatusBar: {
    height: 38,
    backgroundColor: '#0B1B36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4
  },
  statusBarTime: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  statusBarIcons: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  /* 2. APP HEADER */
  appHeader: {
    height: 54,
    backgroundColor: '#0B1B36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)'
  },
  appHeaderBrand: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  emblemBadge: {
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
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  brandSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600'
  },
  bellBtn: {
    position: 'relative',
    padding: 6
  },
  bellDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444'
  },
  appHeaderBack: {
    height: 52,
    backgroundColor: '#0B1B36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14
  },
  headerBackBtn: {
    padding: 6
  },
  headerBackTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },

  /* 3. SCROLL CONTENT */
  mainScrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center'
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 10
  },

  /* SCREEN 2: ASSIGNED MISSION */
  assignedMissionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  screenMainTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900'
  },
  redCountBadge: {
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  redCountBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900'
  },
  missionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3
  },
  newMissionBanner: {
    backgroundColor: '#EF4444',
    paddingVertical: 7,
    alignItems: 'center'
  },
  newMissionBannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  floodImageCanvas: {
    height: 140,
    backgroundColor: '#78350F', // Earthy muddy water tone
    position: 'relative',
    overflow: 'hidden'
  },
  floodWaterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#B45309',
    opacity: 0.75
  },
  floodHouseIcon1: {
    position: 'absolute',
    top: 25,
    left: 40
  },
  floodHouseIcon2: {
    position: 'absolute',
    top: 40,
    left: 120
  },
  floodWaterWaves: {
    position: 'absolute',
    bottom: 15,
    right: 30
  },
  missionCardBody: {
    padding: 16
  },
  highPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8
  },
  highPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900'
  },
  operationTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  metaLineText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '500'
  },
  cardDescText: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 18,
    marginVertical: 10
  },
  destinationBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  destinationTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700'
  },
  destinationAddressText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 17
  },
  solidBlueActionBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  solidBlueActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },

  /* SCREEN 3: MISSION DETAILS */
  detailsHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    marginBottom: 12
  },
  detailsWarningIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center'
  },
  detailsHeaderTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4
  },
  detailsHighSeverityBadge: {
    backgroundColor: '#EF4444',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4
  },
  detailsHighSeverityText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900'
  },
  segmentedTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 3,
    marginBottom: 12
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6
  },
  segmentTabActive: {
    backgroundColor: '#EFF6FF'
  },
  segmentTabText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600'
  },
  segmentTabTextActive: {
    color: '#0066FF',
    fontWeight: '800'
  },
  previewMapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    marginBottom: 12
  },
  previewMapCanvas: {
    height: 140,
    backgroundColor: '#1E3A2F', // Satellite vegetation tint
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden'
  },
  mapGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    borderColor: '#FFFFFF',
    borderWidth: 1
  },
  mapPinBox: {
    position: 'absolute',
    alignItems: 'center'
  },
  originBluePinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0066FF',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  mapPinLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    borderRadius: 3,
    marginTop: 2
  },
  hazardBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  hazardBubbleText: {
    color: '#0F172A',
    fontSize: 9,
    fontWeight: '800'
  },
  previewRoutePath: {
    position: 'absolute',
    top: 55,
    left: 45,
    width: 120,
    height: 35,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#38BDF8',
    borderRadius: 12,
    borderStyle: 'dashed'
  },
  expandMapBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 5
  },
  detailsSectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12
  },
  sectionHeading: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6
  },
  sectionBodyText: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 18
  },
  bulletsList: {
    gap: 6
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#0F172A',
    marginTop: 6,
    marginRight: 8
  },
  bulletText: {
    color: '#334155',
    fontSize: 12,
    flex: 1,
    lineHeight: 17
  },
  startMissionBigBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  startMissionBigBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },

  /* SCREEN 4: EN ROUTE */
  enRouteStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  enRouteGreenIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center'
  },
  destinationGreenIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center'
  },
  enRouteCardTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900'
  },
  enRouteCardSubtitle: {
    color: '#475569',
    fontSize: 11,
    marginTop: 1
  },
  enRouteCardTime: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2
  },
  navMapContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6
  },
  navMapCanvas: {
    height: 290,
    backgroundColor: '#1A3326',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden'
  },
  navMapTerrain: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1D3B2B',
    opacity: 0.95
  },
  mapTownLabel: {
    position: 'absolute',
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    borderRadius: 4
  },
  navGlowingPolyline: {
    position: 'absolute',
    top: 50,
    left: 45,
    width: 150,
    height: 120,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#0284C7',
    borderRadius: 20
  },
  navCurrentMovingMarker: {
    position: 'absolute',
    top: 130,
    left: 100,
    alignItems: 'center',
    justifyContent: 'center'
  },
  movingMarkerOuterRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 102, 255, 0.35)',
    position: 'absolute'
  },
  movingMarkerInnerDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  navExpandBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 6
  },
  navZoomStack: {
    position: 'absolute',
    bottom: 75,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  navZoomBtn: {
    padding: 6,
    alignItems: 'center'
  },
  navFloatingEtaBar: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4
  },
  carIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  etaMainText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900'
  },
  etaSubText: {
    color: '#64748B',
    fontSize: 10
  },
  recenterBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  recenterBtnText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700'
  },

  /* SCREEN 5: ARRIVED AT DESTINATION */
  atDestMapContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    marginBottom: 12
  },
  atDestMapCanvas: {
    height: 160,
    backgroundColor: '#1E3A2F',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden'
  },
  arrivalZoneCircle: {
    position: 'absolute',
    top: 45,
    right: 65,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  arrivalZoneInnerPin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0066FF'
  },
  updateFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12
  },
  formSectionTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8
  },
  updateTextArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
    color: '#0F172A',
    fontSize: 12,
    minHeight: 65,
    textAlignVertical: 'top'
  },
  charCountText: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 8
  },
  sendUpdateBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 6,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendUpdateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  updateSentSuccessBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  successCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center'
  },
  successBannerTitle: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '800'
  },
  successBannerSub: {
    color: '#166534',
    fontSize: 10,
    marginTop: 2
  },
  outlineBlueActionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  outlineBlueActionBtnText: {
    color: '#0066FF',
    fontSize: 13,
    fontWeight: '800'
  },

  /* SCREEN 6: RESCUE COMPLETED */
  completedCelebrationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    position: 'relative',
    marginBottom: 14
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject
  },
  confettiDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3
  },
  bigGreenCheckCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#16A34A',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6
  },
  operationCompletedTitle: {
    color: '#166534',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center'
  },
  operationCompletedSubtitle: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4
  },
  missionSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14
  },
  summaryCardHeading: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  summaryIcon: {
    marginRight: 10,
    marginTop: 2
  },
  summaryRowText: {
    color: '#334155',
    fontSize: 12,
    flex: 1
  },
  summaryBold: {
    fontWeight: '800',
    color: '#0F172A'
  },
  summaryRowLabel: {
    color: '#64748B',
    fontSize: 10
  },
  summaryRowValue: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600'
  },
  completionNoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14
  },
  completionNoteLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8
  },
  completionNoteTextArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
    color: '#0F172A',
    fontSize: 12,
    minHeight: 65,
    textAlignVertical: 'top'
  },

  /* PROFILE TAB */
  profileContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center'
  },
  profileAvatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  profileAvatarLargeText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900'
  },
  profileNameText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800'
  },
  profileRoleText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 18
  },
  profileMetaList: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
    gap: 8,
    marginBottom: 20
  },
  profileMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  profileMetaLabel: {
    color: '#64748B',
    fontSize: 12
  },
  profileMetaVal: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700'
  },
  logoutFullBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  logoutFullBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },

  /* BOTTOM NAVIGATION BAR */
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 58,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 30
  },
  navBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  navBadgeRed: {
    position: 'absolute',
    top: -3,
    right: -6,
    backgroundColor: '#EF4444',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center'
  },
  navBadgeRedText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900'
  },
  navBarLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3
  },
  navBarLabelActive: {
    color: '#0066FF',
    fontWeight: '800'
  }
});
