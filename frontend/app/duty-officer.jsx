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
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { incidentService } from '../services/incidentService';
import DutyOfficerMap from '../components/DutyOfficerMap';
import { getNearestSriLankanLocation } from '../services/geocodingService';

export default function DutyOfficerDesktopPortal() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'all_reports' | 'verified_reports' | 'rejected_reports'
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportsSubTab, setReportsSubTab] = useState('all'); // 'all' | 'pending' | 'verified' | 'rejected'

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Verification Form State
  const [actionType, setActionType] = useState('verify'); // 'verify' | 'reject'
  const [verificationNotes, setVerificationNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Profile Dropdown
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Live Sri Lanka Standard Time (Asia/Colombo, UTC+5:30)
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await incidentService.getIncidents({ limit: 100 });
      setIncidents(res.data || []);
    } catch (err) {
      console.warn('Failed loading incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await logout();
      } catch (e) {
      } finally {
        router.replace('/(auth)/login');
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Sign out of Duty Officer Portal?')) {
        await doLogout();
      }
    } else {
      Alert.alert('Sign Out', 'Do you wish to log out of Duty Officer Portal?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout }
      ]);
    }
  };

  // Status mapping & counts
  const pendingList = incidents.filter(
    (i) => i.status === 'under_review' || i.status === 'reported'
  );
  const verifiedList = incidents.filter(
    (i) => i.status === 'verified' || i.status === 'in_progress' || i.status === 'resolved'
  );
  const rejectedList = incidents.filter(
    (i) => i.status === 'rejected' || i.status === 'dismissed'
  );
  const totalCount = incidents.length;

  const selectedStatus = (selectedReport?.status || '').toLowerCase();
  const isSelectedVerified = selectedStatus === 'verified';
  const isSelectedRejected = selectedStatus === 'rejected' || selectedStatus === 'dismissed';
  const isSelectedReadOnly = isSelectedVerified || isSelectedRejected || ['in_progress', 'resolved'].includes(selectedStatus);

  const getTypeBadge = (type, customType) => {
    const t = (type || '').toLowerCase();
    if (t === 'flood') return { label: 'Flood', bg: '#EF4444', text: '#FFFFFF' };
    if (t === 'landslide' || t === 'land slide') return { label: 'Land Slide', bg: '#F59E0B', text: '#FFFFFF' };
    if (t === 'extreme_wind' || t === 'extreme wind' || t === 'cyclone' || t === 'wind') return { label: 'Extreme Wind', bg: '#0D9488', text: '#FFFFFF' };
    if (t === 'heavy_rain_lightning' || t === 'heavy rain with lightning' || t === 'heavy_rain_with_lightning') return { label: 'Rain & Lightning', bg: '#6366F1', text: '#FFFFFF' };
    if (customType) return { label: customType, bg: '#64748B', text: '#FFFFFF' };
    if (t === 'industrial') return { label: 'Industrial', bg: '#8B5CF6', text: '#FFFFFF' };
    if (t === 'fire') return { label: 'Wildfire', bg: '#DC2626', text: '#FFFFFF' };
    return { label: 'Other', bg: '#64748B', text: '#FFFFFF' };
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'verified' || s === 'in_progress' || s === 'resolved') {
      return { label: 'Verified', bg: '#DCFCE7', text: '#15803D' };
    }
    if (s === 'rejected' || s === 'dismissed') {
      return { label: 'Rejected', bg: '#FEE2E2', text: '#DC2626' };
    }
    return { label: 'Pending', bg: '#FEF3C7', text: '#D97706' };
  };

  const formatLocationDisplay = (loc) => {
    if (!loc) return 'Colombo';
    const addr = (loc.address || '').trim();
    const isRaw = !addr || addr.includes('°') || addr.includes(' N,') || /^[\d\s.,\-NSEW°]+$/i.test(addr);
    if (!isRaw) {
      return addr;
    }
    const lng = loc.coordinates?.[0];
    const lat = loc.coordinates?.[1];
    if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      return getNearestSriLankanLocation(lat, lng);
    }
    return addr || 'Colombo';
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Format live time in Sri Lanka Standard Time (Asia/Colombo, UTC+5:30)
  const getSriLankaLiveDateTime = () => {
    const d = currentDateTime;
    try {
      const datePart = d.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Colombo',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const timePart = d.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Colombo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      return {
        datePart,
        timePart,
        fullText: `Today ${datePart}, ${timePart}`
      };
    } catch (e) {
      // Precise fallback for environments without full named timezone support
      const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
      const slDate = new Date(utcMs + 5.5 * 3600000);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = String(slDate.getDate()).padStart(2, '0');
      const month = months[slDate.getMonth()];
      const year = slDate.getFullYear();
      let hours = slDate.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hStr = String(hours).padStart(2, '0');
      const mStr = String(slDate.getMinutes()).padStart(2, '0');
      const sStr = String(slDate.getSeconds()).padStart(2, '0');
      const datePart = `${day} ${month} ${year}`;
      const timePart = `${hStr}:${mStr}:${sStr} ${ampm}`;
      return {
        datePart,
        timePart,
        fullText: `Today ${datePart}, ${timePart}`
      };
    }
  };

  const liveSLTime = getSriLankaLiveDateTime();

  const formatDate = (dateStr) => {
    if (!dateStr) return liveSLTime.fullText;
    const d = new Date(dateStr);
    try {
      return (
        d.toLocaleDateString('en-GB', {
          timeZone: 'Asia/Colombo',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) +
        ', ' +
        d.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Colombo',
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    } catch (e) {
      return (
        d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) +
        ', ' +
        d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    }
  };

  const handleOpenReport = (report) => {
    setSelectedReport(report);
    setActivePhotoIndex(0);
    setActionType(report.status === 'rejected' ? 'reject' : 'verify');
    setVerificationNotes(report.verificationNote || report.rejectionNote || '');
  };

  const handleSubmitVerification = async () => {
    if (!selectedReport) return;

    // When a ground report is marked as verified or reject, duty officer cannot modify again
    const currentStatus = (selectedReport.status || '').toLowerCase();
    if (['verified', 'rejected', 'dismissed', 'in_progress', 'resolved'].includes(currentStatus)) {
      const msg = `This report has already been marked as ${currentStatus} and cannot be modified again.`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Action Disabled', msg);
      }
      return;
    }

    if (actionType === 'reject' && !verificationNotes.trim()) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Please enter a note explaining the reason for rejection.');
      } else {
        Alert.alert('Note Required', 'Please enter a note explaining the reason for rejection.');
      }
      return;
    }

    setSubmittingAction(true);
    try {
      const nextStatus = actionType === 'verify' ? 'verified' : 'rejected';
      await incidentService.updateIncidentStatus(selectedReport._id, {
        status: nextStatus,
        note: verificationNotes.trim(),
        verificationNote: actionType === 'verify' ? verificationNotes.trim() : undefined,
        rejectionNote: actionType === 'reject' ? verificationNotes.trim() : undefined,
        forwardedToDmc: actionType === 'verify'
      });

      const message =
        actionType === 'verify'
          ? `Report ${selectedReport.reportNumber || ''} marked as Verified and forwarded to DMC Officer.`
          : `Report ${selectedReport.reportNumber || ''} marked as Rejected.`;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(message);
      } else {
        Alert.alert('Status Updated', message);
      }

      // Update local item so it immediately enters locked read-only mode
      const updated = {
        ...selectedReport,
        status: nextStatus,
        verificationNote: actionType === 'verify' ? verificationNotes.trim() : selectedReport.verificationNote,
        rejectionNote: actionType === 'reject' ? verificationNotes.trim() : selectedReport.rejectionNote,
        forwardedToDmc: actionType === 'verify',
        forwardedAt: actionType === 'verify' ? new Date() : selectedReport.forwardedAt,
        verifiedAt: actionType === 'verify' ? new Date() : selectedReport.verifiedAt,
        verifiedBy: actionType === 'verify' ? { name: user?.name || 'Duty Officer', role: 'duty_officer' } : selectedReport.verifiedBy
      };
      setSelectedReport(updated);
      fetchIncidents();
    } catch (err) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Failed to update status: ' + (err.message || 'Error'));
      } else {
        Alert.alert('Error', err.message || 'Could not update status');
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filtered lists for "All Reports" view
  const getFilteredReports = () => {
    let list = incidents;
    if (activeTab === 'verified_reports' || reportsSubTab === 'verified') {
      list = verifiedList;
    } else if (activeTab === 'rejected_reports' || reportsSubTab === 'rejected') {
      list = rejectedList;
    } else if (reportsSubTab === 'pending') {
      list = pendingList;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.reportNumber && i.reportNumber.toLowerCase().includes(q)) ||
          (i.location?.address && i.location.address.toLowerCase().includes(q)) ||
          (i.reportedBy?.name && i.reportedBy.name.toLowerCase().includes(q)) ||
          (i.disasterType && i.disasterType.toLowerCase().includes(q)) ||
          (i.customDisasterType && i.customDisasterType.toLowerCase().includes(q))
      );
    }

    if (typeFilter !== 'all') {
      list = list.filter((i) => {
        const dt = (i.disasterType || '').toLowerCase();
        if (typeFilter === 'landslide') return dt === 'landslide' || dt === 'land slide';
        if (typeFilter === 'extreme_wind') return dt === 'extreme_wind' || dt === 'extreme wind' || dt === 'cyclone' || dt === 'wind';
        if (typeFilter === 'heavy_rain_lightning') return dt === 'heavy_rain_lightning' || dt === 'heavy rain with lightning' || dt === 'heavy_rain_with_lightning';
        if (typeFilter === 'other') return dt === 'other' || Boolean(i.customDisasterType);
        return dt === typeFilter.toLowerCase();
      });
    }

    return list;
  };

  return (
    <View style={styles.desktopContainer}>
      {/* Top Header Navigation Bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={styles.hamburgerBtn}
          >
            <Feather name="menu" size={22} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.brandRow}>
            <View style={styles.emblemBadge}>
              <MaterialCommunityIcons name="shield-alert-outline" size={22} color="#C81E1E" />
            </View>
            <View>
              <Text style={styles.brandTitle}>DMC SRI LANKA</Text>
              <Text style={styles.brandSubtitle}>Disaster Management System</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Notification Bell */}
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={20} color="#0F172A" />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>1</Text>
            </View>
          </TouchableOpacity>

          {/* User Profile Dropdown Pill */}
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              onPress={() => setShowProfileMenu(!showProfileMenu)}
              activeOpacity={0.8}
              style={styles.userProfilePill}
            >
              <View style={styles.avatarCircle}>
                <Feather name="user" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.userNameText}>Duty Officer</Text>
              <Feather name="chevron-down" size={15} color="#64748B" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            {showProfileMenu && (
              <View style={styles.profileDropdown}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownName}>{user?.name || 'Duty Officer Kamal Perera'}</Text>
                  <Text style={styles.dropdownEmail}>{user?.email || 'dutyofficer@dmc.gov.lk'}</Text>
                  <Text style={styles.dropdownRole}>DMC National Operations Centre</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                  style={styles.dropdownLogoutBtn}
                >
                  <Feather name="log-out" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                  <Text style={styles.dropdownLogoutText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Main Body with Sidebar + Content */}
      <View style={styles.bodyRow}>
        {/* Left Sidebar */}
        <View style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('dashboard');
              setSelectedReport(null);
            }}
            style={[
              styles.navItem,
              activeTab === 'dashboard' && !selectedReport && styles.navItemActive
            ]}
          >
            <Ionicons
              name="home-outline"
              size={18}
              color={activeTab === 'dashboard' && !selectedReport ? '#FFFFFF' : '#94A3B8'}
              style={{ marginRight: 12 }}
            />
            {!sidebarCollapsed && (
              <Text
                style={[
                  styles.navItemText,
                  activeTab === 'dashboard' && !selectedReport && styles.navItemTextActive
                ]}
              >
                Dashboard
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab('all_reports');
              setReportsSubTab('all');
              setSelectedReport(null);
            }}
            style={[
              styles.navItem,
              (activeTab === 'all_reports' || activeTab === 'verified_reports' || activeTab === 'rejected_reports') &&
                !selectedReport &&
                styles.navItemActive
            ]}
          >
            <Ionicons
              name="document-text-outline"
              size={18}
              color={
                (activeTab === 'all_reports' || activeTab === 'verified_reports' || activeTab === 'rejected_reports') &&
                !selectedReport
                  ? '#FFFFFF'
                  : '#94A3B8'
              }
              style={{ marginRight: 12 }}
            />
            {!sidebarCollapsed && (
              <Text
                style={[
                  styles.navItemText,
                  (activeTab === 'all_reports' || activeTab === 'verified_reports' || activeTab === 'rejected_reports') &&
                    !selectedReport &&
                    styles.navItemTextActive
                ]}
              >
                All Reports
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab('all_reports');
              setReportsSubTab('verified');
              setSelectedReport(null);
            }}
            style={[styles.navItem, reportsSubTab === 'verified' && !selectedReport && styles.navItemActive]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={reportsSubTab === 'verified' && !selectedReport ? '#FFFFFF' : '#94A3B8'}
              style={{ marginRight: 12 }}
            />
            {!sidebarCollapsed && (
              <Text
                style={[
                  styles.navItemText,
                  reportsSubTab === 'verified' && !selectedReport && styles.navItemTextActive
                ]}
              >
                Verified Reports
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab('all_reports');
              setReportsSubTab('rejected');
              setSelectedReport(null);
            }}
            style={[styles.navItem, reportsSubTab === 'rejected' && !selectedReport && styles.navItemActive]}
          >
            <Ionicons
              name="close-circle-outline"
              size={18}
              color={reportsSubTab === 'rejected' && !selectedReport ? '#FFFFFF' : '#94A3B8'}
              style={{ marginRight: 12 }}
            />
            {!sidebarCollapsed && (
              <Text
                style={[
                  styles.navItemText,
                  reportsSubTab === 'rejected' && !selectedReport && styles.navItemTextActive
                ]}
              >
                Rejected Reports
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        <ScrollView contentContainerStyle={styles.mainContent} keyboardShouldPersistTaps="handled">
          {loading && incidents.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#C81E1E" />
              <Text style={{ marginTop: 12, color: '#64748B' }}>Loading ground reports...</Text>
            </View>
          ) : selectedReport ? (
            /* ========================================================
               VIEW: REPORT DETAILS (Panel 3 & 4)
            ======================================================== */
            <View style={styles.detailsContainer}>
              {/* Back Navigation & Map View Button */}
              <View style={styles.detailsHeaderRow}>
                <TouchableOpacity
                  onPress={() => setSelectedReport(null)}
                  style={styles.backButtonRow}
                >
                  <Feather name="arrow-left" size={20} color="#0F172A" style={{ marginRight: 6 }} />
                  <Text style={styles.backButtonText}>Report Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const lat = selectedReport.location?.coordinates?.[1] || 6.9452;
                    const lng = selectedReport.location?.coordinates?.[0] || 79.8821;
                    if (Platform.OS === 'web' && typeof window !== 'undefined') {
                      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                    }
                  }}
                  style={styles.viewInMapBtn}
                >
                  <Ionicons name="map-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.viewInMapBtnText}>View in Map</Text>
                </TouchableOpacity>
              </View>

              {/* Status Header Indicator */}
              {selectedReport.status === 'verified' && (
                <View style={styles.verifiedNoticeBanner}>
                  <Ionicons name="shield-checkmark" size={20} color="#15803D" style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.verifiedNoticeTitle}>Report Verified & Forwarded to DMC Officer</Text>
                    {selectedReport.verificationNote ? (
                      <Text style={styles.verifiedNoticeDesc}>Note: {selectedReport.verificationNote}</Text>
                    ) : null}
                  </View>
                  <View style={styles.lockedHeaderTagVerified}>
                    <Feather name="lock" size={11} color="#15803D" style={{ marginRight: 4 }} />
                    <Text style={styles.lockedHeaderTagTextVerified}>Verified • Read Only</Text>
                  </View>
                </View>
              )}

              {(selectedReport.status === 'rejected' || selectedReport.status === 'dismissed') && (
                <View style={styles.rejectedNoticeBanner}>
                  <Ionicons name="close-circle" size={20} color="#DC2626" style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rejectedNoticeTitle}>Report Rejected</Text>
                    {selectedReport.rejectionNote ? (
                      <Text style={styles.rejectedNoticeDesc}>Reason: {selectedReport.rejectionNote}</Text>
                    ) : null}
                  </View>
                  <View style={styles.lockedHeaderTagRejected}>
                    <Feather name="lock" size={11} color="#DC2626" style={{ marginRight: 4 }} />
                    <Text style={styles.lockedHeaderTagTextRejected}>Rejected • Read Only</Text>
                  </View>
                </View>
              )}

              {/* Two Column Layout on Desktop */}
              <View style={styles.detailsSplitGrid}>
                {/* Left Column: Photos, Hazard Info, Map, Reporter */}
                <View style={styles.detailsLeftCol}>
                  {/* Meta Tag Row */}
                  <View style={styles.metaTagsRow}>
                    <View
                      style={[
                        styles.disasterTypeBadge,
                        { backgroundColor: getTypeBadge(selectedReport.disasterType, selectedReport.customDisasterType).bg }
                      ]}
                    >
                      <Text style={styles.disasterTypeBadgeText}>
                        {getTypeBadge(selectedReport.disasterType, selectedReport.customDisasterType).label}
                      </Text>
                    </View>
                    <Text style={styles.reportIdText}>
                      Report ID: {selectedReport.reportNumber || `#DR-${selectedReport._id.slice(-8)}`}
                    </Text>
                    <Text style={styles.submittedDateText}>
                      Submitted: {formatDate(selectedReport.createdAt)}
                    </Text>
                  </View>

                  {/* Title & Location */}
                  <Text style={styles.detailsTitle}>{selectedReport.title || 'Ground Hazard Report'}</Text>
                  <View style={styles.detailsLocationRow}>
                    <Ionicons name="location-sharp" size={16} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.detailsLocationText}>
                      {formatLocationDisplay(selectedReport.location)} &gt;
                    </Text>
                  </View>

                  {/* Description */}
                  <Text style={styles.detailsDescription}>{selectedReport.description}</Text>

                  {/* Photo Gallery */}
                  <View style={styles.photoGalleryCard}>
                    <Text style={styles.cardSectionTitle}>Uploaded Photos</Text>
                    {selectedReport.mediaUrls && selectedReport.mediaUrls.length > 0 ? (
                      <View>
                        {/* Big preview */}
                        <Image
                          source={{
                            uri:
                              selectedReport.mediaUrls[activePhotoIndex]?.url ||
                              selectedReport.mediaUrls[0]?.url
                          }}
                          style={styles.mainPhotoPreview}
                          resizeMode="cover"
                        />

                        {/* Thumbnails strip */}
                        <View style={styles.thumbnailsStrip}>
                          {selectedReport.mediaUrls.map((m, idx) => (
                            <TouchableOpacity
                              key={idx}
                              onPress={() => setActivePhotoIndex(idx)}
                              style={[
                                styles.thumbWrapper,
                                activePhotoIndex === idx && styles.thumbWrapperActive
                              ]}
                            >
                              <Image source={{ uri: m.url }} style={styles.thumbImage} />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <View style={styles.noPhotoPlaceholder}>
                        <Ionicons name="image-outline" size={32} color="#94A3B8" />
                        <Text style={{ color: '#94A3B8', marginTop: 6, fontSize: 13 }}>No photos uploaded for this report</Text>
                      </View>
                    )}
                  </View>

                  {/* Hazard Location Map View */}
                  <View style={styles.locationMapCard}>
                    <Text style={styles.cardSectionTitle}>Hazard Location Map</Text>
                    <DutyOfficerMap
                      latitude={selectedReport.location?.coordinates?.[1] || 6.9452}
                      longitude={selectedReport.location?.coordinates?.[0] || 79.8821}
                      address={formatLocationDisplay(selectedReport.location)}
                      height={240}
                    />
                    <View style={styles.mapFootnoteRow}>
                      <Ionicons name="pin" size={14} color="#DC2626" style={{ marginRight: 4 }} />
                      <Text style={styles.mapFootnoteText}>
                        GPS: {(selectedReport.location?.coordinates?.[1] || 6.9452).toFixed(4)}° N,{' '}
                        {(selectedReport.location?.coordinates?.[0] || 79.8821).toFixed(4)}° E
                      </Text>
                    </View>
                  </View>

                  {/* Reporter Information Card */}
                  <View style={styles.reporterInfoCard}>
                    <Text style={styles.cardSectionTitle}>Reporter Information</Text>
                    <View style={styles.reporterContentRow}>
                      <View style={styles.reporterAvatarCircle}>
                        <Feather name="user" size={24} color="#1E3A8A" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reporterNameText}>
                          {selectedReport.reportedBy?.name || 'John Perera'}
                        </Text>
                        <Text style={styles.reporterRoleText}>
                          {selectedReport.reportedBy?.role === 'volunteer'
                            ? 'Community Volunteer'
                            : 'Citizen'}
                        </Text>
                        <View style={styles.reporterContactRow}>
                          <Feather name="mail" size={13} color="#64748B" style={{ marginRight: 6 }} />
                          <Text style={styles.reporterContactText}>
                            {selectedReport.reportedBy?.email || 'john@example.com'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Right Column: Verification Action or Locked Summary Card */}
                <View style={styles.detailsRightCol}>
                  {isSelectedReadOnly ? (
                    <View style={styles.lockedVerificationCard}>
                      <View style={styles.lockedCardHeader}>
                        <Text style={styles.verificationCardTitle}>Verification Record</Text>
                        <View style={styles.lockedStatusBadge}>
                          <Feather name="lock" size={12} color="#475569" style={{ marginRight: 4 }} />
                          <Text style={styles.lockedStatusBadgeText}>Read Only</Text>
                        </View>
                      </View>

                      {/* Status Outcome Banner */}
                      <View
                        style={[
                          styles.lockedOutcomeBox,
                          isSelectedVerified
                            ? styles.lockedOutcomeBoxVerified
                            : styles.lockedOutcomeBoxRejected
                        ]}
                      >
                        <View style={styles.lockedOutcomeTopRow}>
                          <Ionicons
                            name={isSelectedVerified ? 'shield-checkmark' : 'close-circle'}
                            size={22}
                            color={isSelectedVerified ? '#15803D' : '#DC2626'}
                            style={{ marginRight: 10, marginTop: 1 }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.lockedOutcomeTitle,
                                { color: isSelectedVerified ? '#15803D' : '#DC2626' }
                              ]}
                            >
                              {isSelectedVerified ? 'Verified & Forwarded' : 'Report Rejected'}
                            </Text>
                            <Text style={styles.lockedOutcomeSubtext}>
                              {isSelectedVerified
                                ? 'Report verified by Duty Officer and forwarded to DMC for response.'
                                : 'Report was rejected as invalid, duplicate, or not an emergency.'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Details Key-Value List */}
                      <View style={styles.lockedDetailsList}>
                        <View style={styles.lockedDetailRow}>
                          <Text style={styles.lockedDetailLabel}>Current Status</Text>
                          <View
                            style={[
                              styles.lockedPill,
                              { backgroundColor: isSelectedVerified ? '#DCFCE7' : '#FEE2E2' }
                            ]}
                          >
                            <Text
                              style={[
                                styles.lockedPillText,
                                { color: isSelectedVerified ? '#15803D' : '#B91C1C' }
                              ]}
                            >
                              {isSelectedVerified ? 'Verified' : 'Rejected'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.lockedDetailRow}>
                          <Text style={styles.lockedDetailLabel}>Forwarded to DMC</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons
                              name={isSelectedVerified ? 'checkmark-circle' : 'close-circle'}
                              size={14}
                              color={isSelectedVerified ? '#15803D' : '#94A3B8'}
                              style={{ marginRight: 4 }}
                            />
                            <Text
                              style={[
                                styles.lockedDetailValueBold,
                                { color: isSelectedVerified ? '#15803D' : '#64748B' }
                              ]}
                            >
                              {isSelectedVerified ? 'Yes (Forwarded)' : 'No'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.lockedDetailRow}>
                          <Text style={styles.lockedDetailLabel}>Reviewed By</Text>
                          <Text style={styles.lockedDetailValueBold}>
                            {selectedReport.verifiedBy?.name || user?.name || 'Duty Officer'}
                          </Text>
                        </View>

                        <View style={styles.lockedDetailRow}>
                          <Text style={styles.lockedDetailLabel}>Decision Date</Text>
                          <Text style={styles.lockedDetailValue}>
                            {formatDate(selectedReport.verifiedAt || selectedReport.updatedAt || selectedReport.createdAt)}
                          </Text>
                        </View>
                      </View>

                      {/* Recorded Notes Bubble */}
                      <View style={styles.lockedNotesContainer}>
                        <Text style={styles.lockedNotesLabel}>
                          {isSelectedVerified ? 'Officer Verification Note' : 'Rejection Reason Note'}
                        </Text>
                        <View style={styles.lockedNotesBubble}>
                          <Feather name="file-text" size={14} color="#64748B" style={{ marginTop: 2, marginRight: 8 }} />
                          <Text style={styles.lockedNotesText}>
                            {selectedReport.verificationNote ||
                              selectedReport.rejectionNote ||
                              'No additional notes were recorded for this decision.'}
                          </Text>
                        </View>
                      </View>

                      {/* Read-Only Notice */}
                      <View style={styles.lockedInfoNotice}>
                        <Feather name="info" size={13} color="#64748B" style={{ marginRight: 6 }} />
                        <Text style={styles.lockedInfoNoticeText}>
                          This report has been finalized and cannot be modified again.
                        </Text>
                      </View>

                      {/* Navigation Button */}
                      <TouchableOpacity
                        onPress={() => setSelectedReport(null)}
                        style={styles.lockedDoneBtn}
                        activeOpacity={0.8}
                      >
                        <Feather name="arrow-left" size={14} color="#475569" style={{ marginRight: 6 }} />
                        <Text style={styles.lockedDoneBtnText}>Back to Reports</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.verificationCard}>
                      <Text style={styles.verificationCardTitle}>Verification Action</Text>

                      {/* Radio 1: Verify Report */}
                      <TouchableOpacity
                        onPress={() => setActionType('verify')}
                        activeOpacity={0.85}
                        style={[
                          styles.actionRadioBox,
                          actionType === 'verify' && styles.actionRadioBoxSelectedVerify
                        ]}
                      >
                        <View style={styles.radioTopRow}>
                          <View
                            style={[
                              styles.radioCircle,
                              actionType === 'verify' && styles.radioCircleActiveGreen
                            ]}
                          >
                            {actionType === 'verify' && <View style={styles.radioDotGreen} />}
                          </View>
                          <Text style={styles.radioOptionTitle}>Verify Report</Text>
                        </View>
                        <Text style={styles.radioOptionSubtext}>
                          Mark this report as verified and forward to DMC Officer for further action.
                        </Text>
                      </TouchableOpacity>

                      {/* Radio 2: Reject Report */}
                      <TouchableOpacity
                        onPress={() => setActionType('reject')}
                        activeOpacity={0.85}
                        style={[
                          styles.actionRadioBox,
                          actionType === 'reject' && styles.actionRadioBoxSelectedReject
                        ]}
                      >
                        <View style={styles.radioTopRow}>
                          <View
                            style={[
                              styles.radioCircle,
                              actionType === 'reject' && styles.radioCircleActiveRed
                            ]}
                          >
                            {actionType === 'reject' && <View style={styles.radioDotRed} />}
                          </View>
                          <Text style={styles.radioOptionTitle}>Reject Report</Text>
                        </View>
                        <Text style={styles.radioOptionSubtext}>
                          Reject this report if it is invalid, duplicate or not a disaster incident.
                        </Text>
                      </TouchableOpacity>

                      {/* Notes Textarea */}
                      <View style={styles.notesGroup}>
                        <Text style={styles.notesLabel}>Verification / Rejection Notes</Text>
                        <TextInput
                          value={verificationNotes}
                          onChangeText={(txt) => {
                            if (txt.length <= 500) setVerificationNotes(txt);
                          }}
                          multiline
                          numberOfLines={5}
                          placeholder="Add notes here (e.g. reason for verification or rejection)..."
                          placeholderTextColor="#94A3B8"
                          style={styles.notesInput}
                        />
                        <Text style={styles.notesCharCounter}>{verificationNotes.length} / 500</Text>
                      </View>

                      {/* Submit & Cancel Buttons */}
                      <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                          onPress={() => setSelectedReport(null)}
                          style={styles.cancelActionBtn}
                        >
                          <Text style={styles.cancelActionBtnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleSubmitVerification}
                          disabled={submittingAction}
                          style={styles.submitActionBtn}
                        >
                          {submittingAction ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.submitActionBtnText}>Submit</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ) : activeTab === 'dashboard' ? (
            /* ========================================================
               VIEW: DASHBOARD (Panel 1 & 2)
            ======================================================== */
            <View style={styles.dashboardContainer}>
              {/* Header Row */}
              <View style={styles.pageHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>Pending Ground Reports</Text>
                  <Text style={styles.pageSubtitle}>
                    Review community reports and verify valid incidents to forward to DMC Officer.
                  </Text>
                </View>
                <View style={styles.todayPill}>
                  <View style={styles.livePulseDot} />
                  <Feather name="calendar" size={14} color="#64748B" style={{ marginRight: 6 }} />
                  <Text style={styles.todayPillText}>{liveSLTime.fullText}</Text>
                  <View style={styles.slstBadge}>
                    <Text style={styles.slstBadgeText}>SLST</Text>
                  </View>
                </View>
              </View>

              {/* 4 Stat Cards */}
              <View style={styles.statsCardsRow}>
                {/* 1. Pending Reports */}
                <TouchableOpacity
                  onPress={() => {
                    setActiveTab('all_reports');
                    setReportsSubTab('pending');
                  }}
                  activeOpacity={0.88}
                  style={[styles.statCard, { borderColor: '#FEE2E2' }]}
                >
                  <View style={[styles.statIconBox, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="warning" size={20} color="#DC2626" />
                  </View>
                  <View>
                    <Text style={[styles.statNumber, { color: '#DC2626' }]}>{pendingList.length}</Text>
                    <Text style={styles.statLabel}>Pending Reports</Text>
                  </View>
                </TouchableOpacity>

                {/* 2. Verified Reports */}
                <TouchableOpacity
                  onPress={() => {
                    setActiveTab('all_reports');
                    setReportsSubTab('verified');
                  }}
                  activeOpacity={0.88}
                  style={[styles.statCard, { borderColor: '#DBEAFE' }]}
                >
                  <View style={[styles.statIconBox, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={[styles.statNumber, { color: '#2563EB' }]}>{verifiedList.length}</Text>
                    <Text style={styles.statLabel}>Verified Reports</Text>
                  </View>
                </TouchableOpacity>

                {/* 3. Rejected Reports */}
                <TouchableOpacity
                  onPress={() => {
                    setActiveTab('all_reports');
                    setReportsSubTab('rejected');
                  }}
                  activeOpacity={0.88}
                  style={[styles.statCard, { borderColor: '#FEF3C7' }]}
                >
                  <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="close-circle" size={20} color="#D97706" />
                  </View>
                  <View>
                    <Text style={[styles.statNumber, { color: '#D97706' }]}>{rejectedList.length}</Text>
                    <Text style={styles.statLabel}>Rejected Reports</Text>
                  </View>
                </TouchableOpacity>

                {/* 4. Total Reports */}
                <TouchableOpacity
                  onPress={() => {
                    setActiveTab('all_reports');
                    setReportsSubTab('all');
                  }}
                  activeOpacity={0.88}
                  style={[styles.statCard, { borderColor: '#E2E8F0' }]}
                >
                  <View style={[styles.statIconBox, { backgroundColor: '#F1F5F9' }]}>
                    <Ionicons name="documents" size={20} color="#475569" />
                  </View>
                  <View>
                    <Text style={[styles.statNumber, { color: '#0F172A' }]}>{totalCount}</Text>
                    <Text style={styles.statLabel}>Total Reports</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Search & Filter Bar */}
              <View style={styles.searchBarRow}>
                <View style={styles.searchBox}>
                  <Feather name="search" size={17} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search reports (title, location, etc.)..."
                    placeholderTextColor="#94A3B8"
                    style={styles.searchInput}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Disaster Type Filter Pills */}
                <View style={styles.filterPillsRow}>
                  {['all', 'flood', 'landslide', 'extreme_wind', 'heavy_rain_lightning', 'other'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setTypeFilter(type)}
                      style={[styles.filterPill, typeFilter === type && styles.filterPillActive]}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          typeFilter === type && styles.filterPillTextActive
                        ]}
                      >
                        {type === 'all'
                          ? 'All Hazards'
                          : type === 'flood'
                          ? 'Flood'
                          : type === 'landslide'
                          ? 'Land Slide'
                          : type === 'extreme_wind'
                          ? 'Extreme Wind'
                          : type === 'heavy_rain_lightning'
                          ? 'Rain & Lightning'
                          : 'Other'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Pending Ground Reports - Card View Grid (Mockup Panel 2) */}
              <View style={{ marginBottom: 28 }}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionHeading}>Pending Ground Reports ({pendingList.length})</Text>
                </View>

                {pendingList.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="checkmark-done-circle" size={42} color="#10B981" />
                    <Text style={styles.emptyTitle}>All Caught Up!</Text>
                    <Text style={styles.emptySubtitle}>There are currently no pending ground reports requiring review.</Text>
                  </View>
                ) : (
                  <View style={styles.cardsGrid}>
                    {pendingList.map((report) => {
                      const typeBadge = getTypeBadge(report.disasterType, report.customDisasterType);
                      const timeStr = getTimeAgo(report.createdAt);
                      const photoUrl =
                        report.mediaUrls?.[0]?.url ||
                        'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80';

                      return (
                        <TouchableOpacity
                          key={report._id}
                          onPress={() => handleOpenReport(report)}
                          activeOpacity={0.9}
                          style={styles.reportGridCard}
                        >
                          {/* Image with badges */}
                          <View style={styles.cardImageWrapper}>
                            <Image source={{ uri: photoUrl }} style={styles.cardImage} />
                            <View
                              style={[
                                styles.cardDisasterBadge,
                                { backgroundColor: typeBadge.bg }
                              ]}
                            >
                              <Text style={styles.cardDisasterBadgeText}>{typeBadge.label}</Text>
                            </View>
                            <View style={styles.cardTimeBadge}>
                              <Text style={styles.cardTimeBadgeText}>{timeStr}</Text>
                            </View>
                          </View>

                          {/* Body */}
                          <View style={styles.cardBody}>
                            <Text style={styles.cardTitle} numberOfLines={1}>
                              {report.title || 'Ground Hazard Report'}
                            </Text>
                            <View style={styles.cardLocationRow}>
                              <Ionicons name="location-sharp" size={13} color="#64748B" style={{ marginRight: 3 }} />
                              <Text style={styles.cardLocationText} numberOfLines={1}>
                                {formatLocationDisplay(report.location)}
                              </Text>
                              <Feather name="chevron-right" size={13} color="#94A3B8" />
                            </View>
                            <Text style={styles.cardSnippet} numberOfLines={2}>
                              {report.description}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Recent Reports - Table View (Mockup Panel 1) */}
              <View style={styles.tableCardContainer}>
                <View style={styles.tableCardHeader}>
                  <Text style={styles.sectionHeading}>Recent Reports</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setActiveTab('all_reports');
                      setReportsSubTab('all');
                    }}
                  >
                    <Text style={styles.viewAllLink}>View All</Text>
                  </TouchableOpacity>
                </View>

                {/* Table Header */}
                <View style={styles.tableRowHeader}>
                  <Text style={[styles.tableTh, { width: 40 }]}>#</Text>
                  <Text style={[styles.tableTh, { flex: 2 }]}>Title</Text>
                  <Text style={[styles.tableTh, { flex: 1.5 }]}>Location</Text>
                  <Text style={[styles.tableTh, { flex: 1.5 }]}>Submitted</Text>
                  <Text style={[styles.tableTh, { width: 110 }]}>Status</Text>
                  <Text style={[styles.tableTh, { width: 80, textAlign: 'center' }]}>Action</Text>
                </View>

                {/* Table Rows */}
                {incidents.slice(0, 5).map((report, idx) => {
                  const statusBadge = getStatusBadge(report.status);

                  return (
                    <View key={report._id} style={styles.tableRow}>
                      <Text style={[styles.tableTd, { width: 40, fontWeight: '700' }]}>{idx + 1}</Text>
                      <Text style={[styles.tableTdBold, { flex: 2 }]} numberOfLines={1}>
                        {report.title || 'Ground Hazard Report'}
                      </Text>
                      <Text style={[styles.tableTd, { flex: 1.5 }]} numberOfLines={1}>
                        {formatLocationDisplay(report.location)}
                      </Text>
                      <Text style={[styles.tableTd, { flex: 1.5 }]} numberOfLines={1}>
                        {formatDate(report.createdAt)}
                      </Text>
                      <View style={{ width: 110 }}>
                        <View
                          style={[
                            styles.tableStatusPill,
                            { backgroundColor: statusBadge.bg }
                          ]}
                        >
                          <Text
                            style={[
                              styles.tableStatusPillText,
                              { color: statusBadge.text }
                            ]}
                          >
                            {statusBadge.label}
                          </Text>
                        </View>
                      </View>
                      <View style={{ width: 80, alignItems: 'center' }}>
                        <TouchableOpacity
                          onPress={() => handleOpenReport(report)}
                          style={styles.tableViewBtn}
                        >
                          <Text style={styles.tableViewBtnText}>View</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            /* ========================================================
               VIEW: ALL REPORTS (Panel 5)
            ======================================================== */
            <View style={styles.allReportsContainer}>
              <View style={styles.pageHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>All Reports</Text>
                  <Text style={styles.pageSubtitle}>
                    View all submitted ground reports with their current status.
                  </Text>
                </View>
                <View style={styles.todayPill}>
                  <View style={styles.livePulseDot} />
                  <Feather name="calendar" size={14} color="#64748B" style={{ marginRight: 6 }} />
                  <Text style={styles.todayPillText}>{liveSLTime.fullText}</Text>
                  <View style={styles.slstBadge}>
                    <Text style={styles.slstBadgeText}>SLST</Text>
                  </View>
                </View>
              </View>

              {/* Subtabs: All (20) | Pending (5) | Verified (12) | Rejected (3) */}
              <View style={styles.reportsTabsRow}>
                {[
                  { key: 'all', label: `All (${totalCount})` },
                  { key: 'pending', label: `Pending (${pendingList.length})` },
                  { key: 'verified', label: `Verified (${verifiedList.length})` },
                  { key: 'rejected', label: `Rejected (${rejectedList.length})` }
                ].map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setReportsSubTab(tab.key)}
                    style={[
                      styles.reportsTabBtn,
                      reportsSubTab === tab.key && styles.reportsTabBtnActive
                    ]}
                  >
                    <Text
                      style={[
                        styles.reportsTabBtnText,
                        reportsSubTab === tab.key && styles.reportsTabBtnTextActive
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Search Bar */}
              <View style={[styles.searchBarRow, { marginTop: 16 }]}>
                <View style={styles.searchBox}>
                  <Feather name="search" size={17} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search reports..."
                    placeholderTextColor="#94A3B8"
                    style={styles.searchInput}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Full Desktop Table */}
              <View style={styles.tableCardContainer}>
                <View style={styles.tableRowHeader}>
                  <Text style={[styles.tableTh, { width: 35 }]}>#</Text>
                  <Text style={[styles.tableTh, { flex: 2 }]}>Title</Text>
                  <Text style={[styles.tableTh, { width: 110 }]}>Type</Text>
                  <Text style={[styles.tableTh, { flex: 1.5 }]}>Location</Text>
                  <Text style={[styles.tableTh, { flex: 1.5 }]}>Submitted By</Text>
                  <Text style={[styles.tableTh, { flex: 1.5 }]}>Submitted Date</Text>
                  <Text style={[styles.tableTh, { width: 100 }]}>Status</Text>
                  <Text style={[styles.tableTh, { width: 70, textAlign: 'center' }]}>Action</Text>
                </View>

                {getFilteredReports().length === 0 ? (
                  <View style={styles.emptyTableState}>
                    <Text style={{ color: '#64748B', fontSize: 14 }}>No reports found matching your criteria</Text>
                  </View>
                ) : (
                  getFilteredReports().map((report, idx) => {
                    const statusBadge = getStatusBadge(report.status);
                    const typeBadge = getTypeBadge(report.disasterType, report.customDisasterType);

                    return (
                      <View key={report._id} style={styles.tableRow}>
                        <Text style={[styles.tableTd, { width: 35, fontWeight: '700' }]}>{idx + 1}</Text>
                        <Text style={[styles.tableTdBold, { flex: 2 }]} numberOfLines={1}>
                          {report.title || 'Ground Hazard Report'}
                        </Text>
                        <View style={{ width: 110 }}>
                          <View
                            style={[
                              styles.tableTypePill,
                              { backgroundColor: typeBadge.bg }
                            ]}
                          >
                            <Text style={styles.tableTypePillText}>{typeBadge.label}</Text>
                          </View>
                        </View>
                        <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="location-sharp" size={13} color="#64748B" style={{ marginRight: 3 }} />
                          <Text style={styles.tableTd} numberOfLines={1}>
                            {formatLocationDisplay(report.location)}
                          </Text>
                        </View>
                        <View style={{ flex: 1.5 }}>
                          <Text style={styles.tableTdBold} numberOfLines={1}>
                            {report.reportedBy?.name || 'John Perera'}
                          </Text>
                          <Text style={styles.tableSubtext}>
                            {report.reportedBy?.role === 'volunteer' ? 'Volunteer' : 'Citizen'}
                          </Text>
                        </View>
                        <Text style={[styles.tableTd, { flex: 1.5 }]} numberOfLines={1}>
                          {formatDate(report.createdAt)}
                        </Text>
                        <View style={{ width: 100 }}>
                          <View
                            style={[
                              styles.tableStatusPill,
                              { backgroundColor: statusBadge.bg }
                            ]}
                          >
                            <Text
                              style={[
                                styles.tableStatusPillText,
                                { color: statusBadge.text }
                              ]}
                            >
                              {statusBadge.label}
                            </Text>
                          </View>
                        </View>
                        <View style={{ width: 70, alignItems: 'center' }}>
                          <TouchableOpacity
                            onPress={() => handleOpenReport(report)}
                            style={styles.tableViewBtn}
                          >
                            <Text style={styles.tableViewBtnText}>View</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  topHeader: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 50
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  hamburgerBtn: {
    marginRight: 16,
    padding: 6,
    borderRadius: 8
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  emblemBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  userProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: '#F1F5F9'
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  profileDropdown: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    padding: 12,
    zIndex: 100
  },
  dropdownHeader: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  dropdownName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  dropdownEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  dropdownRole: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 4
  },
  dropdownLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10
  },
  dropdownLogoutText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13
  },
  bodyRow: {
    flex: 1,
    flexDirection: 'row'
  },
  sidebar: {
    width: 220,
    backgroundColor: '#0F172A',
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 6
  },
  sidebarCollapsed: {
    width: 68
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10
  },
  navItemActive: {
    backgroundColor: '#1E3A8A'
  },
  navItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8'
  },
  navItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  mainContent: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#F8FAFC'
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A'
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginRight: 8
  },
  todayPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  slstBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 8
  },
  slstBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5
  },
  statsCardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap'
  },
  statCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800'
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2
  },
  searchBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap'
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none'
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A'
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  filterPillTextActive: {
    color: '#FFFFFF'
  },
  sectionTitleRow: {
    marginBottom: 14
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  reportGridCard: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  cardImageWrapper: {
    width: '100%',
    height: 125,
    position: 'relative'
  },
  cardImage: {
    width: '100%',
    height: '100%'
  },
  cardDisasterBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  cardDisasterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  cardTimeBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6
  },
  cardTimeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600'
  },
  cardBody: {
    padding: 12
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  cardLocationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    flex: 1
  },
  cardSnippet: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16
  },
  tableCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB'
  },
  tableRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  tableTh: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  tableTd: {
    fontSize: 12,
    color: '#475569'
  },
  tableTdBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A'
  },
  tableSubtext: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2
  },
  tableTypePill: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  tableTypePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  tableStatusPill: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12
  },
  tableStatusPillText: {
    fontSize: 11,
    fontWeight: '800'
  },
  tableViewBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 12
  },
  tableViewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB'
  },
  emptyTableState: {
    paddingVertical: 48,
    alignItems: 'center'
  },
  reportsTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 20
  },
  reportsTabBtn: {
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  reportsTabBtnActive: {
    borderBottomColor: '#2563EB'
  },
  reportsTabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  reportsTabBtnTextActive: {
    color: '#2563EB',
    fontWeight: '800'
  },
  detailsContainer: {
    width: '100%'
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  backButtonRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  viewInMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  viewInMapBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 12
  },
  verifiedNoticeBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  verifiedNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D'
  },
  verifiedNoticeDesc: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2
  },
  rejectedNoticeBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  rejectedNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626'
  },
  rejectedNoticeDesc: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2
  },
  lockedHeaderTagVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  lockedHeaderTagTextVerified: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D'
  },
  lockedHeaderTagRejected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  lockedHeaderTagTextRejected: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626'
  },
  detailsSplitGrid: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start'
  },
  detailsLeftCol: {
    flex: 3,
    minWidth: 320
  },
  detailsRightCol: {
    flex: 2,
    minWidth: 300
  },
  metaTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    flexWrap: 'wrap'
  },
  disasterTypeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6
  },
  disasterTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  reportIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B'
  },
  submittedDateText: {
    fontSize: 12,
    color: '#94A3B8'
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6
  },
  detailsLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  detailsLocationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  detailsDescription: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 18
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12
  },
  photoGalleryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 18
  },
  mainPhotoPreview: {
    width: '100%',
    height: 260,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#0F172A'
  },
  thumbnailsStrip: {
    flexDirection: 'row',
    gap: 10
  },
  thumbWrapper: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden'
  },
  thumbWrapperActive: {
    borderColor: '#2563EB'
  },
  thumbImage: {
    width: '100%',
    height: '100%'
  },
  noPhotoPlaceholder: {
    paddingVertical: 30,
    alignItems: 'center'
  },
  locationMapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 18
  },
  mapFootnoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  mapFootnoteText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500'
  },
  reporterInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 18
  },
  reporterContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  reporterAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center'
  },
  reporterNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  reporterRoleText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    marginBottom: 6
  },
  reporterContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  reporterContactText: {
    fontSize: 12,
    color: '#475569'
  },
  verificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  verificationCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16
  },
  actionRadioBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12
  },
  actionRadioBoxSelectedVerify: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4'
  },
  actionRadioBoxSelectedReject: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2'
  },
  radioTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioCircleActiveGreen: {
    borderColor: '#22C55E'
  },
  radioCircleActiveRed: {
    borderColor: '#EF4444'
  },
  radioDotGreen: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#22C55E'
  },
  radioDotRed: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EF4444'
  },
  radioOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  radioOptionSubtext: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    paddingLeft: 26
  },
  notesGroup: {
    marginTop: 8,
    marginBottom: 18
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 12,
    color: '#0F172A',
    minHeight: 100,
    textAlignVertical: 'top',
    outlineStyle: 'none'
  },
  notesCharCounter: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12
  },
  cancelActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  cancelActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  submitActionBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  submitActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 36,
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center'
  },
  lockedVerificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  lockedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  lockedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  lockedStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  lockedOutcomeBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16
  },
  lockedOutcomeBoxVerified: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0'
  },
  lockedOutcomeBoxRejected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  lockedOutcomeTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  lockedOutcomeTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4
  },
  lockedOutcomeSubtext: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17
  },
  lockedDetailsList: {
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 10,
    marginBottom: 14
  },
  lockedDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6
  },
  lockedDetailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600'
  },
  lockedDetailValue: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500'
  },
  lockedDetailValueBold: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700'
  },
  lockedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  lockedPillText: {
    fontSize: 11,
    fontWeight: '800'
  },
  lockedNotesContainer: {
    marginBottom: 16
  },
  lockedNotesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6
  },
  lockedNotesBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12
  },
  lockedNotesText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    flex: 1
  },
  lockedInfoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 16
  },
  lockedInfoNoticeText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1
  },
  lockedDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 11,
    backgroundColor: '#F8FAFC'
  },
  lockedDoneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  }
});
