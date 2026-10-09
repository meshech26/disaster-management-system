import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { shelterService } from '../../services/shelterService';
import { formatTimeAgo } from '../../utils/formatters';
import { socketService } from '../../services/socketService';
import { storage } from '../../utils/storage';

export default function DisasterAlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);
  const [readAlertIds, setReadAlertIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'warnings' | 'updates'
  const [eventNotification, setEventNotification] = useState(null);

  const fetchAlerts = async () => {
    try {
      const [res, savedRead] = await Promise.all([
        shelterService.getBroadcasts(),
        storage.getItem('read_alert_ids')
      ]);
      const activeList = (res.data || []).filter(
        (a) => a.isActive !== false && a.status !== 'completed'
      );
      setAlerts(activeList);
      if (savedRead) {
        try {
          setReadAlertIds(JSON.parse(savedRead));
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Failed to load disaster alerts:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const socket = socketService.getSocket();
    if (!socket) return;

    // 1. Live new broadcast / immediate alert
    const handleNewBroadcast = (broadcast) => {
      if (!broadcast || broadcast.status === 'completed' || broadcast.isActive === false) return;
      setAlerts((prev) => {
        const id = broadcast._id || broadcast.id;
        const exists = prev.find((item) => (item._id || item.id) === id);
        if (exists) {
          return prev.map((item) => ((item._id || item.id) === id ? broadcast : item));
        }
        return [broadcast, ...prev];
      });
    };

    // 2. Disaster event marked as completed by DMC Officer -> disappear from live alerts!
    const handleWarningCompleted = (data) => {
      const warningId = data?.warningId;
      if (!warningId) return;

      setAlerts((prev) => prev.filter((a) => (a._id || a.id) !== warningId));
      setEventNotification({
        title: data.title || 'Disaster Warning',
        message: 'This disaster event has been marked as COMPLETED by DMC Officer.'
      });

      // Auto clear completion toast after 6 seconds
      setTimeout(() => {
        setEventNotification(null);
      }, 6000);
    };

    socket.on('emergency_alert_broadcast', handleNewBroadcast);
    socket.on('immediate_emergency_alert', handleNewBroadcast);
    socket.on('warning_completed', handleWarningCompleted);

    return () => {
      socket.off('emergency_alert_broadcast', handleNewBroadcast);
      socket.off('immediate_emergency_alert', handleNewBroadcast);
      socket.off('warning_completed', handleWarningCompleted);
    };
  }, []);

  const handleMarkAllAsRead = async () => {
    const allIds = alerts.map((a) => a._id);
    setReadAlertIds(allIds);
    await storage.setItem('read_alert_ids', JSON.stringify(allIds));
  };

  const handleToggleRead = async (id) => {
    let updated;
    if (readAlertIds.includes(id)) {
      updated = readAlertIds.filter((itemId) => itemId !== id);
    } else {
      updated = [...readAlertIds, id];
    }
    setReadAlertIds(updated);
    await storage.setItem('read_alert_ids', JSON.stringify(updated));
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  // Categorize
  const isWarning = (a) => {
    const s = (a.severity || '').toLowerCase();
    return s === 'high' || s === 'emergency_danger' || s === 'warning' || s === 'moderate' || s === 'watch';
  };

  const isUpdate = (a) => {
    const s = (a.severity || '').toLowerCase();
    return s === 'update' || s === 'all_clear' || s === 'info' || s === 'low' || s === 'advisory';
  };

  const warningCount = alerts.filter(isWarning).length;
  const updateCount = alerts.filter(isUpdate).length;

  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter === 'warnings') return isWarning(a);
    if (activeFilter === 'updates') return isUpdate(a);
    return true;
  });

  const getAlertVisuals = (alert) => {
    const s = (alert.severity || '').toLowerCase();

    if (s === 'all_clear') {
      return {
        borderColor: '#10B981',
        iconBg: '#DCFCE7',
        iconColor: '#15803D',
        iconName: 'checkmark-circle',
        badgeBg: '#DCFCE7',
        badgeText: '#15803D',
        badgeLabel: 'All Clear'
      };
    }
    if (s === 'update' || s === 'info') {
      return {
        borderColor: '#3B82F6',
        iconBg: '#DBEAFE',
        iconColor: '#1D4ED8',
        iconName: 'information-circle',
        badgeBg: '#DBEAFE',
        badgeText: '#1D4ED8',
        badgeLabel: 'Update'
      };
    }
    if (s === 'moderate' || s === 'watch' || s === 'medium') {
      return {
        borderColor: '#F59E0B',
        iconBg: '#FEF3C7',
        iconColor: '#B45309',
        iconName: 'warning',
        badgeBg: '#FEF3C7',
        badgeText: '#B45309',
        badgeLabel: 'Moderate'
      };
    }
    // High / Critical / Warning
    return {
      borderColor: '#EF4444',
      iconBg: '#FEE2E2',
      iconColor: '#B91C1C',
      iconName: 'alert-circle',
      badgeBg: '#FEE2E2',
      badgeText: '#B91C1C',
      badgeLabel: 'High Severity'
    };
  };

  const unreadCount = alerts.filter((a) => !readAlertIds.includes(a._id)).length;
  const allRead = unreadCount === 0;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }}
            style={styles.backButton}
          >
            <Feather name="chevron-left" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Disaster Alerts</Text>
        </View>

        {/* Mark as read Button */}
        <TouchableOpacity
          onPress={handleMarkAllAsRead}
          activeOpacity={0.8}
          style={[
            styles.markAsReadHeaderBtn,
            allRead && styles.markAsReadHeaderBtnDisabled
          ]}
        >
          <Ionicons
            name={allRead ? 'checkmark-done-circle' : 'checkmark-circle-outline'}
            size={16}
            color={allRead ? '#10B981' : '#C81E1E'}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.markAsReadHeaderText,
              allRead && styles.markAsReadHeaderTextDisabled
            ]}
          >
            {allRead ? 'All Read' : 'Mark as read'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs / Pills */}
      <View style={styles.filtersWrapper}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setActiveFilter('all')}
            style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, activeFilter === 'all' && styles.filterPillTextActive]}>
              All ({alerts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('warnings')}
            style={[styles.filterPill, activeFilter === 'warnings' && styles.filterPillActive]}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'warnings' && styles.filterPillTextActive
              ]}
            >
              Warnings ({warningCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('updates')}
            style={[styles.filterPill, activeFilter === 'updates' && styles.filterPillActive]}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'updates' && styles.filterPillTextActive
              ]}
            >
              Updates ({updateCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Alert Feed */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color="#C81E1E" size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C81E1E" />}
        >
          {eventNotification && (
            <View style={styles.eventNotificationBanner}>
              <View style={styles.eventNotificationIcon}>
                <Ionicons name="checkmark-circle" size={22} color="#15803D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventNotificationTitle}>{eventNotification.title}</Text>
                <Text style={styles.eventNotificationMessage}>{eventNotification.message}</Text>
              </View>
              <TouchableOpacity onPress={() => setEventNotification(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={18} color="#15803D" />
              </TouchableOpacity>
            </View>
          )}

          {filteredAlerts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#10B981" />
              <Text style={styles.emptyTitle}>No Active Alerts</Text>
              <Text style={styles.emptySubtitle}>
                There are no disaster warnings or bulletins in this filter category.
              </Text>
            </View>
          ) : (
            filteredAlerts.map((alert) => {
              const visuals = getAlertVisuals(alert);
              const isRead = readAlertIds.includes(alert._id);

              return (
                <View
                  key={alert._id}
                  style={[
                    styles.alertCard,
                    { borderLeftColor: visuals.borderColor },
                    isRead && styles.alertCardRead
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: visuals.iconBg }]}>
                      <Ionicons name={visuals.iconName} size={20} color={visuals.iconColor} />
                    </View>
                    <View style={styles.cardTitleBox}>
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      {!isRead && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Text style={styles.alertMessage}>{alert.message}</Text>

                  {alert.actionInstructions && alert.actionInstructions.length > 0 && (
                    <View style={styles.instructionsBox}>
                      <Text style={styles.instructionsTitle}>Instructions:</Text>
                      {alert.actionInstructions.map((inst, idx) => (
                        <Text key={idx} style={styles.instructionLine}>
                          • {inst}
                        </Text>
                      ))}
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                      <Text style={styles.timeText}>
                        {formatTimeAgo(alert.createdAt || new Date())}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleToggleRead(alert._id)}
                        style={styles.cardMarkReadBtn}
                      >
                        <Ionicons
                          name={isRead ? 'checkmark-circle' : 'checkmark-circle-outline'}
                          size={13}
                          color={isRead ? '#10B981' : '#64748B'}
                          style={{ marginRight: 3 }}
                        />
                        <Text style={[styles.cardMarkReadText, isRead && styles.cardMarkReadTextRead]}>
                          {isRead ? 'Read' : 'Mark as read'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.badge, { backgroundColor: visuals.badgeBg }]}>
                      <Text style={[styles.badgeText, { color: visuals.badgeText }]}>
                        {visuals.badgeLabel}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  backButton: {
    padding: 6,
    marginRight: 6
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  markAsReadHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12
  },
  markAsReadHeaderBtnDisabled: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0'
  },
  markAsReadHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C81E1E'
  },
  markAsReadHeaderTextDisabled: {
    color: '#15803D'
  },
  cardTitleBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  newBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  },
  alertCardRead: {
    opacity: 0.85,
    backgroundColor: '#F8FAFC'
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardMarkReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9'
  },
  cardMarkReadText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B'
  },
  cardMarkReadTextRead: {
    color: '#15803D',
    fontWeight: '700'
  },
  filtersWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  filterRow: {
    flexDirection: 'row',
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
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderRightColor: '#E2E8F0',
    borderTopColor: '#E2E8F0',
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  alertMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: '#334155',
    marginBottom: 10
  },
  instructionsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  instructionsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  instructionLine: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  badgeText: {
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
  eventNotificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14
  },
  eventNotificationIcon: {
    marginRight: 10
  },
  eventNotificationTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D'
  },
  eventNotificationMessage: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2
  }
});
