import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function DmcBrandHeader({ title1 = 'Hello', title2 = 'Sign in!' }) {
  return (
    <View style={styles.headerContainer}>
      {/* Brand Nav Bar */}
      <View style={styles.navBar}>
        <View style={styles.brandGroup}>
          {/* Logo badge with red emergency cross on white shield */}
          <View style={styles.logoBadge}>
            <View style={styles.crossContainer}>
              <View style={styles.crossVertical} />
              <View style={styles.crossHorizontal} />
            </View>
          </View>

          <View style={styles.brandTextGroup}>
            <Text style={styles.brandTitle}>DMC SRI LANKA</Text>
            <Text style={styles.brandSubtitle}>Disaster Management Center</Text>
          </View>
        </View>

        {/* Options 3-dots */}
        <View style={styles.dotsButton}>
          <Feather name="more-horizontal" size={20} color="#FFFFFF" />
        </View>
      </View>

      {/* Radar rings graphic overlay on right */}
      <View style={styles.radarGraphicContainer}>
        {/* Radar Concentric Rings */}
        <View style={[styles.radarRing, styles.radarRing3]} />
        <View style={[styles.radarRing, styles.radarRing2]} />
        <View style={[styles.radarRing, styles.radarRing1]} />

        {/* Sri Lanka Silhouette & Red Beacon */}
        <View style={styles.mapSilhouette}>
          <View style={styles.sriLankaShape}>
            <View style={styles.sriLankaNorth} />
            <View style={styles.sriLankaCenter} />
            <View style={styles.sriLankaSouth} />
          </View>
          {/* Active Red Warning Beacon */}
          <View style={styles.radarBeaconOuter}>
            <View style={styles.radarBeaconInner} />
          </View>
        </View>
      </View>

      {/* Mountain Silhouettes at bottom of blue header */}
      <View style={styles.silhouetteRow}>
        <View style={styles.mountainBack} />
        <View style={styles.mountainFront} />
        <View style={styles.stupaSilhouette} />
        <View style={styles.treeSilhouette1} />
        <View style={styles.treeSilhouette2} />
      </View>

      {/* Hero Welcome Text */}
      <View style={styles.titleSection}>
        <Text style={styles.titleLine1}>{title1}</Text>
        <Text style={styles.titleLine2}>{title2}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#0E1F4D',
    paddingTop: 36,
    paddingHorizontal: 24,
    paddingBottom: 28,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 230
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoBadge: {
    width: 38,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3
  },
  crossContainer: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  crossVertical: {
    position: 'absolute',
    width: 6,
    height: 18,
    backgroundColor: '#D32F2F',
    borderRadius: 2
  },
  crossHorizontal: {
    position: 'absolute',
    width: 18,
    height: 6,
    backgroundColor: '#D32F2F',
    borderRadius: 2
  },
  brandTextGroup: {
    justifyContent: 'center'
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  brandSubtitle: {
    color: '#93B0E8',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1
  },
  dotsButton: {
    padding: 4
  },
  radarGraphicContainer: {
    position: 'absolute',
    top: 40,
    right: 15,
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  radarRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)'
  },
  radarRing1: {
    width: 60,
    height: 60,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.04)'
  },
  radarRing2: {
    width: 110,
    height: 110,
    borderColor: 'rgba(239, 68, 68, 0.22)'
  },
  radarRing3: {
    width: 160,
    height: 160,
    borderColor: 'rgba(239, 68, 68, 0.12)'
  },
  mapSilhouette: {
    position: 'relative',
    width: 50,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sriLankaShape: {
    position: 'absolute',
    width: 44,
    height: 66,
    alignItems: 'center'
  },
  sriLankaNorth: {
    width: 14,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8
  },
  sriLankaCenter: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    marginTop: -6
  },
  sriLankaSouth: {
    width: 26,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    marginTop: -8
  },
  radarBeaconOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 24,
    left: 20
  },
  radarBeaconInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444'
  },
  silhouetteRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    flexDirection: 'row',
    alignItems: 'flex-end',
    opacity: 0.35
  },
  mountainBack: {
    position: 'absolute',
    bottom: 0,
    left: -20,
    width: 220,
    height: 45,
    backgroundColor: '#081335',
    borderTopLeftRadius: 90,
    borderTopRightRadius: 110
  },
  mountainFront: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    width: 240,
    height: 55,
    backgroundColor: '#07102D',
    borderTopLeftRadius: 130,
    borderTopRightRadius: 80
  },
  stupaSilhouette: {
    position: 'absolute',
    bottom: 0,
    left: '48%',
    width: 42,
    height: 32,
    backgroundColor: '#060E28',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  treeSilhouette1: {
    position: 'absolute',
    bottom: 0,
    left: '32%',
    width: 12,
    height: 22,
    backgroundColor: '#060E28',
    borderRadius: 6
  },
  treeSilhouette2: {
    position: 'absolute',
    bottom: 0,
    right: '25%',
    width: 10,
    height: 18,
    backgroundColor: '#060E28',
    borderRadius: 5
  },
  titleSection: {
    marginTop: 26,
    zIndex: 10
  },
  titleLine1: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34
  },
  titleLine2: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38
  }
});
