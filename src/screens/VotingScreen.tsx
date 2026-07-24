import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useVoting, useAuth } from '../context';
import { Position } from '../types';
import { FirebaseStorage } from '../firebase';
import { IDCardScanner, FaceScanner } from '../components';
import { Colors, BorderRadius } from '../theme';

const Storage = FirebaseStorage;
const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) { const ok = window.confirm(`${title}\n\n${message}`); if (ok && buttons[1]?.onPress) buttons[1].onPress(); }
    else window.alert(`${title}\n\n${message}`);
  } else Alert.alert(title, message, buttons);
};

const POS_COLORS = [Colors.gradients.primary, Colors.gradients.ocean, Colors.gradients.sunset, Colors.gradients.success, Colors.gradients.purple, Colors.gradients.candy, Colors.gradients.info, Colors.gradients.warning];

export const VotingScreen: React.FC = () => {
  const {
    candidates,
    positions,
    castVote,
    electionState,
    verifyStudentId,
    resetSecurityVerification,
    otpRequired,
    requestVoteOtp,
    verifyVoteOtp,
    getVoteOtpRequest,
    faceRequired,
    verifyStudentFace,
    isFaceVerified,
  } = useVoting();
  const { user } = useAuth();
  const [votedPositions, setVotedPositions] = useState<Position[]>([]);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [entryVerified, setEntryVerified] = useState(false);
  const [showVoteConfirm, setShowVoteConfirm] = useState(false);
  const [confirmVoteData, setConfirmVoteData] = useState<{ candidateId: string; position: Position; positionTitle: string; candidateName: string } | null>(null);
  const entryFlowStartedRef = useRef(false);

  React.useEffect(() => { loadVotedPositions(); }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.studentId) {
        return () => undefined;
      }

      if (entryFlowStartedRef.current) {
        return () => undefined;
      }

      entryFlowStartedRef.current = true;

      setEntryVerified(false);
      setShowVoteConfirm(false);
      setShowFaceScanner(false);
      setShowOtpModal(false);
      setOtpCode('');
      resetSecurityVerification(user.studentId);
      setShowScanner(true);

      return () => {
        entryFlowStartedRef.current = false;
      };
    }, [user?.studentId])
  );

  const loadVotedPositions = async () => {
    if (user) {
      try {
        const d = await Storage.getItem(`voter_${user.studentId}`);
        if (d) { const p = JSON.parse(d); setVotedPositions(p.votedPositions || []); }
      } catch (e) { console.error(e); }
    }
  };

  const openVoteConfirm = (candidateId: string, position: Position) => {
    const positionTitle = positions.find(p => p.id === position)?.titleBn || '';
    const candidateName = candidates.find(c => c.id === candidateId)?.name || 'এই প্রার্থী';
    setConfirmVoteData({ candidateId, position, positionTitle, candidateName });
    setShowVoteConfirm(true);
  };

  const closeVoteConfirm = () => {
    setShowVoteConfirm(false);
    setConfirmVoteData(null);
  };

  const confirmVote = () => {
    if (!confirmVoteData) return;
    const { candidateId, position } = confirmVoteData;
    closeVoteConfirm();
    submitVote(candidateId, position);
  };

  const openOtpModalForEntry = () => {
    const phoneNumber = user?.phoneNumber || '';
    if (!phoneNumber.trim()) {
      showAlert('OTP পাওয়া যায়নি', 'এই ভোটারের phone number অ্যাডমিন সেট করেনি।');
      return;
    }
    setOtpCode('');
    setShowOtpModal(true);
  };

  const handleSelect = async (candidateId: string, position: Position) => {
    if (votedPositions.includes(position)) { showAlert('ভোট দেওয়া হয়েছে', 'আপনি এই পদে ইতিমধ্যে ভোট দিয়েছেন।'); return; }
    if (!entryVerified) {
      showAlert('যাচাই বাকি', 'Vote Din এ প্রবেশের verification সম্পন্ন করুন (QR + OTP)।');
      return;
    }
    openVoteConfirm(candidateId, position);
  };

  const handleRequestOtp = async () => {
    const studentId = user?.studentId || '';
    const phoneNumber = user?.phoneNumber || '';
    if (!phoneNumber.trim()) {
      showAlert('OTP পাওয়া যায়নি', 'এই ভোটারের phone number অ্যাডমিন সেট করেনি।');
      return;
    }

    setIsSendingOtp(true);
    const ok = await requestVoteOtp(studentId, phoneNumber.trim());
    setIsSendingOtp(false);

    if (!ok) {
      showAlert('Request ব্যর্থ', 'OTP request পাঠানো যায়নি। আবার চেষ্টা করুন।');
      return;
    }

    showAlert('Request পাঠানো হয়েছে', 'অ্যাডমিন approve করে SMS-এ OTP পাঠাবে।');
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      showAlert('OTP দিন', 'অ্যাডমিন পাঠানো OTP লিখুন।');
      return;
    }
    const studentId = user?.studentId || '';
    const request = getVoteOtpRequest(studentId);
    if (!request || (request.status !== 'approved' && request.status !== 'sent')) {
      showAlert('OTP এখনো ready না', 'আগে OTP request পাঠান এবং admin approval এর জন্য অপেক্ষা করুন।');
      return;
    }
    setIsVerifyingOtp(true);
    const ok = await verifyVoteOtp(studentId, otpCode.trim());
    setIsVerifyingOtp(false);
    if (!ok) {
      showAlert('OTP ভুল', 'OTP verify হয়নি। আবার চেষ্টা করুন।');
      return;
    }
    setShowOtpModal(false);
    setEntryVerified(true);
    showAlert('সফল', 'QR + OTP verification সম্পন্ন হয়েছে। এখন সব পজিশনে ভোট দিতে পারবেন।');
  };

  const handleScanSuccess = async (scannedData: string) => {
    setShowScanner(false);
    try {
      const ok = await verifyStudentId(scannedData, user?.studentId || '');
      if (ok) {
        if (faceRequired && !isFaceVerified(user?.studentId || '')) {
          setShowFaceScanner(true);
        } else if (otpRequired) {
          openOtpModalForEntry();
        } else {
          setEntryVerified(true);
          showAlert('সফল', 'QR verification সম্পন্ন হয়েছে। এখন ভোট দিতে পারবেন।');
        }
      } else { showAlert('যাচাইকরণ ব্যর্থ', 'আইডি কার্ড যাচাই করা যায়নি।'); }
    } catch { showAlert('ত্রুটি', 'আইডি যাচাইয়ে সমস্যা হয়েছে'); }
  };

  const handleFaceVerification = async (faceCode: string): Promise<boolean> => {
    const ok = await verifyStudentFace(user?.studentId || '', faceCode);
    if (ok) {
      setShowFaceScanner(false);
      if (otpRequired) {
        openOtpModalForEntry();
      } else {
        setEntryVerified(true);
        showAlert('সফল', 'Face verification সম্পন্ন হয়েছে। এখন ভোট দিতে পারবেন।');
      }
    }
    return ok;
  };

  const submitVote = async (candidateId: string, position: Position) => {
    setIsVoting(true);
    try {
      const ok = await castVote(candidateId, position);
      if (ok) {
        setVotedPositions([...votedPositions, position]);
        showAlert('সফল! 🎉', 'আপনার ভোট সফলভাবে জমা হয়েছে।');
        if (currentPositionIndex < positions.length - 1) setCurrentPositionIndex(currentPositionIndex + 1);
      } else showAlert('ব্যর্থ', 'ভোট দিতে সমস্যা হয়েছে।');
    } catch { showAlert('ত্রুটি', 'ভোট দিতে সমস্যা হয়েছে।'); }
    finally { setIsVoting(false); }
  };

  if (!electionState.isActive) {
    return (
      <LinearGradient colors={Colors.gradients.dark} style={styles.center}>
        <Text style={{ fontSize: 70, marginBottom: 20 }}>🗳️</Text>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>নির্বাচন বর্তমানে বন্ধ</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>Election is currently closed</Text>
      </LinearGradient>
    );
  }

  const curPos = positions[currentPositionIndex];
  const curCands = candidates.filter(c => c.position === curPos.id);
  const otpRequest = getVoteOtpRequest(user?.studentId || '');
  const otpStatus = otpRequest?.status || 'not_requested';
  const otpStatusText = otpStatus === 'pending'
    ? 'OTP request pending (admin approval অপেক্ষায়)।'
    : otpStatus === 'approved'
      ? 'OTP approved. Admin থেকে SMS এসেছে, OTP লিখুন।'
      : otpStatus === 'sent'
        ? 'OTP SMS পাঠানো হয়েছে। OTP লিখুন।'
        : otpStatus === 'rejected'
          ? 'শেষ request reject হয়েছে। নতুন request পাঠান।'
          : otpStatus === 'expired'
            ? 'OTP expire হয়েছে। নতুন request পাঠান।'
            : otpStatus === 'verified'
              ? 'এই OTP already used. নতুন vote-এর জন্য request দিন।'
              : 'OTP request পাঠাতে Request OTP চাপুন।';

  return (
    <View style={styles.container}>
      {/* Tab Nav */}
      <LinearGradient colors={Colors.gradients.dark} style={styles.nav}>
        <View style={styles.miniProg}>
          <Text style={styles.miniProgText}>{votedPositions.length}/{positions.length} পদে ভোট সম্পন্ন</Text>
          <View style={styles.miniProgBg}>
            <View style={[styles.miniProgFill, { width: `${(votedPositions.length / positions.length) * 100}%` }]} />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
          {positions.map((pos, i) => {
            const active = i === currentPositionIndex;
            const voted = votedPositions.includes(pos.id);
            return (
              <TouchableOpacity key={pos.id} onPress={() => setCurrentPositionIndex(i)} activeOpacity={0.8}>
                {active ? (
                  <LinearGradient colors={POS_COLORS[i % POS_COLORS.length]} style={[styles.tab, styles.tabActive]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={[styles.tabText, { color: '#fff' }]}>{pos.id}</Text>
                    {voted && <Text style={styles.check}>✓</Text>}
                  </LinearGradient>
                ) : (
                  <View style={[styles.tab, voted && { backgroundColor: Colors.successDark }]}>
                    <Text style={[styles.tabText, voted && { color: '#fff' }]}>{pos.id}</Text>
                    {voted && <Text style={styles.check}>✓</Text>}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* Position Header */}
      <LinearGradient colors={POS_COLORS[currentPositionIndex % POS_COLORS.length]} style={styles.posHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={styles.posTitle}>{curPos.titleBn}</Text>
        <Text style={styles.posSub}>{curPos.title}</Text>
        <Text style={styles.posDesc}>{curPos.description}</Text>
        <Text style={styles.candCount}>👥 {curCands.length} জন প্রার্থী</Text>
      </LinearGradient>

      {/* Candidates */}
      <ScrollView style={styles.candList} showsVerticalScrollIndicator={false}>
        {curCands.map(c => {
          const voted = votedPositions.includes(c.position);
          return (
            <TouchableOpacity key={c.id} style={[styles.candCard, voted && styles.candDisabled]} onPress={() => handleSelect(c.id, c.position)} disabled={voted || isVoting} activeOpacity={0.85}>
              <View style={styles.candRow}>
                <LinearGradient colors={POS_COLORS[currentPositionIndex % POS_COLORS.length]} style={styles.candSymbol}>
                  <Text style={{ fontSize: 28 }}>{c.symbol}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.candName}>{c.name}</Text>
                  <Text style={styles.candDept}>{c.department}</Text>
                  <Text style={styles.candSession}>{c.session}</Text>
                </View>
                {voted ? (
                  <LinearGradient colors={Colors.gradients.success} style={styles.votedBadge}>
                    <Text style={styles.votedText}>✓ ভোট দেওয়া হয়েছে</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.voteBtn}>
                    <Text style={styles.voteBtnText}>ভোট দিন</Text>
                  </View>
                )}
              </View>
              <Text style={styles.manifesto} numberOfLines={2}>📜 {c.manifesto}</Text>
            </TouchableOpacity>
          );
        })}
        {curCands.length === 0 && <View style={{ alignItems: 'center', paddingVertical: 50 }}><Text style={{ fontSize: 50 }}>📭</Text><Text style={{ fontSize: 16, color: Colors.textMuted, marginTop: 12 }}>এই পদের জন্য কোনো প্রার্থী নেই</Text></View>}
        <View style={{ height: 30 }} />
      </ScrollView>

      <Modal visible={showVoteConfirm} animationType="fade" transparent onRequestClose={closeVoteConfirm}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <LinearGradient colors={Colors.gradients.ocean} style={styles.confirmHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.confirmIcon}>🗳️</Text>
              <Text style={styles.confirmTitle}>ভোট নিশ্চিত করুন</Text>
            </LinearGradient>
            <View style={styles.confirmBody}>
              <Text style={styles.confirmText}>
                আপনি কি {confirmVoteData?.positionTitle} পদের জন্য <Text style={styles.confirmCandidateName}>{confirmVoteData?.candidateName}</Text> কে ভোট দিতে চান?
              </Text>
              <View style={styles.confirmBtnRow}>
                <TouchableOpacity style={styles.confirmCancelBtn} onPress={closeVoteConfirm} activeOpacity={0.85}>
                  <Text style={styles.confirmCancelText}>না</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmYesBtn} onPress={confirmVote} activeOpacity={0.85}>
                  <Text style={styles.confirmYesText}>হ্যাঁ, ভোট দিন</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <IDCardScanner visible={showScanner} onClose={() => { setShowScanner(false); }} onScanSuccess={handleScanSuccess} expectedId={user?.studentId || ''} />
      <FaceScanner
        visible={showFaceScanner}
        onClose={() => { setShowFaceScanner(false); }}
        onVerify={handleFaceVerification}
        studentId={user?.studentId || ''}
      />

      <Modal visible={showOtpModal} animationType="fade" transparent onRequestClose={() => setShowOtpModal(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <LinearGradient colors={Colors.gradients.warning} style={styles.confirmHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.confirmIcon}>📱</Text>
              <Text style={styles.confirmTitle}>OTP Verification</Text>
            </LinearGradient>
            <View style={styles.confirmBody}>
              <Text style={styles.confirmText}>অ্যাডমিন আপনার নম্বরে যে OTP পাঠিয়েছে, সেটা দিন।</Text>
              <Text style={styles.otpStatusText}>{otpStatusText}</Text>
              <TextInput
                style={styles.otpInput}
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                placeholder="6-digit OTP"
                placeholderTextColor={Colors.textMuted}
                maxLength={8}
              />
              <View style={styles.confirmBtnRow}>
                <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => { setShowOtpModal(false); }} activeOpacity={0.85}>
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.requestBtn} onPress={handleRequestOtp} activeOpacity={0.85} disabled={isSendingOtp || isVerifyingOtp}>
                  {isSendingOtp
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.requestBtnText}>{otpStatus === 'pending' ? 'Request Again' : 'Request OTP'}</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyOtp} activeOpacity={0.85} disabled={isVerifyingOtp || isSendingOtp}>
                  {isVerifyingOtp || isSendingOtp
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.verifyBtnText}>Verify OTP</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {!entryVerified && (
        <View style={styles.entryGateBanner}>
          <Text style={styles.entryGateText}>প্রথমে QR + OTP verification সম্পন্ন করুন</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  nav: { paddingTop: 12, paddingBottom: 12 },
  miniProg: { paddingHorizontal: 16, marginBottom: 10 },
  miniProgText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  miniProgBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' },
  miniProgFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 2 },
  tab: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', flexDirection: 'row', alignItems: 'center' },
  tabActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  tabText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 'bold' },
  check: { color: '#fff', fontSize: 12, marginLeft: 6, fontWeight: 'bold' },
  posHeader: { padding: 20, alignItems: 'center' },
  posTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
  posSub: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  posDesc: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8, textAlign: 'center' },
  candCount: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 10, fontWeight: '600' },
  candList: { flex: 1, padding: 16 },
  candCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  candDisabled: { opacity: 0.6, backgroundColor: '#f8f8f8' },
  candRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  candSymbol: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  candName: { fontSize: 17, fontWeight: 'bold', color: Colors.textPrimary },
  candDept: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  candSession: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  votedBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  votedText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  voteBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 },
  voteBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  manifesto: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 20 },

  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.52)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  confirmCard: { width: '100%', maxWidth: 430, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  confirmHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.18)' },
  confirmIcon: { fontSize: 26 },
  confirmTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  confirmBody: { padding: 22, backgroundColor: '#f8f9ff' },
  confirmText: { fontSize: 16, lineHeight: 24, color: Colors.textPrimary, marginBottom: 18 },
  confirmCandidateName: { fontWeight: '900', color: Colors.textPrimary },
  confirmBtnRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  confirmCancelBtn: { flex: 1, minWidth: 110, marginHorizontal: 0, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 5 },
  confirmCancelText: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  confirmYesBtn: { flex: 1, minWidth: 110, marginHorizontal: 0, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 8 },
  confirmYesText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  requestBtn: { flex: 1, minWidth: 110, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: Colors.gradients.ocean[0], borderColor: Colors.gradients.ocean[1], borderWidth: 0, shadowColor: Colors.gradients.ocean[0], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 7 },
  requestBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  verifyBtn: { flex: 1, minWidth: 110, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: Colors.gradients.success[0], borderColor: Colors.gradients.success[1], borderWidth: 0, shadowColor: Colors.gradients.success[0], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 7 },
  verifyBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  otpInput: {
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.12)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 22,
    letterSpacing: 18,
    backgroundColor: '#fff',
    marginBottom: 16,
    color: Colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  otpStatusText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(15,23,42,0.04)',
    borderRadius: 14,
  },
  entryGateBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(17,24,39,0.9)',
  },
  entryGateText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
});
