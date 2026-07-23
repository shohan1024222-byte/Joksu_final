import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context';
import { Colors } from '../theme';

const { height } = Dimensions.get('window');

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export const LoginScreen: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [loginErrorVisible, setLoginErrorVisible] = useState(false);

  const logoScale = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(50)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(formSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(formOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    if (!studentId.trim() || !password.trim()) {
      showAlert('ত্রুটি', 'অনুগ্রহ করে Student ID এবং Password দিন');
      return;
    }
    setLoading(true);
    try {
      const success = await login(studentId.trim(), password);
      setLoading(false);
      if (!success) {
        setLoginErrorVisible(true);
      }
    } catch (error) {
      setLoading(false);
      showAlert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <LinearGradient colors={['#151825', '#1E2745', '#2D3250']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={styles.decorCircle3} />

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <Animated.View style={[styles.logoContainer, { transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }] }]}>
            <LinearGradient colors={Colors.gradients.aurora} style={styles.logoGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.logoEmoji}>🗳️</Text>
            </LinearGradient>
            <Text style={styles.title}>JOKSHU</Text>
            <Text style={styles.subtitle}>জগন্নাথ বিশ্ববিদ্যালয়</Text>
            <Text style={styles.subtitle2}>কেন্দ্রীয় ছাত্র সংসদ</Text>
            <LinearGradient colors={Colors.gradients.candy} style={styles.electionBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.electionText}>✨ নির্বাচন ২০২৬ ✨</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[styles.formContainer, { opacity: formOpacity, transform: [{ translateY: formSlide }] }]}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🎓 Student ID</Text>
              <TextInput style={styles.input} placeholder="Enter your Student ID" placeholderTextColor={Colors.textMuted} value={studentId} onChangeText={setStudentId} autoCapitalize="none" autoCorrect={false} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🔒 Password</Text>
              <TextInput style={styles.input} placeholder="Enter your password" placeholderTextColor={Colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} />
            </View>
            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={loading ? ['#999', '#888'] : Colors.gradients.primary} style={styles.loginButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.loginButtonText}>লগইন করুন →</Text>}
              </LinearGradient>
            </TouchableOpacity>
            {/* Custom error modal for login failures */}
            <Modal visible={loginErrorVisible} transparent animationType="fade" onRequestClose={() => setLoginErrorVisible(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.errorModal}>
                  <Text style={styles.errorTitle}>Login Failed</Text>
                  <Text style={styles.errorMessage}>অবৈধ পাসওয়ার্ড। পাসওয়ার্ড ভুলে গেলে ভোট কর্তৃপক্ষের সাথে যোগাযোগ করুন।</Text>
                  <TouchableOpacity style={styles.errorBtn} onPress={() => setLoginErrorVisible(false)}>
                    <Text style={styles.errorBtnText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  decorCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(108,99,255,0.08)', top: -100, right: -80 },
  decorCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,107,107,0.06)', bottom: 50, left: -60 },
  decorCircle3: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(0,210,255,0.06)', top: height * 0.3, left: -30 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoGradient: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 12 },
  logoEmoji: { fontSize: 52 },
  title: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: 4, marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  subtitle2: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  electionBadge: { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 100, marginTop: 6 },
  electionText: { fontSize: 16, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  formContainer: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 24 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff' },
  loginButton: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  loginButtonText: { color: '#fff', fontSize: 19, fontWeight: 'bold', letterSpacing: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorModal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
