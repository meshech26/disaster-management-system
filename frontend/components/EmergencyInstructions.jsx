import React, { useEffect, useState } from 'react';
import { BackHandler, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { emergencyInstructions } from '../constants/emergencyInstructions';

export default function EmergencyInstructions({ onBack }) {
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [sourceError, setSourceError] = useState('');

  useEffect(() => {
    if (!selectedGuide) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelectedGuide(null);
      setSourceError('');
      return true;
    });
    return () => subscription.remove();
  }, [selectedGuide]);

  const goBack = () => {
    setSourceError('');
    if (selectedGuide) setSelectedGuide(null);
    else onBack();
  };

  return (
    <ScrollView
      key={selectedGuide?.id || 'instructions'}
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={selectedGuide ? 'Back to all instructions' : 'Back to home'}
        >
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={styles.heading}>
          {selectedGuide?.title || 'Emergency Instructions'}
        </Text>
      </View>

      {selectedGuide ? (
        <View>
          <View style={[styles.intro, { backgroundColor: selectedGuide.background }]}>
            <Text style={[styles.eyebrow, { color: selectedGuide.color }]}>
              {selectedGuide.steps.length} STEPS TO FOLLOW
            </Text>
            <Text style={styles.introText}>{selectedGuide.introduction}</Text>
          </View>
          <View style={styles.cards}>
            {selectedGuide.steps.map((step, index) => (
              <View key={step.title} style={styles.stepCard}>
                <View style={[styles.stepNumber, { backgroundColor: selectedGuide.background }]}>
                  <Text style={[styles.numberText, { color: selectedGuide.color }]}>{index + 1}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text accessibilityRole="header" style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.description}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
          <Text style={styles.localAdvice}>Follow current instructions from DMC and your local authorities.</Text>
          <TouchableOpacity
            accessibilityRole="link"
            onPress={async () => {
              setSourceError('');
              try {
                await Linking.openURL(selectedGuide.source.url);
              } catch {
                setSourceError('Unable to open the source. Please check your connection and try again.');
              }
            }}
            style={styles.sourceLink}
          >
            <Text style={styles.sourceText}>{selectedGuide.source.label}</Text>
            <Feather name="external-link" size={16} color="#1E3A8A" />
          </TouchableOpacity>
          {sourceError ? <Text accessibilityRole="alert" style={styles.errorText}>{sourceError}</Text> : null}
          <TouchableOpacity accessibilityRole="button" onPress={goBack} style={styles.doneButton}>
            <Text style={styles.doneText}>Back to all instructions</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cards}>
          {emergencyInstructions.map(guide => (
            <TouchableOpacity
              key={guide.id}
              onPress={() => setSelectedGuide(guide)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={guide.title}
              accessibilityHint="Opens a detailed guide with numbered steps"
              style={styles.card}
            >
              <View style={[styles.iconCircle, { backgroundColor: guide.background }]}>
                <Ionicons name={guide.icon} size={24} color={guide.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{guide.title}</Text>
                {guide.summary.map(tip => <Text key={tip} style={styles.bullet}>{'\u2022'} {tip}</Text>)}
                <Text style={[styles.readGuide, { color: guide.color }]}>View {guide.steps.length} safety steps</Text>
              </View>
              <Feather name="chevron-right" size={20} color={guide.color} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  heading: { flex: 1, color: '#0F172A', fontSize: 20, lineHeight: 30, fontWeight: '800' },
  cards: { gap: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardContent: { flex: 1, minWidth: 0 },
  cardTitle: { color: '#0F172A', fontSize: 20, lineHeight: 30, fontWeight: '800', marginBottom: 6 },
  bullet: { color: '#475569', fontSize: 16, lineHeight: 24 },
  readGuide: { fontSize: 16, lineHeight: 24, fontWeight: '700', marginTop: 10 },
  intro: { padding: 18, borderRadius: 16, marginBottom: 20 },
  eyebrow: { fontSize: 16, lineHeight: 24, fontWeight: '800', letterSpacing: 0.7, marginBottom: 8 },
  introText: { color: '#334155', fontSize: 18, lineHeight: 27 },
  stepCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  stepNumber: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  numberText: { fontSize: 16, lineHeight: 24, fontWeight: '800' },
  stepTitle: { color: '#0F172A', fontSize: 20, fontWeight: '700', lineHeight: 30, marginBottom: 6 },
  description: { color: '#475569', fontSize: 18, lineHeight: 27 },
  localAdvice: { color: '#475569', fontSize: 16, lineHeight: 24, marginTop: 22 },
  sourceLink: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 8, paddingVertical: 10 },
  sourceText: { color: '#1E3A8A', fontSize: 16, lineHeight: 24, flexShrink: 1, textDecorationLine: 'underline' },
  errorText: { color: '#DC2626', fontSize: 16, lineHeight: 24 },
  doneButton: { backgroundColor: '#1E3A8A', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  doneText: { color: '#FFFFFF', fontSize: 16, lineHeight: 24, fontWeight: '700' }
});
