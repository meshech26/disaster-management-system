import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
  Platform
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../services/socketService';
import { broadcastService } from '../services/broadcastService';

export default function EmergencyAlertModal() {
  const router = useRouter();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(10);

  const countdownTimerRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const seenAlertIdsRef = useRef(new Set());

  // Pulse animation for urgent siren cue
  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true
          })
        ])
      ).start();

      // Trigger short vibration cue on mobile
      try {
        if (Platform.OS !== 'web') {
          Vibration.vibrate([0, 400, 200, 400]);
        }
      } catch (e) {}
    } else {
      pulseAnim.setValue(1);
    }
  }, [visible]);

  const showAlert = (alert) => {
    // Only show to citizens, volunteers, or users matching affected district
    if (!alert) return;
    const alertId = alert._id || alert.id;
    if (alertId && seenAlertIdsRef.current.has(alertId)) {
      return;
    }

    const userDistrict = (user?.district || '').toLowerCase().trim();
    const affectedDistrict = (alert.affectedDistrict || 'All Districts').toLowerCase().trim();

    // Check district targeting: if alert is for all districts or matches user district
    const isTargeted =
      affectedDistrict === 'all districts' ||
      !userDistrict ||
      !affectedDistrict ||
      userDistrict === affectedDistrict ||
      affectedDistrict.includes(userDistrict) ||
      userDistrict.includes(affectedDistrict);

    if (!isTargeted) {
      return;
    }

    setCurrentAlert(alert);
    setSecondsLeft(10);
    setVisible(true);

    if (alertId) {
      seenAlertIdsRef.current.add(alertId);
    }

    // Animate 10-second countdown progress bar from 1 to 0
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 10000,
      useNativeDriver: false
    }).start();

    // 10-second countdown interval
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          handleDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDismiss = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    setVisible(false);
  };

  const handleViewDetails = () => {
    handleDismiss();
    router.push('/(tabs)/alerts');
  };

  // 1. Socket listener for real-time immediate alerts
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleImmediateAlert = (data) => {
      showAlert(data);
    };

    socket.on('immediate_emergency_alert', handleImmediateAlert);

    return () => {
      socket.off('immediate_emergency_alert', handleImmediateAlert);
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [user]);

  // 2. Fetch on login or app launch if there is an active immediate alert
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const checkActiveImmediate = async () => {
      try {
        const res = await broadcastService.getActiveImmediateAlerts(user.district);
        const immediateAlerts = res.data || [];
        if (isMounted && immediateAlerts.length > 0) {
          // Show the latest immediate alert
          const latest = immediateAlerts[0];
          showAlert(latest);
        }
      } catch (err) {
        // Silently handle if offline or backend cold start
      }
    };

    const timer = setTimeout(() => {
      checkActiveImmediate();
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user]);

  if (!visible || !currentAlert) {
    return null;
  }

  const alertTitle = currentAlert.title || 'Emergency Hazard Warning';
  const alertDistrict = currentAlert.affectedDistrict || 'Affected Area';
  const alertMessage =
    currentAlert.message ||
    'High-severity disaster event detected in your district. Avoid the area and stay indoors.';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.alertCard}>
          {/* Top Red Header Strip */}
          <View style={styles.headerStrip}>
            <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="warning" size={26} color="#FFFFFF" />
            </Animated.View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.alertHeaderTitle}>EMERGENCY ALERT</Text>
              <Text style={styles.alertHeaderSubtitle}>Immediate Action Advisory</Text>
            </View>
            {/* Mark as seen / dismiss button */}
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.closeBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Alert Body */}
          <View style={styles.cardBody}>
            {/* District badge */}
            <View style={styles.districtBadge}>
              <Feather name="map-pin" size={13} color="#DC2626" />
              <Text style={styles.districtBadgeText}>
                {alertDistrict} {alertDistrict !== 'All Districts' ? 'District' : ''}
              </Text>
            </View>

            <Text style={styles.alertMainTitle}>{alertTitle}</Text>
            <Text style={styles.alertMessageText}>{alertMessage}</Text>

            {/* Auto-dismiss countdown visual bar */}
            <View style={styles.countdownContainer}>
              <View style={styles.countdownTextRow}>
                <View style={styles.countdownLabelRow}>
                  <Feather name="clock" size={13} color="#64748B" />
                  <Text style={styles.countdownLabel}>Auto-dismissing in:</Text>
                </View>
                <Text style={styles.countdownSecondsText}>{secondsLeft}s</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%']
                      })
                    }
                  ]}
                />
              </View>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                onPress={handleDismiss}
                style={styles.markSeenBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-done" size={18} color="#475569" style={{ marginRight: 6 }} />
                <Text style={styles.markSeenBtnText}>Mark as Seen</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleViewDetails}
                style={styles.viewMapBtn}
                activeOpacity={0.88}
              >
                <Feather name="map" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.viewMapBtnText}>View on Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  alertCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 25,
    borderWidth: 1.5,
    borderColor: '#EF4444'
  },
  headerStrip: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  headerTextGroup: {
    flex: 1
  },
  alertHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  alertHeaderSubtitle: {
    color: '#FEE2E2',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardBody: {
    padding: 20
  },
  districtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12
  },
  districtBadgeText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5
  },
  alertMainTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 25
  },
  alertMessageText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
    marginBottom: 16
  },
  countdownContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  countdownTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  countdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  countdownLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 6
  },
  countdownSecondsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626'
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 3
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  markSeenBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  markSeenBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700'
  },
  viewMapBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  viewMapBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
