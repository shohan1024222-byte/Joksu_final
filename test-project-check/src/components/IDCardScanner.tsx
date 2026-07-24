import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface IDCardScannerProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (data: string) => void;
  expectedId: string;
}

export const IDCardScanner: React.FC<IDCardScannerProps> = ({
  visible,
  onClose,
  onScanSuccess,
  expectedId,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedValue, setScannedValue] = useState('');

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setScanned(false);
      setScanSuccess(false);
      setScannedValue('');
      if (!permission?.granted) {
        requestPermission();
      }
    }
  }, [visible]);

  const extractStudentId = (data: string): string => {
    // Try to parse as JSON first (some QR codes contain JSON)
    try {
      const parsed = JSON.parse(data);
      if (parsed.studentId) return parsed.studentId;
      if (parsed.id) return parsed.id;
      if (parsed.student_id) return parsed.student_id;
    } catch (e) {
      // Not JSON, continue
    }

    // Check if it's a URL with query params
    if (data.includes('?')) {
      try {
        const params = new URLSearchParams(data.split('?')[1]);
        const id = params.get('studentId') || params.get('id') || params.get('student_id');
        if (id) return id;
      } catch (e) {
        // Not a valid URL
      }
    }

    // Return the raw data (it might be just the student ID)
    return data.trim();
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return; // Prevent multiple scans
    setScanned(true);

    console.log('QR Scanned raw data:', data);
    const extractedId = extractStudentId(data);
    console.log('Extracted student ID:', extractedId);

    setScannedValue(extractedId);
    setScanSuccess(true);

    // Short delay to show success feedback
    setTimeout(() => {
      onScanSuccess(extractedId);
    }, 800);
  };

  const handleRetry = () => {
    setScanned(false);
    setScanSuccess(false);
    setScannedValue('');
  };

  if (!visible) return null;

  // Permission loading
  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.centeredView}>
          <ActivityIndicator size="large" color="#1a472a" />
          <Text style={styles.loadingText}>ক্যামেরা পারমিশন চেক হচ্ছে...</Text>
        </View>
      </Modal>
    );
  }

  // Camera not granted yet
  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.centeredView}>
          <Text style={styles.titleDark}>আইডি কার্ড যাচাইকরণ</Text>
          <Text style={styles.message}>
            আইডি কার্ড স্ক্যান করতে ক্যামেরা অ্যাক্সেস দিন
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>📷 ক্যামেরা অনুমতি দিন</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButtonCenter} onPress={onClose}>
            <Text style={styles.closeButtonCenterText}>বন্ধ করুন</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // Camera scanner view
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>আইডি কার্ড স্ক্যান করুন</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        >
          <View style={styles.overlay}>
            {/* Corner markers for scan frame */}
            <View style={styles.scanFrameContainer}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
            </View>

            {scanSuccess ? (
              <View style={styles.successOverlay}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successText}>স্ক্যান সফল!</Text>
                <Text style={styles.scannedIdText}>ID: {scannedValue}</Text>
              </View>
            ) : (
              <Text style={styles.instruction}>
                আপনার আইডি কার্ডের QR কোড ফ্রেমের মধ্যে রাখুন
              </Text>
            )}
          </View>
        </CameraView>

        <View style={styles.footer}>
          {scanned && !scanSuccess && (
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>🔄 আবার স্ক্যান করুন</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  titleDark: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a472a',
    marginBottom: 10,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrameContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 260,
    height: 260,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4CAF50',
    borderWidth: 4,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  successOverlay: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
    borderRadius: 12,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scannedIdText: {
    color: 'white',
    fontSize: 16,
    marginTop: 8,
  },
  instruction: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: 10,
  },
  retryButton: {
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    color: '#555',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#1a472a',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    minWidth: 250,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  closeButtonCenter: {
    marginTop: 20,
    padding: 12,
  },
  closeButtonCenterText: {
    color: '#999',
    fontSize: 16,
  },
});