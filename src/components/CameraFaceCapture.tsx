import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme';
import { generateCameraFaceTemplate } from '../utils/faceCamera';

interface CameraFaceCaptureProps {
  visible: boolean;
  onClose: () => void;
  onTemplateReady: (templateCode: string) => void;
}

export const CameraFaceCapture: React.FC<CameraFaceCaptureProps> = ({
  visible,
  onClose,
  onTemplateReady,
}) => {
  const cameraRef = useRef<any>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facing] = useState<CameraType>('front');

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.35,
        base64: true,
        skipProcessing: true,
      });

      const template = generateCameraFaceTemplate(photo?.base64 || '');
      onTemplateReady(template);
      onClose();
    } catch (error) {
      console.error('Camera face capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📷 Face Capture (Demo)</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>

        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          <View style={styles.overlay}>
            <View style={styles.guide} />
            <Text style={styles.instructions}>মুখটি ফ্রেমের মাঝে রেখে Capture চাপুন</Text>
          </View>
        </CameraView>

        <View style={styles.footer}>
          <Text style={styles.note}>Demo only: camera face template weak security.</Text>
          <TouchableOpacity onPress={handleCapture} disabled={isCapturing} activeOpacity={0.85}>
            <LinearGradient colors={Colors.gradients.info} style={styles.captureBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {isCapturing ? <ActivityIndicator color="#fff" /> : <Text style={styles.captureText}>Capture Face</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  close: { color: '#fff', fontSize: 24, fontWeight: '900' },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  guide: {
    width: 220,
    height: 300,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: '#38bdf8',
    backgroundColor: 'transparent',
  },
  instructions: {
    marginTop: 18,
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  note: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 10, textAlign: 'center' },
  captureBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
