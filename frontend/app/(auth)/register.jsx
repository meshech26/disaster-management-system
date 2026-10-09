import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import DmcBrandHeader from '../../components/DmcBrandHeader';
import { useAuth } from '../../context/AuthContext';

const SRI_LANKA_DISTRICTS = [
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Monaragala',
  'Ratnapura',
  'Kegalle'
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [accountType, setAccountType] = useState('Citizen'); // 'Citizen' | 'Volunteer'
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [district, setDistrict] = useState('');

  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please fill in your Full Name, Email, and Password.');
      return;
    }

    setLoading(true);
    try {
      const backendRole = accountType === 'Volunteer' ? 'volunteer' : 'citizen';
      await register({
        name: fullName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        phone: '+94 77 123 4567', // default Sri Lanka prefix
        district: district,
        role: backendRole,
        agency: accountType === 'Volunteer' ? 'DMC Volunteer Corps' : 'Citizen',
        lastKnownLocation: {
          address: district ? `${district} District, Sri Lanka` : 'Sri Lanka'
        }
      });

      Alert.alert('Registration Successful', 'Welcome to Disaster Management Center network.', [
        {
          text: 'Continue',
          onPress: () => router.replace('/(tabs)')
        }
      ]);
    } catch (err) {
      Alert.alert('Sign Up Failed', err.message || 'Could not complete registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screenContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* DMC Header with "Create Your Account" */}
        <DmcBrandHeader title1="Create Your" title2="Account" />

        {/* White Card Section */}
        <View style={styles.cardContainer}>
          {/* "I am a" Radio Selector */}
          <View style={styles.radioGroupSection}>
            <Text style={styles.fieldLabel}>I am a</Text>
            <View style={styles.radioRow}>
              {/* Citizen Option */}
              <TouchableOpacity
                onPress={() => setAccountType('Citizen')}
                activeOpacity={0.8}
                style={[
                  styles.radioPill,
                  accountType === 'Citizen' && styles.radioPillActive
                ]}
              >
                <View style={styles.radioCircle}>
                  {accountType === 'Citizen' && <View style={styles.radioDot} />}
                </View>
                <MaterialCommunityIcons
                  name="account-group"
                  size={20}
                  color={accountType === 'Citizen' ? '#1E3A8A' : '#64748B'}
                  style={styles.pillIcon}
                />
                <Text
                  style={[
                    styles.radioPillText,
                    accountType === 'Citizen' && styles.radioPillTextActive
                  ]}
                >
                  Citizen
                </Text>
              </TouchableOpacity>

              {/* Volunteer Option */}
              <TouchableOpacity
                onPress={() => setAccountType('Volunteer')}
                activeOpacity={0.8}
                style={[
                  styles.radioPill,
                  accountType === 'Volunteer' && styles.radioPillActive
                ]}
              >
                <View style={styles.radioCircle}>
                  {accountType === 'Volunteer' && <View style={styles.radioDot} />}
                </View>
                <MaterialCommunityIcons
                  name="hard-hat"
                  size={20}
                  color={accountType === 'Volunteer' ? '#1E3A8A' : '#64748B'}
                  style={styles.pillIcon}
                />
                <Text
                  style={[
                    styles.radioPillText,
                    accountType === 'Volunteer' && styles.radioPillTextActive
                  ]}
                >
                  Volunteer
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputBox}>
              <Feather name="user" size={18} color="#1E3A8A" style={styles.leadingIcon} />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.inputBox}>
              <Feather name="user" size={18} color="#1E3A8A" style={styles.leadingIcon} />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Choose a username"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                style={styles.textInput}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputBox}>
              <Feather name="mail" size={18} color="#1E3A8A" style={styles.leadingIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputBox}>
              <Feather name="lock" size={18} color="#1E3A8A" style={styles.leadingIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={styles.textInput}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.trailingIcon}
              >
                <Feather
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={18}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* District Select Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>District</Text>
            <TouchableOpacity
              onPress={() => setDistrictModalOpen(true)}
              activeOpacity={0.8}
              style={styles.inputBox}
            >
              <Feather name="map-pin" size={18} color="#1E3A8A" style={styles.leadingIcon} />
              <Text
                style={[
                  styles.dropdownText,
                  !district && styles.dropdownPlaceholder
                ]}
              >
                {district || 'Select your district'}
              </Text>
              <Feather name="chevron-down" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Sign Up Action Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.88}
            style={styles.signUpButton}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.signUpButtonText}>SIGN UP</Text>
                <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </View>
            )}
          </TouchableOpacity>

          {/* Footer Sign In Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.signInLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* District Picker Modal */}
      <Modal visible={districtModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sri Lanka District</Text>
              <TouchableOpacity onPress={() => setDistrictModalOpen(false)}>
                <Feather name="x" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {SRI_LANKA_DISTRICTS.map((dist) => (
                <TouchableOpacity
                  key={dist}
                  onPress={() => {
                    setDistrict(dist);
                    setDistrictModalOpen(false);
                  }}
                  style={[
                    styles.modalItem,
                    district === dist && styles.modalItemSelected
                  ]}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      district === dist && styles.modalItemTextSelected
                    ]}
                  >
                    {dist}
                  </Text>
                  {district === dist && (
                    <Feather name="check" size={18} color="#1E3A8A" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0E1F4D'
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#0E1F4D'
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    marginTop: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8
  },
  radioGroupSection: {
    marginBottom: 18
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: 0.2
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  radioPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginRight: 6
  },
  radioPillActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EEF4FF'
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#1E3A8A'
  },
  pillIcon: {
    marginRight: 6
  },
  radioPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  radioPillTextActive: {
    color: '#0F172A',
    fontWeight: '700'
  },
  inputGroup: {
    marginBottom: 16
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#94A3B8',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: '#FFFFFF'
  },
  leadingIcon: {
    marginRight: 10
  },
  trailingIcon: {
    padding: 6
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500'
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500'
  },
  dropdownPlaceholder: {
    color: '#94A3B8'
  },
  signUpButton: {
    backgroundColor: '#C81E1E',
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#C81E1E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500'
  },
  signInLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '75%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  modalList: {
    paddingHorizontal: 16,
    paddingTop: 8
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  modalItemSelected: {
    backgroundColor: '#EEF4FF',
    borderRadius: 12
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155'
  },
  modalItemTextSelected: {
    color: '#1E3A8A',
    fontWeight: '700'
  }
});
