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
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DmcBrandHeader from '../../components/DmcBrandHeader';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccessPortal = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your username/email and password.');
      return;
    }

    setLoading(true);
    try {
      const userData = await login(username.trim(), password);
      if (userData?.role === 'duty_officer') {
        router.replace('/duty-officer');
      } else if (userData?.role === 'dmc_officer' || userData?.role === 'admin') {
        router.replace('/dmc-officer');
      } else if (userData?.role === 'district_officer') {
        router.replace('/district-officer');
      } else if (userData?.role === 'rescue_team' || userData?.role === 'responder') {
        router.replace('/rescue-team');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      Alert.alert('Access Denied', err.message || 'Invalid credentials');
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
        {/* DMC Sri Lanka Branding & Atmosphere Header */}
        <DmcBrandHeader title1="Hello" title2="Sign in!" />

        {/* White Card Section */}
        <View style={styles.cardContainer}>
          {/* Quick Demo Login Chips */}
          <View style={styles.demoChipsRow}>
            <TouchableOpacity
              onPress={() => {
                setUsername('district_officer');
                setPassword('password123');
              }}
              style={[
                styles.demoChip,
                username === 'district_officer' && styles.demoChipActive
              ]}
            >
              <Feather
                name="map-pin"
                size={13}
                color={username === 'district_officer' ? '#FFFFFF' : '#1E3A8A'}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.demoChipText,
                  username === 'district_officer' && styles.demoChipTextActive
                ]}
              >
                District Officer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setUsername('rescue_team');
                setPassword('password123');
              }}
              style={[
                styles.demoChip,
                username === 'rescue_team' && styles.demoChipActive
              ]}
            >
              <Feather
                name="navigation"
                size={13}
                color={username === 'rescue_team' ? '#FFFFFF' : '#1E3A8A'}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.demoChipText,
                  username === 'rescue_team' && styles.demoChipTextActive
                ]}
              >
                Rescue Team
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setUsername('duty_officer');
                setPassword('password123');
              }}
              style={[
                styles.demoChip,
                username === 'duty_officer' && styles.demoChipActive
              ]}
            >
              <Feather
                name="shield"
                size={13}
                color={username === 'duty_officer' ? '#FFFFFF' : '#1E3A8A'}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.demoChipText,
                  username === 'duty_officer' && styles.demoChipTextActive
                ]}
              >
                Duty Officer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setUsername('dmc_officer');
                setPassword('password123');
              }}
              style={[
                styles.demoChip,
                username === 'dmc_officer' && styles.demoChipActive
              ]}
            >
              <Feather
                name="radio"
                size={13}
                color={username === 'dmc_officer' ? '#FFFFFF' : '#1E3A8A'}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.demoChipText,
                  username === 'dmc_officer' && styles.demoChipTextActive
                ]}
              >
                DMC Officer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setUsername('volunteer');
                setPassword('password123');
              }}
              style={[
                styles.demoChip,
                username === 'volunteer' && styles.demoChipActive
              ]}
            >
              <Feather
                name="user-check"
                size={13}
                color={username === 'volunteer' ? '#FFFFFF' : '#1E3A8A'}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.demoChipText,
                  username === 'volunteer' && styles.demoChipTextActive
                ]}
              >
                Volunteer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setUsername('citizen');
                setPassword('password123');
              }}
              style={[
                styles.demoChip,
                (username === 'citizen' || username === 'nimal_silva') && styles.demoChipActive
              ]}
            >
              <Feather
                name="user"
                size={13}
                color={(username === 'citizen' || username === 'nimal_silva') ? '#FFFFFF' : '#1E3A8A'}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.demoChipText,
                  (username === 'citizen' || username === 'nimal_silva') && styles.demoChipTextActive
                ]}
              >
                Citizen Demo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Username Input Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.inputBox}>
              <Feather name="user" size={19} color="#1E3A8A" style={styles.leadingIcon} />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                style={styles.textInput}
              />
            </View>
          </View>

          {/* Password Input Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputBox}>
              <Feather name="lock" size={19} color="#1E3A8A" style={styles.leadingIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
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
                  size={19}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={() => Alert.alert('Password Reset', 'Please contact your regional DMC administrator or check your registered email.')}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Access Portal Button */}
          <TouchableOpacity
            onPress={handleAccessPortal}
            disabled={loading}
            activeOpacity={0.88}
            style={styles.accessButton}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.accessButtonText}>ACCESS PORTAL</Text>
                <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </View>
            )}
          </TouchableOpacity>

          {/* Bottom Navigation Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.signUpLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 36,
    marginTop: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    elevation: 8
  },
  demoChipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20
  },
  demoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  demoChipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A'
  },
  demoChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A'
  },
  demoChipTextActive: {
    color: '#FFFFFF'
  },
  inputGroup: {
    marginBottom: 18
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: 0.2
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#94A3B8',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 24
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A8A'
  },
  accessButton: {
    backgroundColor: '#C81E1E',
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
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
  accessButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 26
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500'
  },
  signUpLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A'
  }
});
