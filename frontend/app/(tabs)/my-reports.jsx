import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { incidentService } from '../../services/incidentService';
import { getNearestSriLankanLocation } from '../../services/geocodingService';

export default function MyReportsScreen() {
  const router = useRouter();
  const { user } = useAuth();

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

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'under_review' | 'verified' | 'rejected'
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    try {
      const res = await incidentService.getIncidents({ limit: 50 });
      const all = res.data || [];
      // If user is authenticated, prioritize user's reports; otherwise display all volunteer ground reports
      const mine = all.filter(
        (r) => r.reportedBy?._id === user?._id || r.reportedBy === user?._id
      );
      setReports(mine.length > 0 ? mine : all);
    } catch (e) {
      console.warn('Failed to load my reports:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  // Filter counts
  const underReviewCount = reports.filter(
    (r) => !r.status || r.status === 'under_review' || r.status === 'reported'
  ).length;
  const verifiedCount = reports.filter((r) => r.status === 'verified').length;
  const rejectedCount = reports.filter(
    (r) => r.status === 'rejected' || r.status === 'dismissed'
  ).length;

  const filteredReports = reports.filter((report) => {
    const s = (report.status || 'under_review').toLowerCase();
    if (activeFilter === 'under_review') {
      return s === 'under_review' || s === 'reported';
    }
    if (activeFilter === 'verified') {
      return s === 'verified';
    }
    if (activeFilter === 'rejected') {
      return s === 'rejected' || s === 'dismissed';
    }
    return true;
  });

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

  const getHazardTypeBadge = (type, customType) => {
    const t = (type || '').toLowerCase();
    if (t === 'flood') return { label: 'Flood', color: '#0284C7', bg: '#E0F2FE' };
    if (t === 'landslide' || t === 'land slide') return { label: 'Land Slide', color: '#D97706', bg: '#FEF3C7' };
    if (t === 'extreme_wind' || t === 'extreme wind') return { label: 'Extreme Wind', color: '#0D9488', bg: '#CCFBF1' };
    if (t === 'heavy_rain_lightning' || t === 'heavy rain with lightning' || t === 'heavy_rain_with_lightning') return { label: 'Rain & Lightning', color: '#6366F1', bg: '#EEF2FF' };
    if (customType) return { label: customType, color: '#64748B', bg: '#F1F5F9' };
    return { label: 'Other', color: '#64748B', bg: '#F1F5F9' };
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Submitted Reports</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Filter Tabs / Pills */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {/* All */}
          <TouchableOpacity
            onPress={() => setActiveFilter('all')}
            style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, activeFilter === 'all' && styles.filterPillTextActive]}>
              All ({reports.length})
            </Text>
          </TouchableOpacity>

          {/* Under Review */}
          <TouchableOpacity
            onPress={() => setActiveFilter('under_review')}
            style={[styles.filterPill, activeFilter === 'under_review' && styles.filterPillActive]}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'under_review' && styles.filterPillTextActive
              ]}
            >
              Under Review ({underReviewCount})
            </Text>
          </TouchableOpacity>

          {/* Verified */}
          <TouchableOpacity
            onPress={() => setActiveFilter('verified')}
            style={[styles.filterPill, activeFilter === 'verified' && styles.filterPillActive]}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'verified' && styles.filterPillTextActive
              ]}
            >
              Verified ({verifiedCount})
            </Text>
          </TouchableOpacity>

          {/* Rejected */}
          <TouchableOpacity
            onPress={() => setActiveFilter('rejected')}
            style={[styles.filterPill, activeFilter === 'rejected' && styles.filterPillActive]}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'rejected' && styles.filterPillTextActive
              ]}
            >
              Rejected ({rejectedCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Reports List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color="#C81E1E" size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C81E1E" />}
        >
          {filteredReports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No reports found</Text>
              <Text style={styles.emptySubtitle}>
                No reports match the selected "{activeFilter.replace('_', ' ')}" filter.
              </Text>
            </View>
          ) : (
            filteredReports.map((report) => {
              const badge = getStatusBadge(report.status);
              const typeBadge = getHazardTypeBadge(report.disasterType, report.customDisasterType);
              const photoUri = report.mediaUrls?.[0]?.url;

              return (
                <TouchableOpacity
                  key={report._id}
                  activeOpacity={0.88}
                  onPress={() => setSelectedReport(report)}
                  style={styles.card}
                >
                  <View style={styles.cardLeft}>
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.thumbnail} />
                    ) : (
                      <View style={styles.thumbnailFallback}>
                        <Ionicons name="warning" size={24} color="#C81E1E" />
                      </View>
                    )}
                  </View>

                  <View style={styles.cardRight}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {report.title || 'Ground Hazard Report'}
                      </Text>
                    </View>

                    <View style={styles.cardLocationRow}>
                      <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                      <Text style={styles.cardLocationText} numberOfLines={1}>
                        {formatLocationDisplay(report.location)}
                      </Text>
                    </View>

                    <View style={styles.cardBottomRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: 6 }}>
                        <View style={[styles.hazardPill, { backgroundColor: typeBadge.bg, marginRight: 6 }]}>
                          <Text style={[styles.hazardPillText, { color: typeBadge.color }]}>
                            {typeBadge.label}
                          </Text>
                        </View>
                        <Text style={styles.cardDateText} numberOfLines={1}>
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
        </ScrollView>
      )}

      {/* Report Detail Modal */}
      <Modal visible={!!selectedReport} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedReport && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {selectedReport.title || 'Report Details'}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedReport(null)}>
                    <Feather name="x" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {selectedReport.mediaUrls?.[0]?.url && (
                    <Image
                      source={{ uri: selectedReport.mediaUrls[0].url }}
                      style={styles.modalImage}
                    />
                  )}

                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalLabel}>Status</Text>
                    {(() => {
                      const badge = getStatusBadge(selectedReport.status);
                      return (
                        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                            {badge.label}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>

                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalLabel}>Hazard Type</Text>
                    {(() => {
                      const tBadge = getHazardTypeBadge(selectedReport.disasterType, selectedReport.customDisasterType);
                      return (
                        <View style={[styles.hazardPill, { backgroundColor: tBadge.bg }]}>
                          <Text style={[styles.hazardPillText, { color: tBadge.color, fontSize: 12 }]}>
                            {tBadge.label}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>

                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalLabel}>Location</Text>
                    <Text style={styles.modalValue}>
                      {formatLocationDisplay(selectedReport.location)}
                    </Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalLabel}>Reported On</Text>
                    <Text style={styles.modalValue}>
                      {new Date(selectedReport.createdAt).toLocaleString()}
                    </Text>
                  </View>

                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.modalLabel}>Hazard Description</Text>
                    <Text style={styles.modalDescription}>
                      {selectedReport.description}
                    </Text>
                  </View>
                </ScrollView>
              </>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
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
  filtersWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  filtersScroll: {
    paddingHorizontal: 16
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8
  },
  filterPillActive: {
    backgroundColor: '#C81E1E'
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B'
  },
  filterPillTextActive: {
    color: '#FFFFFF'
  },
  listContent: {
    padding: 16,
    paddingBottom: 36
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  cardLeft: {
    marginRight: 14
  },
  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#E2E8F0'
  },
  thumbnailFallback: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardRight: {
    flex: 1,
    justifyContent: 'space-between'
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  cardLocationText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  cardDateText: {
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 24
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1
  },
  modalBody: {
    paddingTop: 14
  },
  modalImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: '#E2E8F0'
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B'
  },
  modalValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A'
  },
  modalDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: '#334155',
    marginTop: 6
  },
  hazardPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  hazardPillText: {
    fontSize: 10.5,
    fontWeight: '700'
  }
});
