import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme';
import { CameraFingerprintCapture } from './CameraFingerprintCapture';

interface FingerprintScannerProps {
  visible: boolean;
  studentId: string;
  onClose: () => void;
  onVerify: (fingerprintCode: string) => Promise<boolean>;
}

export const FingerprintScanner: React.FC<FingerprintScannerProps> = ({
  visible,
  studentId,
  onClose,
  onVerify,
}) => {
  const [fingerprintCode, setFingerprintCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [showCameraCapture, setShowCameraCapture] = useState(false);

  const maskedStudentId = useMemo(() => {
    const clean = studentId || '';
    if (clean.length <= 4) return clean;
    return `***${clean.slice(-4)}`;
  }, [studentId]);

  React.useEffect(() => {
    if (!visible) {
      setFingerprintCode('');
      setError('');
      setIsVerifying(false);
    }
  }, [visible]);

  const handleVerify = async () => {
    if (!fingerprintCode.trim()) {
      setError('ফিঙ্গারপ্রিন্ট কোড দিন');
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      const ok = await onVerify(fingerprintCode.trim());
      if (!ok) {
        setError('ফিঙ্গারপ্রিন্ট মেলেনি। আবার চেষ্টা করুন।');
      }
    } catch (e) {
      setError('যাচাইকরণে সমস্যা হয়েছে।');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient colors={Colors.gradients.info} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.headerIcon}>🖐️</Text>
            <Text style={styles.headerTitle}>Fingerprint Verification</Text>
          </LinearGradient>

          <View style={styles.body}>
            <Text style={styles.caption}>ID: {maskedStudentId}</Text>
            <Text style={styles.title}>ফিঙ্গারপ্রিন্ট যাচাই করুন</Text>
            <Text style={styles.subtitle}>অ্যাডমিন সেট করা fingerprint code দিন।</Text>

            <TextInput
              style={styles.input}
              placeholder="Fingerprint code"
              placeholderTextColor={Colors.textMuted}
              value={fingerprintCode}
              onChangeText={setFingerprintCode}
              secureTextEntry
              editable={!isVerifying}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity style={styles.cameraOption} onPress={() => setShowCameraCapture(true)} disabled={isVerifying}>
              <Text style={styles.cameraOptionText}>📷 Camera দিয়ে Fingerprint (Demo)</Text>
            </TouchableOpacity>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isVerifying}>
                <Text style={styles.cancelText}>বাতিল</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.verifyBtnWrap} onPress={handleVerify} disabled={isVerifying} activeOpacity={0.85}>
                <LinearGradient colors={Colors.gradients.info} style={styles.verifyBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {isVerifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyText}>যাচাই করুন</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <CameraFingerprintCapture
        visible={showCameraCapture}
        onClose={() => setShowCameraCapture(false)}
        onTemplateReady={(templateCode) => {
          setFingerprintCode(templateCode);
          setError('');
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 8,
  },
  headerIcon: { fontSize: 24 },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#fff' },
  body: { padding: 20 },
  caption: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 14 },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
  },
  error: { color: '#d93b4b', marginTop: 10, fontSize: 13, fontWeight: '600' },
  cameraOption: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
  },
  cameraOptionText: { color: '#0369a1', fontSize: 13, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  cancelText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '700' },
  verifyBtnWrap: { flex: 1 },
  verifyBtn: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  verifyText: { fontSize: 15, color: '#fff', fontWeight: '800' },
});