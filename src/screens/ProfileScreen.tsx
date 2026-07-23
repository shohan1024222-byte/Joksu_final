import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, useVoting } from '../context';
import { IDCardScanner } from '../components/IDCardScanner';
import { Colors, BorderRadius, Spacing } from '../theme';

const { width } = Dimensions.get('window');

const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed && buttons[1]?.onPress) buttons[1].onPress();
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

type SettingsAction = 'changeName' | 'changePassword' | 'changePhone' | null;

export const ProfileScreen: React.FC = () => {
  const { user, logout, isAdmin, updateUserName, updateUserPhoneNumber, updatePassword } = useAuth();
  const { positions, verifyStudentId } = useVoting();

  const [showScanner, setShowScanner] = useState(false);
  const [pendingAction, setPendingAction] = useState<SettingsAction>(null);
  const [isVerified, setIsVerified] = useState(false);

  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState('');

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogout = () => {
    showAlert(
      'লগআউট',
      'আপনি কি নিশ্চিত যে আপনি লগআউট করতে চান?',
      [
        { text: 'না', style: 'cancel' },
        { text: 'হ্যাঁ', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const startAction = (action: SettingsAction) => {
    setPendingAction(action);
    setIsVerified(false);
    setShowScanner(true);
  };

  const handleScanSuccess = async (scannedData: string) => {
    setShowScanner(false);
    try {
      const verified = await verifyStudentId(scannedData, user?.studentId || '');
      if (verified) {
        setIsVerified(true);
        if (pendingAction === 'changeName') {
          setNewName(user?.name || '');
          setShowNameModal(true);
        } else if (pendingAction === 'changePhone') {
          setNewPhoneNumber(user?.phoneNumber || '');
          setShowPhoneModal(true);
        } else if (pendingAction === 'changePassword') {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setShowPasswordModal(true);
        }
      } else {
        showAlert('যাচাইকরণ ব্যর্থ', 'আইডি কার্ড যাচাই করা যায়নি।');
      }
    } catch (error) {
      showAlert('ত্রুটি', 'আইডি যাচাইকরণে সমস্যা হয়েছে।');
    }
    setPendingAction(null);
  };

  const handleNameChange = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return showAlert('ত্রুটি', 'নাম খালি রাখা যাবে না');
    if (trimmed.length < 2) return showAlert('ত্রুটি', 'নাম কমপক্ষে ২ অক্ষরের হতে হবে');
    const success = await updateUserName(trimmed);
    if (success) {
      setShowNameModal(false);
      setIsVerified(false);
      showAlert('সফল! ✅', 'আপনার নাম সফলভাবে পরিবর্তন করা হয়েছে।');
    } else {
      showAlert('ব্যর্থ', 'নাম পরিবর্তন করতে সমস্যা হয়েছে।');
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword.trim()) return showAlert('ত্রুটি', 'বর্তমান পাসওয়ার্ড দিন');
    if (!newPassword.trim()) return showAlert('ত্রুটি', 'নতুন পাসওয়ার্ড দিন');
    if (newPassword.length < 4) return showAlert('ত্রুটি', 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে');
    if (newPassword !== confirmPassword) return showAlert('ত্রুটি', 'নতুন পাসওয়ার্ড মিলছে না।');
    const success = await updatePassword(currentPassword, newPassword);
    if (success) {
      setShowPasswordModal(false);
      setIsVerified(false);
      showAlert('সফল! ✅', 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।');
    } else {
      showAlert('ব্যর্থ', 'বর্তমান পাসওয়ার্ড ভুল।');
    }
  };

  const handlePhoneNumberChange = async () => {
    const trimmedPhone = newPhoneNumber.trim();
    if (!trimmedPhone) return showAlert('ত্রুটি', 'Phone number খালি রাখা যাবে না');
    if (trimmedPhone.length < 10) return showAlert('ত্রুটি', 'সঠিক phone number দিন');

    const success = await updateUserPhoneNumber(trimmedPhone);
    if (success) {
      setShowPhoneModal(false);
      setIsVerified(false);
      showAlert('সফল! ✅', 'আপনার phone number সফলভাবে আপডেট হয়েছে। এখন admin এই নম্বরে OTP পাঠাতে পারবে।');
    } else {
      showAlert('ব্যর্থ', 'Phone number আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  if (!user) {
    return (
      <View style={styles.noUserContainer}>
        <Text style={styles.noUserText}>User not found</Text>
      </View>
    );
  }

  const votedCount = user.votedPositions?.length || 0;
  const totalPositions = positions.length;
  const votingPercent = totalPositions > 0 ? Math.round((votedCount / totalPositions) * 100) : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <LinearGradient
        colors={Colors.gradients.dark}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />

        <LinearGradient
          colors={isAdmin ? Colors.gradients.purple : Colors.gradients.aurora}
          style={styles.avatarGradient}
        >
          <Text style={styles.avatarText}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userRole}>
          {isAdmin ? 'অ্যাডমিনিস্ট্রেটর' : 'ছাত্র/ছাত্রী'}
        </Text>
        {isAdmin && (
          <LinearGradient
            colors={Colors.gradients.gold}
            style={styles.adminBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.adminBadgeText}>⭐ ADMIN</Text>
          </LinearGradient>
        )}
      </LinearGradient>

      {/* User Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 ব্যক্তিগত তথ্য</Text>
        <View style={styles.infoCard}>
          {[
            { icon: '📛', label: 'নাম', value: user.name },
            { icon: '🎓', label: 'Student ID', value: user.studentId },
            { icon: '🏛️', label: 'বিভাগ', value: user.department },
            { icon: '📅', label: 'সেশন', value: user.session },
          ].map((item, idx) => (
            <View key={idx} style={[styles.infoRow, idx < 3 && styles.infoRowBorder]}>
              <View style={styles.infoLabelRow}>
                <Text style={styles.infoIcon}>{item.icon}</Text>
                <Text style={styles.infoLabel}>{item.label}</Text>
              </View>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Voting Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗳️ ভোটিং স্ট্যাটাস</Text>
        <View style={styles.votingCard}>
          <View style={styles.votingHeader}>
            <Text style={styles.votingTitle}>
              {user.hasVoted ? 'ভোট সম্পন্ন হয়েছে' : 'ভোট বাকি আছে'}
            </Text>
            <LinearGradient
              colors={user.hasVoted ? Colors.gradients.success : Colors.gradients.warning}
              style={styles.votingStatusBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.votingStatusText}>
                {user.hasVoted ? '✓ সম্পন্ন' : '⏳ বাকি'}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>ভোট প্রদান: {votedCount} / {totalPositions}</Text>
              <Text style={styles.progressPercent}>{votingPercent}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={Colors.gradients.success}
                style={[styles.progressBarFill, { width: `${Math.max(votingPercent, 2)}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>

          {user.votedPositions && user.votedPositions.length > 0 && (
            <View style={styles.votedPositionsSection}>
              <Text style={styles.votedPositionsTitle}>ভোট দেওয়া পদসমূহ:</Text>
              {user.votedPositions.map((positionId) => {
                const position = positions.find(p => p.id === positionId);
                return (
                  <View key={positionId} style={styles.votedPositionItem}>
                    <Text style={styles.votedCheckmark}>✅</Text>
                    <Text style={styles.votedPositionText}>{position?.titleBn}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ সেটিংস</Text>

        {[
          {
            icon: '✏️',
            title: 'নাম পরিবর্তন',
            subtitle: 'আইডি কার্ড স্ক্যান করে নাম পরিবর্তন করুন',
            gradient: Colors.gradients.ocean,
            onPress: () => startAction('changeName'),
          },
          {
            icon: '📱',
            title: 'ফোন নাম্বার আপডেট',
            subtitle: 'আইডি কার্ড স্ক্যান করে OTP-এর জন্য ফোন নাম্বার সেট করুন',
            gradient: Colors.gradients.info,
            onPress: () => startAction('changePhone'),
          },
          {
            icon: '🔒',
            title: 'পাসওয়ার্ড পরিবর্তন',
            subtitle: 'আইডি কার্ড স্ক্যান করে পাসওয়ার্ড পরিবর্তন করুন',
            gradient: Colors.gradients.sunset,
            onPress: () => startAction('changePassword'),
          },
          {
            icon: '📊',
            title: 'ভোটিং হিস্টরি',
            subtitle: 'আপনার ভোটদানের ইতিহাস দেখুন',
            gradient: Colors.gradients.success,
            onPress: () => showAlert('Info', 'ভোটিং হিস্টরি শীঘ্রই আসছে'),
          },
        ].map((item, idx) => (
          <TouchableOpacity key={idx} style={styles.settingItem} onPress={item.onPress} activeOpacity={0.85}>
            <LinearGradient
              colors={item.gradient}
              style={styles.settingIconBg}
            >
              <Text style={styles.settingIcon}>{item.icon}</Text>
            </LinearGradient>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ অ্যাপ তথ্য</Text>
        <View style={styles.appInfoCard}>
          <LinearGradient
            colors={Colors.gradients.aurora}
            style={styles.appIconGradient}
          >
            <Text style={styles.appIconEmoji}>🗳️</Text>
          </LinearGradient>
          <Text style={styles.appName}>JOKSHU Voting App</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            জগন্নাথ বিশ্ববিদ্যালয় কেন্দ্রীয় ছাত্র সংসদ নির্বাচন ২০২৬
          </Text>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.logoutSection}>
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.85}>
          <LinearGradient
            colors={Colors.gradients.danger}
            style={styles.logoutButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Jagannath University</Text>
        <Text style={styles.footerSubtext}>Dhaka, Bangladesh</Text>
      </View>

      {/* ID Card Scanner */}
      <IDCardScanner
        visible={showScanner}
        onClose={() => { setShowScanner(false); setPendingAction(null); }}
        onScanSuccess={handleScanSuccess}
        expectedId={user.studentId}
      />

      {/* Change Name Modal */}
      <Modal visible={showNameModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={Colors.gradients.ocean}
              style={styles.modalGradientHeader}
            >
              <Text style={styles.modalHeaderIcon}>✏️</Text>
              <Text style={styles.modalTitle}>নাম পরিবর্তন</Text>
            </LinearGradient>
            <View style={styles.modalBody}>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✅ আইডি যাচাই সম্পন্ন</Text>
              </View>
              <Text style={styles.modalLabel}>নতুন নাম:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="আপনার নতুন নাম লিখুন"
                placeholderTextColor={Colors.textMuted}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => { setShowNameModal(false); setIsVerified(false); }}
                >
                  <Text style={styles.modalCancelText}>বাতিল</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNameChange} activeOpacity={0.8}>
                  <LinearGradient
                    colors={Colors.gradients.ocean}
                    style={styles.modalSaveButton}
                  >
                    <Text style={styles.modalSaveText}>সংরক্ষণ করুন</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={Colors.gradients.sunset}
              style={styles.modalGradientHeader}
            >
              <Text style={styles.modalHeaderIcon}>🔒</Text>
              <Text style={styles.modalTitle}>পাসওয়ার্ড পরিবর্তন</Text>
            </LinearGradient>
            <View style={styles.modalBody}>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✅ আইডি যাচাই সম্পন্ন</Text>
              </View>

              <Text style={styles.modalLabel}>বর্তমান পাসওয়ার্ড:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="বর্তমান পাসওয়ার্ড"
                placeholderTextColor={Colors.textMuted}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoFocus
              />
              <Text style={styles.modalLabel}>নতুন পাসওয়ার্ড:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="নতুন পাসওয়ার্ড"
                placeholderTextColor={Colors.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <Text style={styles.modalLabel}>নিশ্চিত করুন:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="নতুন পাসওয়ার্ড আবার লিখুন"
                placeholderTextColor={Colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => { setShowPasswordModal(false); setIsVerified(false); }}
                >
                  <Text style={styles.modalCancelText}>বাতিল</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePasswordChange} activeOpacity={0.8}>
                  <LinearGradient
                    colors={Colors.gradients.sunset}
                    style={styles.modalSaveButton}
                  >
                    <Text style={styles.modalSaveText}>পরিবর্তন করুন</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Phone Number Modal */}
      <Modal visible={showPhoneModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={Colors.gradients.info}
              style={styles.modalGradientHeader}
            >
              <Text style={styles.modalHeaderIcon}>📱</Text>
              <Text style={styles.modalTitle}>ফোন নাম্বার আপডেট</Text>
            </LinearGradient>
            <View style={styles.modalBody}>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✅ আইডি যাচাই সম্পন্ন</Text>
              </View>

              <Text style={styles.modalLabel}>ফোন নাম্বার:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="যেমন: +8801XXXXXXXXX"
                placeholderTextColor={Colors.textMuted}
                value={newPhoneNumber}
                onChangeText={setNewPhoneNumber}
                keyboardType="phone-pad"
                autoFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => { setShowPhoneModal(false); setIsVerified(false); }}
                >
                  <Text style={styles.modalCancelText}>বাতিল</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePhoneNumberChange} activeOpacity={0.8}>
                  <LinearGradient
                    colors={Colors.gradients.info}
                    style={styles.modalSaveButton}
                  >
                    <Text style={styles.modalSaveText}>সংরক্ষণ করুন</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  noUserContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noUserText: { fontSize: 18, color: Colors.textMuted },
  // Header
  header: {
    padding: 30,
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(108, 99, 255, 0.08)', top: -60, right: -40,
  },
  headerDecor2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(0, 210, 255, 0.06)', bottom: -20, left: -30,
  },
  avatarGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarText: { fontSize: 36, fontWeight: '900', color: Colors.white },
  userName: { fontSize: 24, fontWeight: '900', color: Colors.white, marginBottom: 4 },
  userRole: { fontSize: 15, color: 'rgba(255,255,255,0.7)' },
  adminBadge: {
    paddingHorizontal: 18, paddingVertical: 7, borderRadius: BorderRadius.full, marginTop: 10,
  },
  adminBadgeText: { color: '#1A1D26', fontSize: 13, fontWeight: '800' },
  // Section
  section: { marginHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 14 },
  // Info Card
  infoCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  infoLabelRow: { flexDirection: 'row', alignItems: 'center' },
  infoIcon: { fontSize: 18, marginRight: 10 },
  infoLabel: { fontSize: 15, color: Colors.textSecondary },
  infoValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  // Voting Card
  votingCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  votingHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18,
  },
  votingTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  votingStatusBadge: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full,
  },
  votingStatusText: { color: Colors.white, fontSize: 12, fontWeight: 'bold' },
  progressSection: {},
  progressRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8,
  },
  progressLabel: { fontSize: 14, color: Colors.textSecondary },
  progressPercent: { fontSize: 14, fontWeight: 'bold', color: Colors.success },
  progressBarBg: {
    height: 8, backgroundColor: Colors.background, borderRadius: 4, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 4 },
  votedPositionsSection: { marginTop: 16 },
  votedPositionsTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  votedPositionItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  votedCheckmark: { fontSize: 14, marginRight: 8 },
  votedPositionText: { fontSize: 14, color: Colors.textSecondary },
  // Settings
  settingItem: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: 16,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  settingIconBg: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  settingIcon: { fontSize: 20 },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  settingSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  settingArrow: { fontSize: 22, color: Colors.textMuted, fontWeight: 'bold' },
  // App info
  appInfoCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: 24,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  appIconGradient: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  appIconEmoji: { fontSize: 30 },
  appName: { fontSize: 19, fontWeight: '800', color: Colors.primary },
  appVersion: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  appDescription: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 10 },
  // Logout
  logoutSection: { margin: 20 },
  logoutButton: {
    borderRadius: BorderRadius.lg, padding: 18, alignItems: 'center',
    shadowColor: Colors.danger, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  logoutButtonText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  // Footer
  footer: { alignItems: 'center', paddingVertical: 30 },
  footerText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  footerSubtext: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center',
    alignItems: 'center', padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    width: '100%', maxWidth: 400, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 12,
  },
  modalGradientHeader: {
    padding: 20, alignItems: 'center',
  },
  modalHeaderIcon: { fontSize: 28, marginBottom: 6 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  modalBody: { padding: 24 },
  verifiedBadge: { alignItems: 'center', marginBottom: 18 },
  verifiedText: { fontSize: 14, color: Colors.success, fontWeight: '600' },
  modalLabel: {
    fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6, marginTop: 12,
  },
  modalInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md,
    padding: 14, fontSize: 16, backgroundColor: Colors.background, color: Colors.textPrimary,
  },
  modalButtons: { flexDirection: 'row', marginTop: 24, gap: 12 },
  modalCancelButton: {
    flex: 1, padding: 14, borderRadius: BorderRadius.md,
    borderWidth: 2, borderColor: Colors.border, alignItems: 'center',
  },
  modalCancelText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  modalSaveButton: {
    flex: 1, padding: 14, borderRadius: BorderRadius.md, alignItems: 'center',
  },
  modalSaveText: { fontSize: 16, fontWeight: 'bold', color: Colors.white },
});
