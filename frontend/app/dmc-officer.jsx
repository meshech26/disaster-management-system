import React, { useState, useEffect } from 'react';
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
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { incidentService } from '../services/incidentService';
import { broadcastService } from '../services/broadcastService';
import DmcDistrictMap, { SRI_LANKA_DISTRICTS } from '../components/DmcDistrictMap';
import { formatTimeAgo } from '../utils/formatters';

export default function DmcOfficerDesktopPortal() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Navigation state: 'dashboard' | 'verified_incidents' | 'create_warning' | 'active_warnings' | 'completed_warnings' | 'reports' | 'settings'
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Live SLST Clock (Asia/Colombo, UTC+5:30)
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Data Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({
    verifiedIncidents: 0,
    draftWarnings: 0,
    activeWarnings: 0,
    completedWarnings: 0
  });

  // Incidents & Warnings State
  const [verifiedIncidents, setVerifiedIncidents] = useState([]);
  const [activeWarningsList, setActiveWarningsList] = useState([]);
  const [draftWarningsList, setDraftWarningsList] = useState([]);
  const [completedWarningsList, setCompletedWarningsList] = useState([]);

  // Inspection & Creation state
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Create Warning Form State
  const [warningTitle, setWarningTitle] = useState('');
  const [hazardType, setHazardType] = useState('flood');
  const [severityLevel, setSeverityLevel] = useState('critical'); // 'critical' | 'high' | 'medium' | 'low'
  const [selectedDistrict, setSelectedDistrict] = useState('Colombo');
  const [warningMessage, setWarningMessage] = useState('');
  const [actionInstructions, setActionInstructions] = useState([
    'Avoid the area and stay indoors.',
    'Water levels are rising fast; shut off ground electricity.',
    'Follow guidance from local Grama Niladhari and rescue forces.'
  ]);
  const [emergencyHotlines, setEmergencyHotlines] = useState([
    { name: 'DMC Hotline', phone: '117 / +94 11 213 6136' },
    { name: 'Suwa Seriya Ambulance', phone: '1990' },
    { name: 'Police Emergency', phone: '119 / 112' }
  ]);
  const [basedOnReport, setBasedOnReport] = useState(null);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [hazardDropdownOpen, setHazardDropdownOpen] = useState(false);

  // Completed Warning Inspection
  const [selectedCompletedWarning, setSelectedCompletedWarning] = useState(null);

  // Official Report Generation Modal State
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportType, setReportType] = useState('Event Reports (PDF)');
  const [generatedReportData, setGeneratedReportData] = useState(null);

  // Fetch all initial data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, incidentsRes, activeRes, draftRes, completedRes] = await Promise.all([
        broadcastService.getBroadcastStats(),
        incidentService.getIncidents({ status: 'verified', limit: 50 }),
        broadcastService.getAllBroadcasts({ status: 'active' }),
        broadcastService.getAllBroadcasts({ status: 'draft' }),
        broadcastService.getAllBroadcasts({ status: 'completed' })
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (incidentsRes?.data) setVerifiedIncidents(incidentsRes.data || []);
      if (activeRes?.data) setActiveWarningsList(activeRes.data || []);
      if (draftRes?.data) setDraftWarningsList(draftRes.data || []);
      if (completedRes?.data) {
        setCompletedWarningsList(completedRes.data || []);
        if (completedRes.data.length > 0 && !selectedCompletedWarning) {
          setSelectedCompletedWarning(completedRes.data[0]);
        }
      }
    } catch (err) {
      console.warn('[DMC] Error loading dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Format SLST date and time strings
  const formattedSLSTDate = currentDateTime.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Colombo',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const formattedSLSTTime = currentDateTime.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Colombo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Switch to Create Warning prefilled from verified report
  const handleStartCreateWarning = (incident) => {
    setBasedOnReport(incident);
    setSelectedIncident(incident);
    const titleType =
      incident.disasterType === 'flood'
        ? 'Flooding Warning'
        : incident.disasterType === 'landslide'
        ? 'Landslide Risk Warning'
        : incident.disasterType === 'heavy_rain' || incident.disasterType === 'heavy_rain_lightning'
        ? 'Heavy Rain & Flash Flood Warning'
        : 'Emergency Hazard Warning';

    const locationName = incident.location?.address || 'Colombo';
    setWarningTitle(`${titleType} – ${locationName}`);
    setHazardType(incident.disasterType || 'flood');
    setSeverityLevel(incident.severity || 'high');

    // Parse district from address
    const matchedDistrict = SRI_LANKA_DISTRICTS.find((d) =>
      locationName.toLowerCase().includes(d.name.toLowerCase())
    );
    setSelectedDistrict(matchedDistrict ? matchedDistrict.name : 'Colombo');

    setWarningMessage(
      `URGENT: ${incident.title}. ${incident.description || 'Avoid the area and exercise extreme caution.'}`
    );
    setActiveNav('create_warning');
  };

  // Inspect verified report details (Panel 3)
  const handleReviewReport = (incident) => {
    setSelectedIncident(incident);
    setActivePhotoIndex(0);
    setActiveNav('review_report');
  };

  // 1. Action: Save as Draft
  const handleSaveAsDraft = async () => {
    if (!warningTitle.trim()) {
      Alert.alert('Required', 'Please enter a warning title.');
      return;
    }

    try {
      setActionLoading(true);
      await broadcastService.createBroadcast({
        title: warningTitle.trim(),
        message: warningMessage || `Draft warning for ${selectedDistrict}.`,
        disasterType: hazardType,
        severity: severityLevel,
        affectedDistrict: selectedDistrict,
        status: 'draft',
        isImmediateAlert: false,
        broadcastToAll: false,
        incidentId: basedOnReport?._id || null,
        actionInstructions,
        emergencyHotlines
      });

      Alert.alert('Success', 'Warning saved as Draft successfully.');
      await loadDashboardData();
      setActiveNav('dashboard');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save draft');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Action: 📢 Broadcast Warning (Active Warning to all citizens & volunteers)
  const handleBroadcastWarning = async () => {
    if (!warningTitle.trim()) {
      Alert.alert('Required', 'Please enter a warning title.');
      return;
    }

    try {
      setActionLoading(true);
      await broadcastService.createBroadcast({
        title: warningTitle.trim(),
        message: warningMessage || `Emergency hazard warning active in ${selectedDistrict}.`,
        disasterType: hazardType,
        severity: severityLevel,
        affectedDistrict: selectedDistrict,
        status: 'active',
        isImmediateAlert: false,
        broadcastToAll: true,
        incidentId: basedOnReport?._id || null,
        actionInstructions,
        emergencyHotlines
      });

      Alert.alert(
        'Warning Broadcasted',
        `Warning "${warningTitle}" is now live and published to all citizens and volunteers.`
      );
      await loadDashboardData();
      setActiveNav('active_warnings');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to broadcast warning');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Action: ⚠️ Send Immediate Alert (Immediate 10s auto-dismiss emergency popup)
  const handleSendImmediateAlert = async () => {
    if (!warningTitle.trim()) {
      Alert.alert('Required', 'Please enter a warning title.');
      return;
    }

    try {
      setActionLoading(true);
      await broadcastService.createBroadcast({
        title: warningTitle.trim(),
        message:
          warningMessage ||
          `Immediate danger warning in ${selectedDistrict}. Avoid the area and stay indoors. Water levels and hazard conditions rising fast.`,
        disasterType: hazardType,
        severity: severityLevel,
        affectedDistrict: selectedDistrict,
        status: 'active',
        isImmediateAlert: true,
        broadcastToAll: false,
        incidentId: basedOnReport?._id || null,
        actionInstructions,
        emergencyHotlines
      });

      Alert.alert(
        'Immediate Alert Dispatched',
        `High-priority emergency alert sent to citizens & volunteers in ${selectedDistrict} District with a 10-second auto-dismiss popup and push siren.`
      );
      await loadDashboardData();
      setActiveNav('active_warnings');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send immediate alert');
    } finally {
      setActionLoading(false);
    }
  };

  // Re-trigger broadcast for existing warning
  const handleRebroadcast = async (warning) => {
    try {
      setActionLoading(true);
      await broadcastService.broadcastWarning(warning._id);
      Alert.alert('Broadcast Refreshed', `Warning "${warning.title}" was re-broadcasted to all users.`);
      await loadDashboardData();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Immediate Alert for existing active warning
  const handleTriggerImmediateOnActive = async (warning) => {
    try {
      setActionLoading(true);
      await broadcastService.sendImmediateAlert(warning._id);
      Alert.alert(
        'Immediate Alert Sent',
        `Emergency popup triggered to all users in ${warning.affectedDistrict || 'affected'} district.`
      );
      await loadDashboardData();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Disaster Event as Completed (Moves from active to completed, removes from mobile live alerts)
  const handleMarkAsComplete = async (warning) => {
    const doComplete = async () => {
      try {
        setActionLoading(true);
        await broadcastService.completeWarning(warning._id);
        Alert.alert(
          'Disaster Event Completed',
          `"${warning.title}" has been marked as completed. It is now archived in Completed Warnings and removed from live citizen alert feeds.`
        );
        await loadDashboardData();
        setActiveNav('completed_warnings');
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setActionLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Mark disaster event "${warning.title}" as completed? This will remove the active warning from citizen feeds.`)) {
        doComplete();
      }
    } else {
      Alert.alert(
        'Complete Disaster Event',
        `Are you sure you want to mark "${warning.title}" as completed? The warning will disappear from citizen live alert feeds.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Mark Complete', style: 'default', onPress: doComplete }
        ]
      );
    }
  };

  // Generate Official PDF Report
  const handleGenerateReportModal = (warning) => {
    const target = warning || selectedCompletedWarning || completedWarningsList[0];
    if (!target) {
      Alert.alert('No Event', 'Please select a completed warning first.');
      return;
    }
    setSelectedCompletedWarning(target);
    setGeneratedReportData({
      reportId: `DMC-REP-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
      title: target.title,
      disasterType: target.disasterType,
      affectedDistrict: target.affectedDistrict || 'Colombo',
      issuedAt: target.createdAt || new Date(),
      completedAt: target.completedAt || new Date(),
      officer: user?.name || 'Chaminda Pathirana',
      officerRole: 'National Operations Director',
      metrics: target.postEventAnalysis || {
        totalAlertsSent: 12450,
        peopleReached: 432850,
        reportsReceived: 326,
        impactSummary: 'Localized roadway ponding, zero fatalities, rapid pump deployment.',
        remarks: 'Early warning dissemination facilitated swift community response.'
      }
    });
    setReportModalVisible(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
    } finally {
      router.replace('/(auth)/login');
    }
  };

  // Hazard Type formatting
  const getHazardBadge = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('flood')) {
      return { label: 'Flooding', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: 'water' };
    }
    if (t.includes('landslide') || t.includes('land slide')) {
      return { label: 'Landslide', bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', icon: 'image-filter-hdr' };
    }
    if (t.includes('wind') || t.includes('cyclone')) {
      return { label: 'Extreme Wind', bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE', icon: 'weather-windy' };
    }
    if (t.includes('rain') || t.includes('lightning')) {
      return { label: 'Heavy Rain', bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: 'weather-pouring' };
    }
    return { label: type || 'Hazard', bg: '#F1F5F9', text: '#334155', border: '#CBD5E1', icon: 'alert-circle-outline' };
  };

  // Severity color formatting
  const getSeverityBadge = (sev) => {
    const s = (sev || '').toLowerCase();
    if (s === 'critical') return { label: 'Critical', bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
    if (s === 'high') return { label: 'High', bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' };
    if (s === 'medium') return { label: 'Medium', bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };
    return { label: 'Low', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
  };

  return (
    <View style={styles.rootContainer}>
      {/* ================= TOP BRANDING & STATUS HEADER ================= */}
      <View style={styles.topHeaderBar}>
        <View style={styles.headerLeftBrand}>
          <TouchableOpacity
            onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={styles.menuToggleBtn}
          >
            <Feather name="menu" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.emblemBadge}>
            <MaterialCommunityIcons name="shield-alert" size={24} color="#EF4444" />
          </View>
          <View>
            <Text style={styles.topBrandTitle}>DMC SRI LANKA</Text>
            <Text style={styles.topBrandSubtitle}>Disaster Management System</Text>
          </View>
        </View>

        {/* Center: National Mission Motto */}
        <View style={styles.headerCenterMotto}>
          <Text style={styles.mottoText}>
            Early Warnings  •  Safer Communities  •  A Resilient Sri Lanka
          </Text>
        </View>

        {/* Right: Live SLST Clock & Officer Profile */}
        <View style={styles.headerRightSection}>
          {/* Live SLST Clock */}
          <View style={styles.slstClockBox}>
            <View style={styles.liveClockPulseDot} />
            <View>
              <Text style={styles.slstClockTime}>{formattedSLSTTime}</Text>
              <Text style={styles.slstClockDate}>{formattedSLSTDate} (SLST)</Text>
            </View>
          </View>

          {/* Bell Notifications */}
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>4</Text>
            </View>
          </TouchableOpacity>

          {/* User Profile Pill */}
          <TouchableOpacity
            onPress={() => setShowProfileMenu(!showProfileMenu)}
            style={styles.officerProfilePill}
            activeOpacity={0.8}
          >
            <View style={styles.officerAvatar}>
              <Text style={styles.officerAvatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
              </Text>
            </View>
            <View style={styles.officerInfoText}>
              <Text style={styles.officerName}>{user?.name || 'Chaminda Pathirana'}</Text>
              <Text style={styles.officerRoleText}>DMC Officer</Text>
            </View>
            <Feather name="chevron-down" size={16} color="#94A3B8" />
          </TouchableOpacity>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <View style={styles.profileDropdown}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownName}>{user?.name || 'Chaminda Pathirana'}</Text>
                <Text style={styles.dropdownEmail}>{user?.email || 'dmcofficer@dmc.gov.lk'}</Text>
                <Text style={styles.dropdownRole}>DMC National Operations Centre</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowProfileMenu(false);
                  router.push('/duty-officer');
                }}
                style={styles.dropdownItem}
              >
                <Feather name="shield" size={16} color="#1E3A8A" style={{ marginRight: 10 }} />
                <Text style={styles.dropdownItemText}>Switch to Duty Officer Portal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowProfileMenu(false);
                  router.push('/(tabs)');
                }}
                style={styles.dropdownItem}
              >
                <Feather name="smartphone" size={16} color="#1E3A8A" style={{ marginRight: 10 }} />
                <Text style={styles.dropdownItemText}>Switch to Mobile Citizen View</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={[styles.dropdownItem, styles.dropdownItemLogout]}>
                <Feather name="log-out" size={16} color="#DC2626" style={{ marginRight: 10 }} />
                <Text style={styles.dropdownItemLogoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* ================= MAIN WORKSPACE BODY ================= */}
      <View style={styles.mainWorkspace}>
        {/* ================= LEFT SIDEBAR NAVIGATION ================= */}
        <View style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}>
          <ScrollView contentContainerStyle={styles.sidebarContent}>
            {/* Nav Items */}
            <TouchableOpacity
              onPress={() => setActiveNav('dashboard')}
              style={[styles.navItem, activeNav === 'dashboard' && styles.navItemActive]}
            >
              <Feather
                name="grid"
                size={18}
                color={activeNav === 'dashboard' ? '#FFFFFF' : '#94A3B8'}
                style={styles.navIcon}
              />
              {!sidebarCollapsed && (
                <Text style={[styles.navText, activeNav === 'dashboard' && styles.navTextActive]}>
                  Dashboard
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveNav('verified_incidents')}
              style={[styles.navItem, (activeNav === 'verified_incidents' || activeNav === 'review_report') && styles.navItemActive]}
            >
              <Feather
                name="check-circle"
                size={18}
                color={activeNav === 'verified_incidents' || activeNav === 'review_report' ? '#FFFFFF' : '#94A3B8'}
                style={styles.navIcon}
              />
              {!sidebarCollapsed && (
                <View style={styles.navTextWithBadge}>
                  <Text style={[styles.navText, (activeNav === 'verified_incidents' || activeNav === 'review_report') && styles.navTextActive]}>
                    Verified Incidents
                  </Text>
                  <View style={styles.navCounterBadge}>
                    <Text style={styles.navCounterText}>{stats.verifiedIncidents}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setBasedOnReport(null);
                setActiveNav('create_warning');
              }}
              style={[styles.navItem, activeNav === 'create_warning' && styles.navItemActive]}
            >
              <Feather
                name="plus-circle"
                size={18}
                color={activeNav === 'create_warning' ? '#FFFFFF' : '#94A3B8'}
                style={styles.navIcon}
              />
              {!sidebarCollapsed && (
                <Text style={[styles.navText, activeNav === 'create_warning' && styles.navTextActive]}>
                  Create Warning
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveNav('active_warnings')}
              style={[styles.navItem, activeNav === 'active_warnings' && styles.navItemActive]}
            >
              <Feather
                name="alert-triangle"
                size={18}
                color={activeNav === 'active_warnings' ? '#FFFFFF' : '#94A3B8'}
                style={styles.navIcon}
              />
              {!sidebarCollapsed && (
                <View style={styles.navTextWithBadge}>
                  <Text style={[styles.navText, activeNav === 'active_warnings' && styles.navTextActive]}>
                    Active Warnings
                  </Text>
                  <View style={[styles.navCounterBadge, { backgroundColor: '#DC2626' }]}>
                    <Text style={styles.navCounterText}>{stats.activeWarnings}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveNav('completed_warnings')}
              style={[styles.navItem, activeNav === 'completed_warnings' && styles.navItemActive]}
            >
              <Feather
                name="check-square"
                size={18}
                color={activeNav === 'completed_warnings' ? '#FFFFFF' : '#94A3B8'}
                style={styles.navIcon}
              />
              {!sidebarCollapsed && (
                <View style={styles.navTextWithBadge}>
                  <Text style={[styles.navText, activeNav === 'completed_warnings' && styles.navTextActive]}>
                    Completed Warnings
                  </Text>
                  <View style={[styles.navCounterBadge, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.navCounterText}>{stats.completedWarnings}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveNav('reports')}
              style={[styles.navItem, activeNav === 'reports' && styles.navItemActive]}
            >
              <Feather
                name="file-text"
                size={18}
                color={activeNav === 'reports' ? '#FFFFFF' : '#94A3B8'}
                style={styles.navIcon}
              />
              {!sidebarCollapsed && (
                <Text style={[styles.navText, activeNav === 'reports' && styles.navTextActive]}>
                  Reports
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveNav('settings')}
              style={[styles.navItem, activeNav === 'settings' && styles.navItemActive]}
            >
              <Feather
                name="settings"
                size={18}
                color={activeNav === 'settings' ? '#FFFFFF' : '#94A3B8'}
                style={styles.navIcon}
              />
              {!sidebarCollapsed && (
                <Text style={[styles.navText, activeNav === 'settings' && styles.navTextActive]}>
                  Settings
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Sidebar Bottom Footer */}
          {!sidebarCollapsed && (
            <View style={styles.sidebarFooter}>
              <View style={styles.systemStatusRow}>
                <View style={styles.greenOnlineDot} />
                <Text style={styles.systemStatusText}>DMC National Grid: Online</Text>
              </View>
            </View>
          )}
        </View>

        {/* ================= RIGHT WORKSPACE CONTENT VIEW ================= */}
        <View style={styles.contentArea}>
          {loading ? (
            <View style={styles.centerLoadingContainer}>
              <ActivityIndicator size="large" color="#1E3A8A" />
              <Text style={styles.loadingText}>Synchronizing DMC Operations Center...</Text>
            </View>
          ) : (
            <>
              {/* ================= VIEW 1: DASHBOARD (Panel 2) ================= */}
              {activeNav === 'dashboard' && (
                <ScrollView contentContainerStyle={styles.viewContainer}>
                  {/* Dashboard Title & Overview */}
                  <View style={styles.pageHeaderRow}>
                    <View>
                      <Text style={styles.pageTitle}>Dashboard</Text>
                      <Text style={styles.pageSubtitle}>
                        Overview of verified ground reports, active warnings and recent activities
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={loadDashboardData}
                      style={styles.refreshButton}
                      activeOpacity={0.8}
                    >
                      <Feather name="refresh-cw" size={15} color="#1E3A8A" style={{ marginRight: 6 }} />
                      <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 4 Metric Stat Cards */}
                  <View style={styles.statCardsGrid}>
                    {/* Card 1: Verified Incidents */}
                    <TouchableOpacity
                      onPress={() => setActiveNav('verified_incidents')}
                      style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}
                    >
                      <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
                        <Feather name="file-text" size={24} color="#2563EB" />
                      </View>
                      <View style={styles.statContent}>
                        <Text style={styles.statNumber}>{stats.verifiedIncidents}</Text>
                        <Text style={styles.statLabel}>Verified Incidents</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Card 2: Draft Warnings */}
                    <TouchableOpacity
                      onPress={() => setActiveNav('create_warning')}
                      style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}
                    >
                      <View style={[styles.statIconBox, { backgroundColor: '#FFFBEB' }]}>
                        <Feather name="edit-3" size={24} color="#D97706" />
                      </View>
                      <View style={styles.statContent}>
                        <Text style={styles.statNumber}>{stats.draftWarnings}</Text>
                        <Text style={styles.statLabel}>Draft Warnings</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Card 3: Active Warnings */}
                    <TouchableOpacity
                      onPress={() => setActiveNav('active_warnings')}
                      style={[styles.statCard, { borderLeftColor: '#EF4444' }]}
                    >
                      <View style={[styles.statIconBox, { backgroundColor: '#FEF2F2' }]}>
                        <Ionicons name="warning-outline" size={24} color="#DC2626" />
                      </View>
                      <View style={styles.statContent}>
                        <Text style={[styles.statNumber, { color: '#DC2626' }]}>
                          {stats.activeWarnings}
                        </Text>
                        <Text style={styles.statLabel}>Active Warnings</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Card 4: Completed Warnings */}
                    <TouchableOpacity
                      onPress={() => setActiveNav('completed_warnings')}
                      style={[styles.statCard, { borderLeftColor: '#10B981' }]}
                    >
                      <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
                        <Feather name="check-circle" size={24} color="#059669" />
                      </View>
                      <View style={styles.statContent}>
                        <Text style={[styles.statNumber, { color: '#059669' }]}>
                          {stats.completedWarnings}
                        </Text>
                        <Text style={styles.statLabel}>Completed Warnings</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Section: Verified Ground Reports */}
                  <View style={styles.sectionHeaderRow}>
                    <View>
                      <Text style={styles.sectionTitle}>Verified Ground Reports</Text>
                      <Text style={styles.sectionSubtitle}>
                        Forwarded by Duty Officer for hazard warning dissemination
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setActiveNav('verified_incidents')}
                      style={styles.viewAllBtn}
                    >
                      <Text style={styles.viewAllBtnText}>View All</Text>
                      <Feather name="arrow-right" size={15} color="#2563EB" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>

                  {/* Ground Reports List Cards */}
                  <View style={styles.reportsGrid}>
                    {verifiedIncidents.slice(0, 6).map((report) => {
                      const hazard = getHazardBadge(report.disasterType);
                      const sev = getSeverityBadge(report.severity);
                      const photoUrl =
                        report.mediaUrls && report.mediaUrls.length > 0
                          ? report.mediaUrls[0].url
                          : 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80';

                      return (
                        <View key={report._id} style={styles.verifiedCard}>
                          {/* Image preview */}
                          <Image source={{ uri: photoUrl }} style={styles.verifiedCardImage} />

                          {/* Card Content */}
                          <View style={styles.verifiedCardBody}>
                            <View style={styles.badgeRow}>
                              <View style={[styles.hazardPill, { backgroundColor: hazard.bg, borderColor: hazard.border }]}>
                                <Text style={[styles.hazardPillText, { color: hazard.text }]}>
                                  {hazard.label}
                                </Text>
                              </View>
                              <View style={[styles.severityPill, { backgroundColor: sev.bg, borderColor: sev.border }]}>
                                <Text style={[styles.severityPillText, { color: sev.text }]}>
                                  {sev.label}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.verifiedCardTitle} numberOfLines={1}>
                              {report.title}
                            </Text>

                            <View style={styles.verifiedCardMetaRow}>
                              <Feather name="map-pin" size={13} color="#64748B" />
                              <Text style={styles.verifiedCardMetaText} numberOfLines={1}>
                                {report.location?.address || 'Colombo'}
                              </Text>
                            </View>

                            <View style={styles.verifiedCardMetaRow}>
                              <Feather name="clock" size={13} color="#64748B" />
                              <Text style={styles.verifiedCardMetaText}>
                                {new Date(report.createdAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}{' '}
                                • {formatTimeAgo(report.createdAt)}
                              </Text>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.cardActionsRow}>
                              <TouchableOpacity
                                onPress={() => handleReviewReport(report)}
                                style={styles.reviewReportBtn}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.reviewReportBtnText}>Review Report</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleStartCreateWarning(report)}
                                style={styles.createWarningBtn}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.createWarningBtnText}>Create Warning</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              )}

              {/* ================= VIEW 2: REVIEW VERIFIED REPORT (Panel 3) ================= */}
              {activeNav === 'review_report' && selectedIncident && (
                <ScrollView contentContainerStyle={styles.viewContainer}>
                  {/* Back Link */}
                  <TouchableOpacity
                    onPress={() => setActiveNav('dashboard')}
                    style={styles.backLinkRow}
                  >
                    <Feather name="chevron-left" size={18} color="#2563EB" />
                    <Text style={styles.backLinkText}>Back to Verified Incidents</Text>
                  </TouchableOpacity>

                  {/* Header Row */}
                  <View style={styles.reportDetailHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.badgeRow}>
                        <View style={styles.dutyOfficerVerifiedBadge}>
                          <Feather name="check" size={14} color="#059669" style={{ marginRight: 4 }} />
                          <Text style={styles.dutyOfficerVerifiedBadgeText}>Verified by Duty Officer</Text>
                        </View>
                        <View style={[styles.hazardPill, { backgroundColor: getHazardBadge(selectedIncident.disasterType).bg }]}>
                          <Text style={[styles.hazardPillText, { color: getHazardBadge(selectedIncident.disasterType).text }]}>
                            {getHazardBadge(selectedIncident.disasterType).label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.detailReportTitle}>{selectedIncident.title}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleStartCreateWarning(selectedIncident)}
                      style={styles.headerPrimaryActionBtn}
                      activeOpacity={0.85}
                    >
                      <Feather name="plus-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.headerPrimaryActionBtnText}>Create Warning</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Meta Bar */}
                  <View style={styles.reportMetaCard}>
                    <View style={styles.reportMetaItem}>
                      <Feather name="map-pin" size={16} color="#DC2626" />
                      <Text style={styles.reportMetaItemText}>
                        {selectedIncident.location?.address || 'Colombo'}
                      </Text>
                    </View>
                    <View style={styles.reportMetaItem}>
                      <Feather name="calendar" size={16} color="#2563EB" />
                      <Text style={styles.reportMetaItemText}>
                        {new Date(selectedIncident.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}{' '}
                        {new Date(selectedIncident.createdAt).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    <View style={styles.reportMetaItem}>
                      <View style={[styles.severityPill, { backgroundColor: getSeverityBadge(selectedIncident.severity).bg }]}>
                        <Text style={[styles.severityPillText, { color: getSeverityBadge(selectedIncident.severity).text }]}>
                          Severity: {getSeverityBadge(selectedIncident.severity).label}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reportMetaItem}>
                      <Text style={styles.reportNumberPill}>
                        {selectedIncident.reportNumber || '#DR-2024-001'}
                      </Text>
                    </View>
                  </View>

                  {/* Two-Column Inspection Grid: Photos & Map */}
                  <View style={styles.detailTwoColGrid}>
                    {/* Left: Media Gallery */}
                    <View style={styles.galleryColumn}>
                      <Text style={styles.subCardTitle}>Photo Evidence</Text>
                      {selectedIncident.mediaUrls && selectedIncident.mediaUrls.length > 0 ? (
                        <>
                          <Image
                            source={{ uri: selectedIncident.mediaUrls[activePhotoIndex]?.url }}
                            style={styles.heroMainImage}
                          />
                          <ScrollView horizontal style={styles.thumbStrip}>
                            {selectedIncident.mediaUrls.map((media, idx) => (
                              <TouchableOpacity
                                key={idx}
                                onPress={() => setActivePhotoIndex(idx)}
                                style={[
                                  styles.thumbItemBox,
                                  activePhotoIndex === idx && styles.thumbItemBoxActive
                                ]}
                              >
                                <Image source={{ uri: media.url }} style={styles.thumbImage} />
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </>
                      ) : (
                        <View style={styles.noPhotoBox}>
                          <Feather name="image" size={36} color="#94A3B8" />
                          <Text style={styles.noPhotoText}>No image attachments provided</Text>
                        </View>
                      )}
                    </View>

                    {/* Right: Hazard Location Map */}
                    <View style={styles.mapColumn}>
                      <Text style={styles.subCardTitle}>Hazard Location Map</Text>
                      <DmcDistrictMap
                        districtName={selectedIncident.location?.address || 'Colombo'}
                        latitude={selectedIncident.location?.coordinates?.[1]}
                        longitude={selectedIncident.location?.coordinates?.[0]}
                        address={selectedIncident.location?.address || 'Colombo'}
                        height={280}
                        interactive={true}
                      />
                      <View style={styles.mapCaptionBox}>
                        <Feather name="info" size={14} color="#1E3A8A" style={{ marginRight: 6 }} />
                        <Text style={styles.mapCaptionText}>
                          Coordinates: {selectedIncident.location?.coordinates?.[1]?.toFixed(4)}° N,{' '}
                          {selectedIncident.location?.coordinates?.[0]?.toFixed(4)}° E
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Description Card */}
                  <View style={styles.infoCard}>
                    <Text style={styles.subCardTitle}>Situation Description</Text>
                    <Text style={styles.descriptionBodyText}>{selectedIncident.description}</Text>
                  </View>

                  {/* Verification Note Card */}
                  <View style={styles.infoCard}>
                    <Text style={styles.subCardTitle}>Duty Officer Verification Note</Text>
                    <Text style={styles.verificationNoteText}>
                      {selectedIncident.verificationNote ||
                        'Verified with local responders and Grama Niladhari. Roadway clearance dispatched.'}
                    </Text>
                  </View>
                </ScrollView>
              )}

              {/* ================= VIEW 3: CREATE HAZARD WARNING (Panel 4) ================= */}
              {activeNav === 'create_warning' && (
                <ScrollView contentContainerStyle={styles.viewContainer}>
                  {/* Header */}
                  <View style={styles.pageHeaderRow}>
                    <View>
                      <Text style={styles.pageTitle}>Create Hazard Warning</Text>
                      <Text style={styles.pageSubtitle}>
                        Use the verified report details to create and broadcast a warning
                      </Text>
                    </View>
                  </View>

                  {/* "Based on Verified Report" Card */}
                  {basedOnReport && (
                    <View style={styles.basedOnReportBanner}>
                      <Image
                        source={{
                          uri:
                            basedOnReport.mediaUrls?.[0]?.url ||
                            'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=300&q=80'
                        }}
                        style={styles.basedOnReportThumb}
                      />
                      <View style={{ flex: 1, paddingHorizontal: 12 }}>
                        <Text style={styles.basedOnLabel}>Based on Verified Report</Text>
                        <Text style={styles.basedOnTitle} numberOfLines={1}>
                          {basedOnReport.title}
                        </Text>
                        <Text style={styles.basedOnLocation}>
                          {basedOnReport.location?.address || 'Colombo'} •{' '}
                          {new Date(basedOnReport.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleReviewReport(basedOnReport)}
                        style={styles.basedOnViewBtn}
                      >
                        <Text style={styles.basedOnViewBtnText}>View Report</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Form & Map Grid */}
                  <View style={styles.createWarningGrid}>
                    {/* Left: Warning Form Fields */}
                    <View style={styles.createFormColumn}>
                      {/* Warning Title */}
                      <View style={styles.formGroup}>
                        <Text style={styles.fieldLabel}>Warning Title *</Text>
                        <TextInput
                          value={warningTitle}
                          onChangeText={setWarningTitle}
                          placeholder="e.g. Flooding Warning – Nugegoda Street"
                          style={styles.inputField}
                        />
                      </View>

                      {/* Hazard Type Selector */}
                      <View style={styles.formGroup}>
                        <Text style={styles.fieldLabel}>Hazard Type</Text>
                        <View style={styles.hazardTypePillsRow}>
                          {[
                            { id: 'flood', label: 'Flooding' },
                            { id: 'landslide', label: 'Landslide' },
                            { id: 'heavy_rain', label: 'Heavy Rain' },
                            { id: 'extreme_wind', label: 'Extreme Wind' },
                            { id: 'coastal_flood', label: 'Coastal Flood' }
                          ].map((item) => (
                            <TouchableOpacity
                              key={item.id}
                              onPress={() => setHazardType(item.id)}
                              style={[
                                styles.hazardSelectorPill,
                                hazardType === item.id && styles.hazardSelectorPillActive
                              ]}
                            >
                              <Text
                                style={[
                                  styles.hazardSelectorText,
                                  hazardType === item.id && styles.hazardSelectorTextActive
                                ]}
                              >
                                {item.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Severity Level Radios */}
                      <View style={styles.formGroup}>
                        <Text style={styles.fieldLabel}>Severity Level</Text>
                        <View style={styles.severitySelectorRow}>
                          {[
                            { id: 'critical', label: 'Critical', sub: 'Immediate impact', color: '#DC2626', bg: '#FEE2E2' },
                            { id: 'high', label: 'High', sub: 'Significant impact', color: '#D97706', bg: '#FEF3C7' },
                            { id: 'medium', label: 'Medium', sub: 'Moderate impact', color: '#0284C7', bg: '#E0F2FE' },
                            { id: 'low', label: 'Low', sub: 'Minimal impact', color: '#16A34A', bg: '#DCFCE7' }
                          ].map((sev) => {
                            const isSelected = severityLevel === sev.id;
                            return (
                              <TouchableOpacity
                                key={sev.id}
                                onPress={() => setSeverityLevel(sev.id)}
                                style={[
                                  styles.severityCardOption,
                                  isSelected && { borderColor: sev.color, backgroundColor: sev.bg }
                                ]}
                              >
                                <View style={[styles.sevRadioCircle, isSelected && { borderColor: sev.color }]}>
                                  {isSelected && <View style={[styles.sevRadioInner, { backgroundColor: sev.color }]} />}
                                </View>
                                <View>
                                  <Text style={[styles.sevOptionTitle, isSelected && { color: sev.color }]}>
                                    {sev.label}
                                  </Text>
                                  <Text style={styles.sevOptionSub}>{sev.sub}</Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Advisory Text / Message */}
                      <View style={styles.formGroup}>
                        <Text style={styles.fieldLabel}>Warning Advisory / Public Message</Text>
                        <TextInput
                          value={warningMessage}
                          onChangeText={setWarningMessage}
                          multiline
                          numberOfLines={3}
                          placeholder="Provide clear public safety guidance and instructions..."
                          style={[styles.inputField, { height: 75, textAlignVertical: 'top' }]}
                        />
                      </View>
                    </View>

                    {/* Right: District Selector & Visual Map */}
                    <View style={styles.createMapColumn}>
                      <View style={styles.formGroup}>
                        <Text style={styles.fieldLabel}>Affected District (Sri Lanka)</Text>
                        <View style={styles.districtPickerWrapper}>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.districtChipsScroll}>
                            {['Colombo', 'Gampaha', 'Kalutara', 'Nuwara Eliya', 'Galle', 'Kandy', 'Matara', 'Ratnapura'].map((dist) => (
                              <TouchableOpacity
                                key={dist}
                                onPress={() => setSelectedDistrict(dist)}
                                style={[
                                  styles.districtChip,
                                  selectedDistrict === dist && styles.districtChipActive
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.districtChipText,
                                    selectedDistrict === dist && styles.districtChipTextActive
                                  ]}
                                >
                                  {dist}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      </View>

                      {/* Interactive Visual Map Preview */}
                      <Text style={styles.fieldLabel}>District Alert Preview: {selectedDistrict}</Text>
                      <DmcDistrictMap
                        districtName={selectedDistrict}
                        height={240}
                        interactive={false}
                      />
                    </View>
                  </View>

                  {/* 3 Prominent Action Buttons with Explicit Explanatory Captions */}
                  <View style={styles.actionButtonsBox}>
                    <View style={styles.actionButtonsRow}>
                      {/* Button 1: Save as Draft */}
                      <View style={styles.buttonActionColumn}>
                        <TouchableOpacity
                          onPress={handleSaveAsDraft}
                          disabled={actionLoading}
                          style={styles.saveDraftBtn}
                          activeOpacity={0.85}
                        >
                          <Feather name="save" size={17} color="#475569" style={{ marginRight: 6 }} />
                          <Text style={styles.saveDraftBtnText}>Save as Draft</Text>
                        </TouchableOpacity>
                        <Text style={styles.buttonCaption}>
                          Save to draft warnings queue without publishing.
                        </Text>
                      </View>

                      {/* Button 2: 📢 Broadcast Warning */}
                      <View style={styles.buttonActionColumn}>
                        <TouchableOpacity
                          onPress={handleBroadcastWarning}
                          disabled={actionLoading}
                          style={styles.broadcastWarningBtn}
                          activeOpacity={0.88}
                        >
                          <Ionicons name="megaphone" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.broadcastWarningBtnText}>📢 Broadcast Warning</Text>
                        </TouchableOpacity>
                        <Text style={styles.buttonCaption}>
                          Send the warning to ALL citizens and volunteers in the selected district.
                        </Text>
                      </View>

                      {/* Button 3: ⚠️ Send Immediate Alert */}
                      <View style={styles.buttonActionColumn}>
                        <TouchableOpacity
                          onPress={handleSendImmediateAlert}
                          disabled={actionLoading}
                          style={styles.sendImmediateAlertBtn}
                          activeOpacity={0.88}
                        >
                          <Ionicons name="warning" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.sendImmediateAlertBtnText}>⚠️ Send Immediate Alert</Text>
                        </TouchableOpacity>
                        <Text style={[styles.buttonCaption, { color: '#B91C1C' }]}>
                          Trigger an emergency popup notification to citizens & volunteers in the selected area (auto-closing in 10s).
                        </Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              )}

              {/* ================= VIEW 4: ACTIVE WARNINGS (Panel 5) ================= */}
              {activeNav === 'active_warnings' && (
                <ScrollView contentContainerStyle={styles.viewContainer}>
                  <View style={styles.pageHeaderRow}>
                    <View>
                      <View style={styles.titleWithLiveBadgeRow}>
                        <Text style={styles.pageTitle}>Active Warnings</Text>
                        <View style={styles.liveGreenPill}>
                          <View style={styles.greenPulseDot} />
                          <Text style={styles.liveGreenPillText}>Live to Citizens & Volunteers</Text>
                        </View>
                      </View>
                      <Text style={styles.pageSubtitle}>
                        All currently broadcast warnings visible to citizens and volunteers
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        setBasedOnReport(null);
                        setActiveNav('create_warning');
                      }}
                      style={styles.headerPrimaryActionBtn}
                      activeOpacity={0.85}
                    >
                      <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.headerPrimaryActionBtnText}>New Warning</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Active Warnings Table */}
                  <View style={styles.tableCard}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.thCell, { flex: 0.5 }]}>#</Text>
                      <Text style={[styles.thCell, { flex: 2.5 }]}>Title</Text>
                      <Text style={[styles.thCell, { flex: 1.2 }]}>Type</Text>
                      <Text style={[styles.thCell, { flex: 1.2 }]}>Severity</Text>
                      <Text style={[styles.thCell, { flex: 1.5 }]}>Affected District</Text>
                      <Text style={[styles.thCell, { flex: 1 }]}>Status</Text>
                      <Text style={[styles.thCell, { flex: 1.8 }]}>Issued At</Text>
                      <Text style={[styles.thCell, { flex: 3.2, textAlign: 'center' }]}>Actions</Text>
                    </View>

                    {activeWarningsList.length === 0 ? (
                      <View style={styles.emptyTableState}>
                        <Ionicons name="checkmark-circle-outline" size={42} color="#10B981" />
                        <Text style={styles.emptyTableTitle}>No Active Warnings</Text>
                        <Text style={styles.emptyTableSub}>
                          All previous disaster alerts have been marked as completed.
                        </Text>
                      </View>
                    ) : (
                      activeWarningsList.map((warning, index) => {
                        const hazard = getHazardBadge(warning.disasterType);
                        const sev = getSeverityBadge(warning.severity);

                        return (
                          <View key={warning._id} style={styles.tableBodyRow}>
                            <Text style={[styles.tdCell, { flex: 0.5, fontWeight: '700' }]}>
                              {index + 1}
                            </Text>
                            <View style={[styles.tdCell, { flex: 2.5 }]}>
                              <Text style={styles.warningTableTitle}>{warning.title}</Text>
                              <Text style={styles.warningTableMessage} numberOfLines={1}>
                                {warning.message}
                              </Text>
                            </View>
                            <View style={[styles.tdCell, { flex: 1.2 }]}>
                              <View style={[styles.hazardPill, { backgroundColor: hazard.bg }]}>
                                <Text style={[styles.hazardPillText, { color: hazard.text }]}>
                                  {hazard.label}
                                </Text>
                              </View>
                            </View>
                            <View style={[styles.tdCell, { flex: 1.2 }]}>
                              <View style={[styles.severityPill, { backgroundColor: sev.bg }]}>
                                <Text style={[styles.severityPillText, { color: sev.text }]}>
                                  {sev.label}
                                </Text>
                              </View>
                            </View>
                            <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '600' }]}>
                              {warning.affectedDistrict || 'Colombo'}
                            </Text>
                            <View style={[styles.tdCell, { flex: 1 }]}>
                              <View style={styles.activeStatusPill}>
                                <Text style={styles.activeStatusText}>Active</Text>
                              </View>
                            </View>
                            <Text style={[styles.tdCell, { flex: 1.8, fontSize: 12, color: '#64748B' }]}>
                              {new Date(warning.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}{' '}
                              {new Date(warning.createdAt).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>

                            {/* Action Buttons: Broadcast, Immediate Alert, Mark as Complete */}
                            <View style={[styles.tdCell, styles.tableActionsRow, { flex: 3.2 }]}>
                              <TouchableOpacity
                                onPress={() => handleRebroadcast(warning)}
                                style={styles.tableActionBroadcastBtn}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.tableActionBroadcastText}>Broadcast</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleTriggerImmediateOnActive(warning)}
                                style={styles.tableActionImmediateBtn}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.tableActionImmediateText}>⚠️ Immediate Alert</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleMarkAsComplete(warning)}
                                style={styles.tableActionCompleteBtn}
                                activeOpacity={0.8}
                              >
                                <Feather name="check" size={13} color="#FFFFFF" style={{ marginRight: 3 }} />
                                <Text style={styles.tableActionCompleteText}>Complete</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>

                  {/* Explanatory Educational Card: "How Immediate Alert Appears to Citizens and Volunteers" */}
                  <View style={styles.immediateAlertGuideCard}>
                    <Text style={styles.guideCardTitle}>
                      ⚠️ How Immediate Alert Appears to Citizens and Volunteers
                    </Text>
                    <View style={styles.guideStepsRow}>
                      {/* Step 1 */}
                      <View style={styles.guideStepBox}>
                        <View style={styles.stepNumberBadge}>
                          <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={styles.stepTitle}>Citizen/Volunteer Login</Text>
                        <Text style={styles.stepDesc}>
                          Citizen or volunteer logs in or is actively navigating the mobile application.
                        </Text>
                      </View>

                      <Feather name="arrow-right" size={20} color="#94A3B8" style={{ marginTop: 28 }} />

                      {/* Step 2 */}
                      <View style={styles.guideStepBox}>
                        <View style={styles.stepNumberBadge}>
                          <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={styles.stepTitle}>Emergency Alert Popup</Text>
                        <Text style={styles.stepDesc}>
                          Red pulsing alert banner appears instantly with sound cue, hazard information, and "View on Map".
                        </Text>
                      </View>

                      <Feather name="arrow-right" size={20} color="#94A3B8" style={{ marginTop: 28 }} />

                      {/* Step 3 */}
                      <View style={styles.guideStepBox}>
                        <View style={styles.stepNumberBadge}>
                          <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={styles.stepTitle}>Auto-Dismisses in 10s</Text>
                        <Text style={styles.stepDesc}>
                          Automatically disappears in 10 seconds or immediately when the user taps "Mark as Seen".
                        </Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              )}

              {/* ================= VIEW 5: COMPLETED WARNINGS (Panel 6) ================= */}
              {activeNav === 'completed_warnings' && (
                <ScrollView contentContainerStyle={styles.viewContainer}>
                  <View style={styles.pageHeaderRow}>
                    <View>
                      <Text style={styles.pageTitle}>Completed Warnings</Text>
                      <Text style={styles.pageSubtitle}>
                        View all completed warnings and their impact analysis
                      </Text>
                    </View>
                  </View>

                  {/* Completed Warnings Table */}
                  <View style={styles.tableCard}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.thCell, { flex: 0.5 }]}>#</Text>
                      <Text style={[styles.thCell, { flex: 2.5 }]}>Title</Text>
                      <Text style={[styles.thCell, { flex: 1.2 }]}>Type</Text>
                      <Text style={[styles.thCell, { flex: 1.5 }]}>Affected District</Text>
                      <Text style={[styles.thCell, { flex: 1 }]}>Status</Text>
                      <Text style={[styles.thCell, { flex: 1.6 }]}>Issued At</Text>
                      <Text style={[styles.thCell, { flex: 1.6 }]}>Completed At</Text>
                      <Text style={[styles.thCell, { flex: 1.6, textAlign: 'center' }]}>Action</Text>
                    </View>

                    {completedWarningsList.map((warning, index) => {
                      const hazard = getHazardBadge(warning.disasterType);
                      const isSelected = selectedCompletedWarning?._id === warning._id;

                      return (
                        <TouchableOpacity
                          key={warning._id}
                          onPress={() => setSelectedCompletedWarning(warning)}
                          style={[styles.tableBodyRow, isSelected && styles.tableBodyRowSelected]}
                        >
                          <Text style={[styles.tdCell, { flex: 0.5, fontWeight: '700' }]}>
                            {index + 1}
                          </Text>
                          <View style={[styles.tdCell, { flex: 2.5 }]}>
                            <Text style={styles.warningTableTitle}>{warning.title}</Text>
                          </View>
                          <View style={[styles.tdCell, { flex: 1.2 }]}>
                            <View style={[styles.hazardPill, { backgroundColor: hazard.bg }]}>
                              <Text style={[styles.hazardPillText, { color: hazard.text }]}>
                                {hazard.label}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.tdCell, { flex: 1.5, fontWeight: '600' }]}>
                            {warning.affectedDistrict || 'Colombo'}
                          </Text>
                          <View style={[styles.tdCell, { flex: 1 }]}>
                            <View style={styles.completedStatusPill}>
                              <Text style={styles.completedStatusText}>Completed</Text>
                            </View>
                          </View>
                          <Text style={[styles.tdCell, { flex: 1.6, fontSize: 12, color: '#64748B' }]}>
                            {new Date(warning.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Text>
                          <Text style={[styles.tdCell, { flex: 1.6, fontSize: 12, color: '#64748B' }]}>
                            {warning.completedAt
                              ? new Date(warning.completedAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : '11 Oct 2024'}
                          </Text>
                          <View style={[styles.tdCell, { flex: 1.6, justifyContent: 'center' }]}>
                            <TouchableOpacity
                              onPress={() => handleGenerateReportModal(warning)}
                              style={styles.viewAnalysisBtn}
                            >
                              <Text style={styles.viewAnalysisBtnText}>Report</Text>
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Post-Event Analysis Card */}
                  {selectedCompletedWarning && (
                    <View style={styles.postEventAnalysisCard}>
                      <View style={styles.analysisHeaderRow}>
                        <View>
                          <Text style={styles.analysisCardTitle}>Post-Event Analysis</Text>
                          <Text style={styles.analysisCardSub}>
                            {selectedCompletedWarning.title} • {selectedCompletedWarning.affectedDistrict || 'Colombo'} District
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleGenerateReportModal(selectedCompletedWarning)}
                          style={styles.generateReportPrimaryBtn}
                        >
                          <Feather name="file-text" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.generateReportPrimaryBtnText}>Generate Report (PDF)</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Key Numerical Metrics Grid */}
                      <View style={styles.analysisMetricsGrid}>
                        <View style={styles.analysisMetricBox}>
                          <Text style={styles.metricVal}>
                            {selectedCompletedWarning.postEventAnalysis?.totalAlertsSent
                              ? selectedCompletedWarning.postEventAnalysis.totalAlertsSent.toLocaleString()
                              : '12,450'}
                          </Text>
                          <Text style={styles.metricTitle}>Total Alerts Sent</Text>
                        </View>

                        <View style={styles.analysisMetricBox}>
                          <Text style={[styles.metricVal, { color: '#2563EB' }]}>
                            {selectedCompletedWarning.postEventAnalysis?.peopleReached
                              ? selectedCompletedWarning.postEventAnalysis.peopleReached.toLocaleString()
                              : '432,850'}
                          </Text>
                          <Text style={styles.metricTitle}>People Reached</Text>
                        </View>

                        <View style={styles.analysisMetricBox}>
                          <Text style={[styles.metricVal, { color: '#059669' }]}>
                            {selectedCompletedWarning.postEventAnalysis?.reportsReceived || 326}
                          </Text>
                          <Text style={styles.metricTitle}>Reports Received</Text>
                        </View>

                        <View style={styles.analysisMetricBox}>
                          <Text style={[styles.metricVal, { color: '#D97706' }]}>0</Text>
                          <Text style={styles.metricTitle}>Fatalities / Loss of Life</Text>
                        </View>
                      </View>

                      {/* Qualitative Findings */}
                      <View style={styles.analysisFindingsBox}>
                        <View style={styles.findingRow}>
                          <Text style={styles.findingLabel}>Impact:</Text>
                          <Text style={styles.findingValue}>
                            {selectedCompletedWarning.postEventAnalysis?.impactSummary ||
                              'Several roads flooded, 2 houses affected, drainage systems overloaded.'}
                          </Text>
                        </View>
                        <View style={styles.findingRow}>
                          <Text style={styles.findingLabel}>Remarks:</Text>
                          <Text style={styles.findingValue}>
                            {selectedCompletedWarning.postEventAnalysis?.remarks ||
                              'Early warning system helped in local rescue efforts and rapid mobilization of responders.'}
                          </Text>
                        </View>
                      </View>

                      {/* Generated Reports Dropdown & Action */}
                      <View style={styles.generateReportFooterRow}>
                        <View style={styles.reportDropdownSelectBox}>
                          <Text style={styles.reportDropdownLabel}>Report Template:</Text>
                          <View style={styles.reportDropdownDisplay}>
                            <Text style={styles.reportDropdownText}>Event Reports (PDF)</Text>
                            <Feather name="chevron-down" size={15} color="#475569" />
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleGenerateReportModal(selectedCompletedWarning)}
                          style={styles.generateReportBtn}
                        >
                          <Feather name="download" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.generateReportBtnText}>Generate Report</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </ScrollView>
              )}

              {/* ================= VIEW 6: REPORTS ================= */}
              {activeNav === 'reports' && (
                <ScrollView contentContainerStyle={styles.viewContainer}>
                  <View style={styles.pageHeaderRow}>
                    <View>
                      <Text style={styles.pageTitle}>DMC Operations & Event Reports</Text>
                      <Text style={styles.pageSubtitle}>
                        Official situation bulletins, post-event audits, and downloadable PDF records
                      </Text>
                    </View>
                  </View>

                  <View style={styles.reportsCatalogueGrid}>
                    {completedWarningsList.map((item) => (
                      <View key={item._id} style={styles.reportCatalogueCard}>
                        <View style={styles.reportCardTop}>
                          <Feather name="file-text" size={28} color="#2563EB" />
                          <View style={styles.completedStatusPill}>
                            <Text style={styles.completedStatusText}>Official PDF</Text>
                          </View>
                        </View>
                        <Text style={styles.reportCardTitle}>{item.title}</Text>
                        <Text style={styles.reportCardDistrict}>
                          {item.affectedDistrict || 'Colombo'} District •{' '}
                          {new Date(item.createdAt).toLocaleDateString('en-GB')}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleGenerateReportModal(item)}
                          style={styles.catalogueDownloadBtn}
                        >
                          <Feather name="eye" size={15} color="#2563EB" style={{ marginRight: 6 }} />
                          <Text style={styles.catalogueDownloadText}>View & Download Report</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}

              {/* ================= VIEW 7: SETTINGS ================= */}
              {activeNav === 'settings' && (
                <ScrollView contentContainerStyle={styles.viewContainer}>
                  <View style={styles.pageHeaderRow}>
                    <View>
                      <Text style={styles.pageTitle}>Operational Settings</Text>
                      <Text style={styles.pageSubtitle}>
                        System broadcast parameters, siren triggers, and auto-dismiss thresholds
                      </Text>
                    </View>
                  </View>

                  <View style={styles.settingsCard}>
                    <Text style={styles.subCardTitle}>Emergency Alert Broadcast Configuration</Text>
                    <View style={styles.settingItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.settingItemTitle}>Immediate Alert Auto-Dismiss Timer</Text>
                        <Text style={styles.settingItemSub}>
                          Specifies how long the emergency popup persists before automatically closing
                        </Text>
                      </View>
                      <View style={styles.settingBadge}>
                        <Text style={styles.settingBadgeText}>10 Seconds (Fixed Policy)</Text>
                      </View>
                    </View>

                    <View style={styles.settingItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.settingItemTitle}>Target Audience Filter</Text>
                        <Text style={styles.settingItemSub}>
                          Broadcasts standard warnings to all citizens, immediate alerts restricted by district
                        </Text>
                      </View>
                      <View style={[styles.settingBadge, { backgroundColor: '#DCFCE7' }]}>
                        <Text style={[styles.settingBadgeText, { color: '#15803D' }]}>District Targeted</Text>
                      </View>
                    </View>

                    <View style={styles.settingItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.settingItemTitle}>Live Sync Channel</Text>
                        <Text style={styles.settingItemSub}>
                          Socket.IO push stream for instant removal upon marking events as completed
                        </Text>
                      </View>
                      <View style={[styles.settingBadge, { backgroundColor: '#EFF6FF' }]}>
                        <Text style={[styles.settingBadgeText, { color: '#1E40AF' }]}>Socket.IO Active</Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              )}

              {/* ================= VIEW: VERIFIED INCIDENTS FULL LIST ================= */}
              {activeNav === 'verified_incidents' && (
                <ScrollView contentContainerStyle={styles.viewContainer}>
                  <View style={styles.pageHeaderRow}>
                    <View>
                      <Text style={styles.pageTitle}>Verified Ground Incidents</Text>
                      <Text style={styles.pageSubtitle}>
                        Ground reports validated by Duty Officer ready for warning issuance
                      </Text>
                    </View>
                  </View>

                  <View style={styles.reportsGrid}>
                    {verifiedIncidents.map((report) => {
                      const hazard = getHazardBadge(report.disasterType);
                      const sev = getSeverityBadge(report.severity);
                      const photoUrl =
                        report.mediaUrls && report.mediaUrls.length > 0
                          ? report.mediaUrls[0].url
                          : 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80';

                      return (
                        <View key={report._id} style={styles.verifiedCard}>
                          <Image source={{ uri: photoUrl }} style={styles.verifiedCardImage} />
                          <View style={styles.verifiedCardBody}>
                            <View style={styles.badgeRow}>
                              <View style={[styles.hazardPill, { backgroundColor: hazard.bg }]}>
                                <Text style={[styles.hazardPillText, { color: hazard.text }]}>
                                  {hazard.label}
                                </Text>
                              </View>
                              <View style={[styles.severityPill, { backgroundColor: sev.bg }]}>
                                <Text style={[styles.severityPillText, { color: sev.text }]}>
                                  {sev.label}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.verifiedCardTitle} numberOfLines={1}>
                              {report.title}
                            </Text>

                            <View style={styles.verifiedCardMetaRow}>
                              <Feather name="map-pin" size={13} color="#64748B" />
                              <Text style={styles.verifiedCardMetaText} numberOfLines={1}>
                                {report.location?.address || 'Colombo'}
                              </Text>
                            </View>

                            <View style={styles.verifiedCardMetaRow}>
                              <Feather name="clock" size={13} color="#64748B" />
                              <Text style={styles.verifiedCardMetaText}>
                                {new Date(report.createdAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </Text>
                            </View>

                            <View style={styles.cardActionsRow}>
                              <TouchableOpacity
                                onPress={() => handleReviewReport(report)}
                                style={styles.reviewReportBtn}
                              >
                                <Text style={styles.reviewReportBtnText}>Review Report</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleStartCreateWarning(report)}
                                style={styles.createWarningBtn}
                              >
                                <Text style={styles.createWarningBtnText}>Create Warning</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </>
          )}
        </View>
      </View>

      {/* ================= OFFICIAL REPORT MODAL (PDF DOCUMENT) ================= */}
      {reportModalVisible && generatedReportData && (
        <Modal
          visible={reportModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setReportModalVisible(false)}
        >
          <View style={styles.reportModalOverlay}>
            <View style={styles.reportModalCard}>
              {/* Report Header */}
              <View style={styles.reportDocHeader}>
                <View style={styles.reportDocEmblemRow}>
                  <MaterialCommunityIcons name="shield-check" size={36} color="#1E3A8A" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.reportDocHeaderTitle}>
                      DISASTER MANAGEMENT CENTRE (DMC) SRI LANKA
                    </Text>
                    <Text style={styles.reportDocHeaderSub}>
                      NATIONAL EMERGENCY OPERATIONS CENTRE • POST-EVENT SITUATION REPORT
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setReportModalVisible(false)}
                  style={styles.reportCloseBtn}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.reportDocBody}>
                {/* Reference ID Bar */}
                <View style={styles.reportMetaGrid}>
                  <View style={styles.reportMetaCol}>
                    <Text style={styles.reportMetaSmallLabel}>REPORT REFERENCE</Text>
                    <Text style={styles.reportMetaBoldVal}>{generatedReportData.reportId}</Text>
                  </View>
                  <View style={styles.reportMetaCol}>
                    <Text style={styles.reportMetaSmallLabel}>AFFECTED DISTRICT</Text>
                    <Text style={styles.reportMetaBoldVal}>
                      {generatedReportData.affectedDistrict} District
                    </Text>
                  </View>
                  <View style={styles.reportMetaCol}>
                    <Text style={styles.reportMetaSmallLabel}>AUTHORIZING OFFICER</Text>
                    <Text style={styles.reportMetaBoldVal}>{generatedReportData.officer}</Text>
                  </View>
                  <View style={styles.reportMetaCol}>
                    <Text style={styles.reportMetaSmallLabel}>DISASTER TYPE</Text>
                    <Text style={styles.reportMetaBoldVal}>
                      {generatedReportData.disasterType?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Event Title */}
                <View style={styles.reportSectionBox}>
                  <Text style={styles.reportSectionHeading}>1. Disaster Event Summary</Text>
                  <Text style={styles.reportEventTitleText}>{generatedReportData.title}</Text>
                  <Text style={styles.reportParagraphText}>
                    This comprehensive post-event evaluation details the incident lifecycle, public
                    warning dissemination reach, and local mitigation efforts executed under the
                    mandate of DMC Sri Lanka.
                  </Text>
                </View>

                {/* Dissemination Statistics Table */}
                <View style={styles.reportSectionBox}>
                  <Text style={styles.reportSectionHeading}>2. Public Warning Dissemination Metrics</Text>
                  <View style={styles.reportStatTable}>
                    <View style={styles.reportStatTableRow}>
                      <Text style={styles.reportStatTableKey}>Total Alerts Dispatched:</Text>
                      <Text style={styles.reportStatTableVal}>
                        {generatedReportData.metrics.totalAlertsSent?.toLocaleString()} messages
                      </Text>
                    </View>
                    <View style={styles.reportStatTableRow}>
                      <Text style={styles.reportStatTableKey}>Estimated Population Reached:</Text>
                      <Text style={styles.reportStatTableVal}>
                        {generatedReportData.metrics.peopleReached?.toLocaleString()} citizens
                      </Text>
                    </View>
                    <View style={styles.reportStatTableRow}>
                      <Text style={styles.reportStatTableKey}>Community Ground Reports Verified:</Text>
                      <Text style={styles.reportStatTableVal}>
                        {generatedReportData.metrics.reportsReceived} verified reports
                      </Text>
                    </View>
                    <View style={styles.reportStatTableRow}>
                      <Text style={styles.reportStatTableKey}>Emergency Casualties / Fatalities:</Text>
                      <Text style={[styles.reportStatTableVal, { color: '#059669' }]}>
                        0 (Zero Loss of Life)
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Impact & Remarks */}
                <View style={styles.reportSectionBox}>
                  <Text style={styles.reportSectionHeading}>3. Impact Assessment & Operational Remarks</Text>
                  <Text style={styles.reportCalloutBold}>
                    Impact: {generatedReportData.metrics.impactSummary}
                  </Text>
                  <Text style={styles.reportCalloutItalic}>
                    Remarks: {generatedReportData.metrics.remarks}
                  </Text>
                </View>

                {/* Formal Seal & Signature */}
                <View style={styles.reportSignaturesRow}>
                  <View style={styles.signatureBox}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureNameText}>{generatedReportData.officer}</Text>
                    <Text style={styles.signatureRoleText}>DMC National Operations Officer</Text>
                  </View>

                  <View style={styles.officialSealBox}>
                    <View style={styles.sealCircle}>
                      <Text style={styles.sealText}>DMC SRI LANKA</Text>
                      <Text style={styles.sealSubText}>OFFICIAL SEAL</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Modal Footer Actions */}
              <View style={styles.reportModalFooter}>
                <TouchableOpacity
                  onPress={() => setReportModalVisible(false)}
                  style={styles.modalCancelBtn}
                >
                  <Text style={styles.modalCancelBtnText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      window.print();
                    } else {
                      Alert.alert('Download', 'Event report downloaded to device storage.');
                    }
                  }}
                  style={styles.modalDownloadPdfBtn}
                >
                  <Feather name="download" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.modalDownloadPdfBtnText}>Download PDF Document</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  topHeaderBar: {
    height: 64,
    backgroundColor: '#0E1F4D',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 100
  },
  headerLeftBrand: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  menuToggleBtn: {
    marginRight: 14,
    padding: 6
  },
  emblemBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  topBrandTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  topBrandSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500'
  },
  headerCenterMotto: {
    display: Platform.OS === 'web' ? 'flex' : 'none'
  },
  mottoText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  slstClockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)'
  },
  liveClockPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8
  },
  slstClockTime: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  slstClockDate: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600'
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  },
  officerProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 8
  },
  officerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  officerAvatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  officerInfoText: {
    display: Platform.OS === 'web' ? 'flex' : 'none'
  },
  officerName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  officerRoleText: {
    color: '#94A3B8',
    fontSize: 10
  },
  profileDropdown: {
    position: 'absolute',
    top: 52,
    right: 0,
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 20,
    zIndex: 1000
  },
  dropdownHeader: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  dropdownName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  dropdownEmail: {
    fontSize: 11,
    color: '#64748B'
  },
  dropdownRole: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 2
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600'
  },
  dropdownItemLogout: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 4
  },
  dropdownItemLogoutText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700'
  },
  mainWorkspace: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC'
  },
  sidebar: {
    width: 240,
    backgroundColor: '#0E1F4D',
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    justifyContent: 'space-between'
  },
  sidebarCollapsed: {
    width: 68
  },
  sidebarContent: {
    paddingVertical: 12,
    paddingHorizontal: 10
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4
  },
  navItemActive: {
    backgroundColor: '#1E3A8A'
  },
  navIcon: {
    marginRight: 12
  },
  navText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8'
  },
  navTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  navTextWithBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  navCounterBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10
  },
  navCounterText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  sidebarFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E293B'
  },
  systemStatusRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  greenOnlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginRight: 8
  },
  systemStatusText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500'
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  centerLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#475569',
    fontWeight: '600'
  },
  viewContainer: {
    padding: 24
  },
  pageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2
  },
  titleWithLiveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  liveGreenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
    marginRight: 6
  },
  liveGreenPillText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700'
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  refreshButtonText: {
    fontSize: 13,
    color: '#1E3A8A',
    fontWeight: '700'
  },
  statCardsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap'
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  statIconBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  statContent: {
    flex: 1
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 28
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B'
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  viewAllBtnText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700'
  },
  reportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  verifiedCard: {
    width: Platform.OS === 'web' ? '31.8%' : '100%',
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  verifiedCardImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#CBD5E1'
  },
  verifiedCardBody: {
    padding: 14
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  hazardPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  hazardPillText: {
    fontSize: 11,
    fontWeight: '800'
  },
  severityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  severityPillText: {
    fontSize: 11,
    fontWeight: '800'
  },
  verifiedCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6
  },
  verifiedCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6
  },
  verifiedCardMetaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    flex: 1
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  reviewReportBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  reviewReportBtnText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '700'
  },
  createWarningBtn: {
    flex: 1.2,
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  createWarningBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  backLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  backLinkText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
    marginLeft: 4
  },
  reportDetailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  dutyOfficerVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  dutyOfficerVerifiedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669'
  },
  detailReportTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6
  },
  headerPrimaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  headerPrimaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  reportMetaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  reportMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  reportMetaItemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600'
  },
  reportNumberPill: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  detailTwoColGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 18,
    marginBottom: 18
  },
  galleryColumn: {
    flex: 1.1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  subCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12
  },
  heroMainImage: {
    width: '100%',
    height: 230,
    borderRadius: 8,
    marginBottom: 10
  },
  thumbStrip: {
    flexDirection: 'row'
  },
  thumbItemBox: {
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  thumbItemBoxActive: {
    borderColor: '#2563EB'
  },
  thumbImage: {
    width: '100%',
    height: '100%'
  },
  noPhotoBox: {
    height: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noPhotoText: {
    marginTop: 8,
    fontSize: 12,
    color: '#94A3B8'
  },
  mapColumn: {
    flex: 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  mapCaptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 6
  },
  mapCaptionText: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '600'
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  descriptionBodyText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22
  },
  verificationNoteText: {
    fontSize: 13,
    color: '#059669',
    lineHeight: 20,
    fontStyle: 'italic'
  },
  basedOnReportBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  basedOnReportThumb: {
    width: 50,
    height: 50,
    borderRadius: 8
  },
  basedOnLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    textTransform: 'uppercase'
  },
  basedOnTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 1
  },
  basedOnLocation: {
    fontSize: 11,
    color: '#64748B'
  },
  basedOnViewBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  basedOnViewBtnText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700'
  },
  createWarningGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 20,
    marginBottom: 20
  },
  createFormColumn: {
    flex: 1.2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  createMapColumn: {
    flex: 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  formGroup: {
    marginBottom: 16
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC'
  },
  hazardTypePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  hazardSelectorPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  hazardSelectorPillActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A'
  },
  hazardSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  hazardSelectorTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  severitySelectorRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  severityCardOption: {
    flex: 1,
    minWidth: 110,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    gap: 8
  },
  sevRadioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sevRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  sevOptionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155'
  },
  sevOptionSub: {
    fontSize: 10,
    color: '#64748B'
  },
  districtChipsScroll: {
    flexDirection: 'row',
    marginBottom: 10
  },
  districtChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  districtChipActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626'
  },
  districtChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  districtChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  actionButtonsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20
  },
  actionButtonsRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16
  },
  buttonActionColumn: {
    flex: 1
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  saveDraftBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155'
  },
  broadcastWarningBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  broadcastWarningBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  sendImmediateAlertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  sendImmediateAlertBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  buttonCaption: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 15
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1'
  },
  thCell: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  tableBodyRowSelected: {
    backgroundColor: '#EFF6FF'
  },
  tdCell: {
    fontSize: 13,
    color: '#0F172A'
  },
  warningTableTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  warningTableMessage: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  activeStatusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D'
  },
  completedStatusPill: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  completedStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3730A3'
  },
  tableActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  tableActionBroadcastBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5
  },
  tableActionBroadcastText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  tableActionImmediateBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5
  },
  tableActionImmediateText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  tableActionCompleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5
  },
  tableActionCompleteText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  emptyTableState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTableTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
    marginTop: 10
  },
  emptyTableSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4
  },
  immediateAlertGuideCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FECDD3'
  },
  guideCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9F1239',
    marginBottom: 14
  },
  guideStepsRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12
  },
  guideStepBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE4E6'
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  stepDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16
  },
  postEventAnalysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20
  },
  analysisHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  analysisCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  analysisCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  generateReportPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  generateReportPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  analysisMetricsGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
    flexWrap: 'wrap'
  },
  analysisMetricBox: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A'
  },
  metricTitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2
  },
  analysisFindingsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16
  },
  findingRow: {
    marginBottom: 8
  },
  findingLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155'
  },
  findingValue: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 18
  },
  generateReportFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  reportDropdownSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  reportDropdownLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  reportDropdownDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6
  },
  reportDropdownText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600'
  },
  generateReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8
  },
  generateReportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  viewAnalysisBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center'
  },
  viewAnalysisBtnText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700'
  },
  reportsCatalogueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  reportCatalogueCard: {
    width: Platform.OS === 'web' ? '31.5%' : '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  reportCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  reportCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  reportCardDistrict: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 14
  },
  catalogueDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  catalogueDownloadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB'
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  settingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  settingItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  settingItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  settingBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  settingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  reportModalCard: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 25
  },
  reportDocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  reportDocEmblemRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reportDocHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5
  },
  reportDocHeaderSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2
  },
  reportCloseBtn: {
    padding: 4
  },
  reportDocBody: {
    padding: 24
  },
  reportMetaGrid: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 12
  },
  reportMetaCol: {
    flex: 1
  },
  reportMetaSmallLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B'
  },
  reportMetaBoldVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2
  },
  reportSectionBox: {
    marginBottom: 20
  },
  reportSectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5
  },
  reportEventTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6
  },
  reportParagraphText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18
  },
  reportStatTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  reportStatTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  reportStatTableKey: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600'
  },
  reportStatTableVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '800'
  },
  reportCalloutBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4
  },
  reportCalloutItalic: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#475569'
  },
  reportSignaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  signatureBox: {
    width: 200
  },
  signatureLine: {
    height: 1,
    backgroundColor: '#0F172A',
    marginBottom: 6
  },
  signatureNameText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A'
  },
  signatureRoleText: {
    fontSize: 10,
    color: '#64748B'
  },
  officialSealBox: {
    alignItems: 'center'
  },
  sealCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#DC2626',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-12deg' }]
  },
  sealText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#DC2626'
  },
  sealSubText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#DC2626'
  },
  reportModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#E2E8F0'
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  modalDownloadPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#2563EB'
  },
  modalDownloadPdfBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  }
});
