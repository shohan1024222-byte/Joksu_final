import React, { useEffect, useState } from 'react';
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
  Switch,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useVoting, useAuth } from '../context';
import { Candidate, Position } from '../types';
import { CameraFaceCapture } from '../components';
import { FirebaseStorage } from '../firebase';
import { gpaCourses, GpaCourse } from '../data/gpaCourses';
import { gpaResults, StudentResult } from '../data/gpaResults';
import { loadGpaCourses, loadGpaResults, saveGpaCourses, saveGpaResults } from '../data/gpaStore';

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

type AdminTab = 'dashboard' | 'candidates' | 'add' | 'voters' | 'gpa';

const SYMBOLS = ['🌟', '🔥', '⚡', '🌙', '💫', '🎯', '🤝', '📢', '📣', '❤️', '🤲', '🎭', '🎨', '⚽', '🏅', '🌍', '📚', '📖', '🏆', '🌺', '🦁', '🐅', '🦅', '⭐'];

export const AdminScreen: React.FC = () => {
  const {
    electionState,
    candidates,
    positions,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    faceRequired,
    setFaceRequired,
    setStudentFace,
    clearStudentFace,
    getFaceEnrollmentStatus,
    otpRequired,
    otpRequests,
    setOtpRequired,
    approveVoteOtpRequest,
    markVoteOtpAsSent,
    rejectVoteOtpRequest,
    clearVoteOtpRequest,
  } = useVoting();
  const { isAdmin, registeredStudentsCount, addStudent, getRegisteredStudents, removeStudent, updateStudent, updateStudentPassword } = useAuth();

  // Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // GPA admin state
  const [gpaCoursesState, setGpaCoursesState] = useState<GpaCourse[]>(gpaCourses);
  const [gpaResultsState, setGpaResultsState] = useState<StudentResult[]>(gpaResults);
  const [gpaLoaded, setGpaLoaded] = useState(false);
  const [gpaSaving, setGpaSaving] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportJsonText, setExportJsonText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  const MENU_VISIBILITY_KEY = 'homeMenuVisibility';
  type MenuOptionKey =
    | 'voteNow'
    | 'candidates'
    | 'positions'
    | 'results'
    | 'profile'
    | 'gpaCheck'
    | 'gpaCalculate'
    | 'gpaRanking'
    | 'retakeImprove'
    | 'calculator'
    | 'bmiCalculator'
    | 'snakeGame';

  const MENU_LABELS: Record<MenuOptionKey, string> = {
    voteNow: 'ভোট দিন',
    candidates: 'প্রার্থী',
    positions: 'পদসমূহ',
    results: 'ফলাফল',
    profile: 'প্রোফাইল',
    gpaCheck: 'GPA Check',
    gpaCalculate: 'GPA Calculate',
    gpaRanking: 'GPA Ranking',
    retakeImprove: 'Retake/Improve',
    calculator: 'Calculator',
    bmiCalculator: 'BMI Calculator',
    snakeGame: 'Snake Game',
  };

  const defaultMenuVisibility: Record<MenuOptionKey, boolean> = {
    voteNow: true,
    candidates: true,
    positions: true,
    results: true,
    profile: true,
    gpaCheck: true,
    gpaCalculate: true,
    gpaRanking: true,
    retakeImprove: true,
    calculator: true,
    bmiCalculator: true,
    snakeGame: true,
  };
  const [menuVisibility, setMenuVisibility] = useState<Record<MenuOptionKey, boolean>>(defaultMenuVisibility);

  const loadMenuVisibility = async () => {
    try {
      const raw = await FirebaseStorage.getItem(MENU_VISIBILITY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<MenuOptionKey, boolean>>;
        setMenuVisibility({ ...defaultMenuVisibility, ...parsed });
      } else {
        setMenuVisibility(defaultMenuVisibility);
      }
    } catch (error) {
      console.warn('Failed to load menu visibility settings:', error);
      setMenuVisibility(defaultMenuVisibility);
    }
  };

  const saveMenuVisibility = async (nextVisibility: Record<MenuOptionKey, boolean>) => {
    try {
      setMenuVisibility(nextVisibility);
      await FirebaseStorage.setItem(MENU_VISIBILITY_KEY, JSON.stringify(nextVisibility));
    } catch (error) {
      console.warn('Failed to save menu visibility settings:', error);
    }
  };

  const handleToggleMenuVisibility = async (key: MenuOptionKey) => {
    const next = { ...menuVisibility, [key]: !menuVisibility[key] };
    await saveMenuVisibility(next);
  };

  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCredit, setCourseCredit] = useState('');
  const [editingCourse, setEditingCourse] = useState<GpaCourse | null>(null);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseCredit, setEditCourseCredit] = useState('');

  const [editingResult, setEditingResult] = useState<StudentResult | null>(null);
  const [showEditResultModal, setShowEditResultModal] = useState(false);
  const [resultId, setResultId] = useState('');
  const [resultName, setResultName] = useState('');
  const [resultSemesterGpa, setResultSemesterGpa] = useState('');
  const [resultCgpa, setResultCgpa] = useState('');
  const [resultGrades, setResultGrades] = useState<Record<string, string>>({});

  // Add student (voter) form
  const [voterStudentId, setVoterStudentId] = useState('');
  const [voterName, setVoterName] = useState('');
  const [voterPassword, setVoterPassword] = useState('');
  const [voterPhoneNumber, setVoterPhoneNumber] = useState('');
  const [voterDepartment, setVoterDepartment] = useState('');
  const [voterSession, setVoterSession] = useState('');
  const [registeredStudents, setRegisteredStudents] = useState<Array<{ studentId: string; name: string; phoneNumber?: string; department: string; session: string }>>([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [faceStatus, setFaceStatus] = useState<Record<string, boolean>>({});
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showCameraFaceCapture, setShowCameraFaceCapture] = useState(false);
  const [selectedVoterForFace, setSelectedVoterForFace] = useState<{ studentId: string; name: string } | null>(null);
  const [faceCode, setFaceCode] = useState('');
  const [confirmFaceCode, setConfirmFaceCode] = useState('');
  const [isSavingFace, setIsSavingFace] = useState(false);

  // Edit voter
  const [editingVoter, setEditingVoter] = useState<{ studentId: string; name: string; phoneNumber?: string; department: string; session: string } | null>(null);
  const [showEditVoterModal, setShowEditVoterModal] = useState(false);
  const [editVoterName, setEditVoterName] = useState('');
  const [editVoterPhoneNumber, setEditVoterPhoneNumber] = useState('');
  const [editVoterDepartment, setEditVoterDepartment] = useState('');
  const [editVoterSession, setEditVoterSession] = useState('');
  const [passwordResetStudentId, setPasswordResetStudentId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);

  useEffect(() => {
    loadMenuVisibility();
  }, []);

  // Add candidate form
  const [addName, setAddName] = useState('');
  const [addStudentId, setAddStudentId] = useState('');
  const [addPosition, setAddPosition] = useState<Position>('VP');
  const [addDepartment, setAddDepartment] = useState('');
  const [addSession, setAddSession] = useState('');
  const [addManifesto, setAddManifesto] = useState('');
  const [addSymbol, setAddSymbol] = useState('🌟');
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);

  // Edit candidate
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editSession, setEditSession] = useState('');
  const [editManifesto, setEditManifesto] = useState('');
  const [editSymbol, setEditSymbol] = useState('');
  const [editPosition, setEditPosition] = useState<Position>('VP');
  const [showEditPositionPicker, setShowEditPositionPicker] = useState(false);
  const [showEditSymbolPicker, setShowEditSymbolPicker] = useState(false);

  // Filter
  const [filterPosition, setFilterPosition] = useState<Position | 'ALL'>('ALL');

  if (!isAdmin) {
    return (
      <View style={styles.accessDenied}>
        <Text style={styles.accessDeniedIcon}>🚫</Text>
        <Text style={styles.accessDeniedTitle}>Access Denied</Text>
        <Text style={styles.accessDeniedText}>
          আপনার এই পেইজে প্রবেশ করার অনুমতি নেই।
        </Text>
      </View>
    );
  }

  const getTotalVotes = (): number => {
    return candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
  };

  // ---------- ADD CANDIDATE ----------
  const resetAddForm = () => {
    setAddName('');
    setAddStudentId('');
    setAddPosition('VP');
    setAddDepartment('');
    setAddSession('');
    setAddManifesto('');
    setAddSymbol('🌟');
  };

  const handleAddCandidate = async () => {
    if (!addName.trim()) return showAlert('ত্রুটি', 'প্রার্থীর নাম দিন');
    if (!addStudentId.trim()) return showAlert('ত্রুটি', 'Student ID দিন');
    if (!addDepartment.trim()) return showAlert('ত্রুটি', 'বিভাগের নাম দিন');
    if (!addSession.trim()) return showAlert('ত্রুটি', 'সেশন দিন');
    if (!addManifesto.trim()) return showAlert('ত্রুটি', 'ইশতেহার দিন');

    const success = await addCandidate({
      name: addName.trim(),
      studentId: addStudentId.trim(),
      position: addPosition,
      department: addDepartment.trim(),
      session: addSession.trim(),
      manifesto: addManifesto.trim(),
      symbol: addSymbol,
    });

    if (success) {
      showAlert('সফল! ✅', 'প্রার্থী সফলভাবে যোগ করা হয়েছে।');
      resetAddForm();
      setActiveTab('candidates');
    } else {
      showAlert('ব্যর্থ', 'প্রার্থী যোগ করতে সমস্যা হয়েছে।');
    }
  };

  // ---------- EDIT CANDIDATE ----------
  const openEditModal = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setEditName(candidate.name);
    setEditDepartment(candidate.department);
    setEditSession(candidate.session);
    setEditManifesto(candidate.manifesto);
    setEditSymbol(candidate.symbol);
    setEditPosition(candidate.position);
    setShowEditModal(true);
  };

  const handleUpdateCandidate = async () => {
    if (!editingCandidate) return;
    if (!editName.trim()) return showAlert('ত্রুটি', 'প্রার্থীর নাম দিন');

    const success = await updateCandidate(editingCandidate.id, {
      name: editName.trim(),
      department: editDepartment.trim(),
      session: editSession.trim(),
      manifesto: editManifesto.trim(),
      symbol: editSymbol,
      position: editPosition,
    });

    if (success) {
      showAlert('সফল! ✅', 'প্রার্থীর তথ্য আপডেট করা হয়েছে।');
      setShowEditModal(false);
      setEditingCandidate(null);
    } else {
      showAlert('ব্যর্থ', 'আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  // ---------- DELETE CANDIDATE ----------
  const handleDeleteCandidate = (candidate: Candidate) => {
    showAlert(
      'প্রার্থী মুছুন',
      `আপনি কি "${candidate.name}" কে মুছে ফেলতে চান?\n\nপদ: ${positions.find(p => p.id === candidate.position)?.titleBn}`,
      [
        { text: 'না', style: 'cancel' },
        {
          text: 'হ্যাঁ, মুছুন',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteCandidate(candidate.id);
            if (success) {
              showAlert('সফল!', 'প্রার্থী মুছে ফেলা হয়েছে।');
            } else {
              showAlert('ব্যর্থ', 'মুছতে সমস্যা হয়েছে।');
            }
          },
        },
      ]
    );
  };

  // ---------- RESET VOTES ----------
  const handleResetVotes = () => {
    showAlert(
      'ভোট রিসেট',
      'আপনি কি সত্যিই সব ভোট রিসেট করতে চান? এটি ফেরানো যাবে না।',
      [
        { text: 'না', style: 'cancel' },
        {
          text: 'হ্যাঁ, রিসেট',
          style: 'destructive',
          onPress: async () => {
            for (const c of candidates) {
              await updateCandidate(c.id, { votes: 0 });
            }
            showAlert('সফল!', 'সব ভোট রিসেট করা হয়েছে।');
          },
        },
      ]
    );
  };

  const filteredCandidates = filterPosition === 'ALL'
    ? candidates
    : candidates.filter(c => c.position === filterPosition);

  const normalizeNumberInput = (value: string) =>
    value.replace(/[০-৯]/g, (digit) => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));

  const parseNumber = (value: string): number => {
    const normalized = normalizeNumberInput(value).trim();
    if (!normalized || normalized === '.') return 0;
    const cleaned = normalized.replace(/[^0-9.]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const syncGradesWithCourses = (results: StudentResult[], courses: GpaCourse[]): StudentResult[] => {
    return results.map((student) => {
      const grades: Record<string, number> = {};
      courses.forEach((course) => {
        grades[course.code] = student.grades[course.code] ?? 0;
      });
      return { ...student, grades };
    });
  };

  const updateCourseCodeInResults = (results: StudentResult[], fromCode: string, toCode: string): StudentResult[] => {
    return results.map((student) => {
      const grades = { ...student.grades };
      const value = grades[fromCode] ?? 0;
      delete grades[fromCode];
      grades[toCode] = value;
      return { ...student, grades };
    });
  };

  const loadGpaData = async () => {
    const [storedCourses, storedResults] = await Promise.all([
      loadGpaCourses(),
      loadGpaResults(),
    ]);
    setGpaCoursesState(storedCourses);
    setGpaResultsState(storedResults);
    setGpaLoaded(true);
  };

  const persistGpaData = async (courses: GpaCourse[], results: StudentResult[]) => {
    setGpaSaving(true);
    await Promise.all([
      saveGpaCourses(courses),
      saveGpaResults(results),
    ]);
    setGpaSaving(false);
  };

  // Export / Import handlers
  const handleExport = () => {
    const payload = { courses: gpaCoursesState, results: gpaResultsState };
    setExportJsonText(JSON.stringify(payload, null, 2));
    setShowExportModal(true);
  };

  const handleImport = async () => {
    if (!importJsonText.trim()) return showAlert('ত্রুটি', 'কোনো JSON দিয়েছেন না');
    try {
      const parsed = JSON.parse(importJsonText);
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid payload');
      const incomingCourses = Array.isArray(parsed.courses) ? parsed.courses : null;
      const incomingResults = Array.isArray(parsed.results) ? parsed.results : null;
      if (!incomingCourses || !incomingResults) throw new Error('Missing courses or results array');

      // Basic validation
      const courses: GpaCourse[] = incomingCourses.map((c: any) => ({ code: String(c.code), title: String(c.title), credit: Number(c.credit || 0) }));
      const results: StudentResult[] = incomingResults.map((r: any) => ({
        id: String(r.id),
        name: String(r.name),
        grades: r.grades || {},
        semesterGpa: Number(r.semesterGpa || 0),
        cgpa: Number(r.cgpa || 0),
      }));

      const synced = syncGradesWithCourses(results, courses);
      setGpaCoursesState(courses);
      setGpaResultsState(synced);
      await persistGpaData(courses, synced);
      setShowImportModal(false);
      showAlert('সফল ✅', 'Import সফল হয়েছে এবং সেভ করা হয়েছে।');
    } catch (error) {
      console.error('Import error:', error);
      showAlert('ত্রুটি', 'JSON parse/validation error: ' + (error as any).message);
    }
  };

  // ---------- ADD STUDENT (VOTER) ----------
  const loadFaceStatus = async (studentIds: string[]) => {
    const status = await getFaceEnrollmentStatus(studentIds);
    setFaceStatus(status);
  };

  const loadStudents = async () => {
    const students = await getRegisteredStudents();
    setRegisteredStudents(students);
    setStudentsLoaded(true);
    await loadFaceStatus(students.map((student) => student.studentId));
  };

  React.useEffect(() => {
    loadStudents();
  }, []);

  React.useEffect(() => {
    if (activeTab === 'voters' && !studentsLoaded) {
      loadStudents();
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab === 'gpa' && !gpaLoaded) {
      loadGpaData();
    }
  }, [activeTab, gpaLoaded]);

  const resetVoterForm = () => {
    setVoterStudentId('');
    setVoterName('');
    setVoterPassword('');
    setVoterPhoneNumber('');
    setVoterDepartment('');
    setVoterSession('');
  };

  const handleAddStudent = async () => {
    if (!voterStudentId.trim()) return showAlert('ত্রুটি', 'Student ID দিন');
    if (!voterName.trim()) return showAlert('ত্রুটি', 'ছাত্র/ছাত্রীর নাম দিন');
    if (!voterPassword.trim()) return showAlert('ত্রুটি', 'পাসওয়ার্ড দিন');
    if (!voterPhoneNumber.trim()) return showAlert('ত্রুটি', 'Phone number দিন (OTP এর জন্য)');
    if (voterPassword.trim().length < 4) return showAlert('ত্রুটি', 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে');

    const success = await addStudent(
      voterStudentId.trim(),
      voterName.trim(),
      voterPassword.trim(),
      voterDepartment.trim() || 'N/A',
      voterSession.trim() || 'N/A',
      voterPhoneNumber.trim(),
    );

    if (success) {
      showAlert('সফল! ✅', `ভোটার "${voterName.trim()}" সফলভাবে যোগ করা হয়েছে।\n\nStudent ID: ${voterStudentId.trim()}\nPhone: ${voterPhoneNumber.trim()}`);
      resetVoterForm();
      await loadStudents();
    } else {
      showAlert('ব্যর্থ', 'ভোটার যোগ করতে সমস্যা হয়েছে।');
    }
  };

  const handleRemoveStudent = (student: { studentId: string; name: string }) => {
    showAlert(
      'ভোটার মুছুন',
      `আপনি কি "${student.name}" (${student.studentId}) কে মুছে ফেলতে চান?`,
      [
        { text: 'না', style: 'cancel' },
        {
          text: 'হ্যাঁ, মুছুন',
          style: 'destructive',
          onPress: async () => {
            const success = await removeStudent(student.studentId);
            if (success) {
              showAlert('সফল!', 'ভোটার মুছে ফেলা হয়েছে।');
              await loadStudents();
            } else {
              showAlert('ব্যর্থ', 'মুছতে সমস্যা হয়েছে।');
            }
          },
        },
      ]
    );
  };

  const openEditVoterModal = (student: { studentId: string; name: string; phoneNumber?: string; department: string; session: string }) => {
    setEditingVoter(student);
    setEditVoterName(student.name);
    setEditVoterPhoneNumber(student.phoneNumber || '');
    setEditVoterDepartment(student.department);
    setEditVoterSession(student.session);
    setShowEditVoterModal(true);
  };

  const handleUpdateVoter = async () => {
    if (!editingVoter) return;
    if (!editVoterName.trim()) return showAlert('ত্রুটি', 'নাম দিন');

    const success = await updateStudent(
      editingVoter.studentId,
      editVoterName.trim(),
      editVoterDepartment.trim() || 'N/A',
      editVoterSession.trim() || 'N/A',
      editVoterPhoneNumber.trim(),
    );

    if (success) {
      showAlert('সফল! ✅', 'ভোটারের তথ্য আপডেট হয়েছে।');
      setShowEditVoterModal(false);
      setEditingVoter(null);
      await loadStudents();
    } else {
      showAlert('ব্যর্থ', 'আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  const openPasswordResetModal = (student: { studentId: string; name: string }) => {
    setPasswordResetStudentId(student.studentId);
    setNewPassword('');
    setShowPasswordResetModal(true);
  };

  const handlePasswordReset = async () => {
    if (!passwordResetStudentId) return;
    if (!newPassword.trim()) return showAlert('ত্রুটি', 'নতুন পাসওয়ার্ড দিন');
    if (newPassword.trim().length < 4) return showAlert('ত্রুটি', 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে');

    const success = await updateStudentPassword(passwordResetStudentId, newPassword.trim());
    if (success) {
      showAlert('সফল! ✅', 'পাসওয়ার্ড আপডেট হয়েছে।');
      setShowPasswordResetModal(false);
      setPasswordResetStudentId(null);
      setNewPassword('');
    } else {
      showAlert('ব্যর্থ', 'পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  const openFaceModal = (student: { studentId: string; name: string }) => {
    setSelectedVoterForFace(student);
    setFaceCode('');
    setConfirmFaceCode('');
    setShowFaceModal(true);
  };

  const closeFaceModal = () => {
    setShowFaceModal(false);
    setSelectedVoterForFace(null);
    setFaceCode('');
    setConfirmFaceCode('');
  };

  const handleSaveFace = async () => {
    if (!selectedVoterForFace) return;
    if (!faceCode.trim() || !confirmFaceCode.trim()) {
      showAlert('ত্রুটি', 'Face code এবং confirm code দিন।');
      return;
    }
    if (faceCode.trim() !== confirmFaceCode.trim()) {
      showAlert('ত্রুটি', 'দুইটি Face code মেলেনি।');
      return;
    }

    setIsSavingFace(true);
    const ok = await setStudentFace(selectedVoterForFace.studentId, faceCode.trim());
    setIsSavingFace(false);

    if (!ok) {
      showAlert('ব্যর্থ', 'Face data save করা যায়নি।');
      return;
    }

    setFaceStatus((prev) => ({ ...prev, [selectedVoterForFace.studentId]: true }));
    showAlert('সফল ✅', `${selectedVoterForFace.name}-এর face data save হয়েছে।`);
    closeFaceModal();
  };

  const handleClearFace = async (student: { studentId: string; name: string }) => {
    const ok = await clearStudentFace(student.studentId);
    if (!ok) {
      showAlert('ব্যর্থ', 'Face data remove করতে সমস্যা হয়েছে।');
      return;
    }
    setFaceStatus((prev) => ({ ...prev, [student.studentId]: false }));
    showAlert('সফল', `${student.name}-এর face data remove করা হয়েছে।`);
  };

  const formatOtpTime = (iso?: string): string => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString();
  };

  const handleApproveOtp = async (studentId: string) => {
    const otp = await approveVoteOtpRequest(studentId);
    if (!otp) {
      showAlert('ব্যর্থ', 'OTP approve করা যায়নি।');
      return;
    }
    showAlert('Approved ✅', `OTP তৈরি হয়েছে: ${otp}`);
  };

  const handleRejectOtp = async (studentId: string) => {
    const ok = await rejectVoteOtpRequest(studentId);
    if (!ok) {
      showAlert('ব্যর্থ', 'OTP request reject করা যায়নি।');
      return;
    }
    showAlert('Rejected', 'OTP request reject করা হয়েছে।');
  };

  const handleClearOtpRequest = async (studentId: string) => {
    const ok = await clearVoteOtpRequest(studentId);
    if (!ok) {
      showAlert('ব্যর্থ', 'OTP request clear করা যায়নি।');
      return;
    }
    showAlert('সফল', 'OTP request clear করা হয়েছে।');
  };

  const handleSendManualSms = async (studentId: string, phoneNumber: string, otpCode?: string) => {
    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone || !otpCode) {
      showAlert('তথ্য অসম্পূর্ণ', 'Phone number বা OTP code পাওয়া যায়নি। আগে approve করুন।');
      return;
    }

    const body = `JOKSU Vote OTP: ${otpCode}. This code is valid for 5 minutes.`;
    const smsUrl = `sms:${trimmedPhone}?body=${encodeURIComponent(body)}`;

    try {
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (!canOpen) {
        showAlert('SMS App পাওয়া যায়নি', `OTP code: ${otpCode}`);
        return;
      }
      await Linking.openURL(smsUrl);
      await markVoteOtpAsSent(studentId);
    } catch (error) {
      console.error('Error opening SMS app:', error);
      showAlert('ত্রুটি', `SMS app খুলতে সমস্যা হয়েছে। OTP code: ${otpCode}`);
    }
  };

  // ---------- GPA COURSES ----------
  const resetCourseForm = () => {
    setCourseCode('');
    setCourseTitle('');
    setCourseCredit('');
  };

  const handleAddCourse = async () => {
    const code = courseCode.trim().toUpperCase();
    const title = courseTitle.trim();
    const credit = parseNumber(courseCredit);

    if (!code) return showAlert('ত্রুটি', 'কোর্স কোড দিন');
    if (!title) return showAlert('ত্রুটি', 'কোর্স টাইটেল দিন');
    if (credit <= 0) return showAlert('ত্রুটি', 'ক্রেডিট সঠিক দিন');
    if (gpaCoursesState.some((course) => course.code === code)) {
      return showAlert('ত্রুটি', 'এই কোর্স কোড আগে থেকেই আছে');
    }

    const nextCourses = [...gpaCoursesState, { code, title, credit }];
    const nextResults = syncGradesWithCourses(gpaResultsState, nextCourses);
    setGpaCoursesState(nextCourses);
    setGpaResultsState(nextResults);
    await persistGpaData(nextCourses, nextResults);
    showAlert('সফল ✅', 'কোর্স যোগ করা হয়েছে।');
    resetCourseForm();
  };

  const openEditCourseModal = (course: GpaCourse) => {
    setEditingCourse(course);
    setEditCourseCode(course.code);
    setEditCourseTitle(course.title);
    setEditCourseCredit(String(course.credit));
    setShowEditCourseModal(true);
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;
    const code = editCourseCode.trim().toUpperCase();
    const title = editCourseTitle.trim();
    const credit = parseNumber(editCourseCredit);

    if (!code) return showAlert('ত্রুটি', 'কোর্স কোড দিন');
    if (!title) return showAlert('ত্রুটি', 'কোর্স টাইটেল দিন');
    if (credit <= 0) return showAlert('ত্রুটি', 'ক্রেডিট সঠিক দিন');
    if (code !== editingCourse.code && gpaCoursesState.some((course) => course.code === code)) {
      return showAlert('ত্রুটি', 'এই কোর্স কোড আগে থেকেই আছে');
    }

    let nextResults = gpaResultsState;
    if (code !== editingCourse.code) {
      nextResults = updateCourseCodeInResults(nextResults, editingCourse.code, code);
    }

    const nextCourses = gpaCoursesState.map((course) =>
      course.code === editingCourse.code
        ? { code, title, credit }
        : course
    );
    nextResults = syncGradesWithCourses(nextResults, nextCourses);

    setGpaCoursesState(nextCourses);
    setGpaResultsState(nextResults);
    await persistGpaData(nextCourses, nextResults);
    showAlert('সফল ✅', 'কোর্স আপডেট হয়েছে।');
    setShowEditCourseModal(false);
    setEditingCourse(null);
  };

  const handleDeleteCourse = (course: GpaCourse) => {
    showAlert('কোর্স মুছুন', `${course.code} মুছে ফেলতে চান?`, [
      { text: 'না', style: 'cancel' },
      {
        text: 'হ্যাঁ, মুছুন',
        style: 'destructive',
        onPress: async () => {
          const nextCourses = gpaCoursesState.filter((c) => c.code !== course.code);
          const nextResults = syncGradesWithCourses(gpaResultsState, nextCourses);
          setGpaCoursesState(nextCourses);
          setGpaResultsState(nextResults);
          await persistGpaData(nextCourses, nextResults);
          showAlert('সফল ✅', 'কোর্স মুছে ফেলা হয়েছে।');
        },
      },
    ]);
  };

  // ---------- GPA RESULTS ----------
  const openResultModal = (student?: StudentResult) => {
    setEditingResult(student ?? null);
    setResultId(student?.id ?? '');
    setResultName(student?.name ?? '');
    setResultSemesterGpa(student?.semesterGpa?.toString() ?? '');
    setResultCgpa(student?.cgpa?.toString() ?? '');
    const grades: Record<string, string> = {};
    gpaCoursesState.forEach((course) => {
      grades[course.code] = student ? String(student.grades[course.code] ?? 0) : '';
    });
    setResultGrades(grades);
    setShowEditResultModal(true);
  };

  const handleSaveResult = async () => {
    const id = resultId.trim().toUpperCase();
    const name = resultName.trim();
    if (!id) return showAlert('ত্রুটি', 'Student ID দিন');
    if (!name) return showAlert('ত্রুটি', 'নাম দিন');

    const grades: Record<string, number> = {};
    gpaCoursesState.forEach((course) => {
      grades[course.code] = parseNumber(resultGrades[course.code] ?? '');
    });

    const nextStudent: StudentResult = {
      id,
      name,
      grades,
      semesterGpa: parseNumber(resultSemesterGpa),
      cgpa: parseNumber(resultCgpa),
    };

    const existingIndex = gpaResultsState.findIndex((student) => student.id === id);
    let nextResults = [...gpaResultsState];

    if (editingResult && editingResult.id !== id && existingIndex !== -1) {
      return showAlert('ত্রুটি', 'এই Student ID আগে থেকেই আছে');
    }

    if (editingResult && editingResult.id !== id) {
      nextResults = nextResults.filter((student) => student.id !== editingResult.id);
    }

    if (existingIndex === -1 || (editingResult && editingResult.id !== id)) {
      nextResults = [...nextResults, nextStudent];
    } else {
      nextResults = nextResults.map((student) => (student.id === id ? nextStudent : student));
    }

    setGpaResultsState(nextResults);
    await persistGpaData(gpaCoursesState, nextResults);
    showAlert('সফল ✅', 'রেজাল্ট আপডেট হয়েছে।');
    setShowEditResultModal(false);
    setEditingResult(null);
  };

  const handleDeleteResult = (student: StudentResult) => {
    showAlert('রেজাল্ট মুছুন', `${student.name} (${student.id}) মুছে ফেলতে চান?`, [
      { text: 'না', style: 'cancel' },
      {
        text: 'হ্যাঁ, মুছুন',
        style: 'destructive',
        onPress: async () => {
          const nextResults = gpaResultsState.filter((item) => item.id !== student.id);
          setGpaResultsState(nextResults);
          await persistGpaData(gpaCoursesState, nextResults);
          showAlert('সফল ✅', 'রেজাল্ট মুছে ফেলা হয়েছে।');
        },
      },
    ]);
  };

  // ---------- RENDER ----------
  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.tabActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>📊 ড্যাশবোর্ড</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'candidates' && styles.tabActive]}
          onPress={() => setActiveTab('candidates')}
        >
          <Text style={[styles.tabText, activeTab === 'candidates' && styles.tabTextActive]}>👥 প্রার্থী</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'add' && styles.tabActive]}
          onPress={() => setActiveTab('add')}
        >
          <Text style={[styles.tabText, activeTab === 'add' && styles.tabTextActive]}>➕ নতুন</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'voters' && styles.tabActive]}
          onPress={() => setActiveTab('voters')}
        >
          <Text style={[styles.tabText, activeTab === 'voters' && styles.tabTextActive]}>🎓 ভোটার</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'gpa' && styles.tabActive]}
          onPress={() => setActiveTab('gpa')}
        >
          <Text style={[styles.tabText, activeTab === 'gpa' && styles.tabTextActive]}>📚 GPA</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ====================== DASHBOARD TAB ====================== */}
      {activeTab === 'dashboard' && (
        <ScrollView style={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>⚙️ অ্যাডমিন প্যানেল</Text>
            <Text style={styles.headerSubtitle}>নির্বাচন ব্যবস্থাপনা</Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{getTotalVotes()}</Text>
              <Text style={styles.statLabel}>মোট ভোট</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{candidates.length}</Text>
              <Text style={styles.statLabel}>প্রার্থী</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{positions.length}</Text>
              <Text style={styles.statLabel}>পদ</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{registeredStudents.length || registeredStudentsCount}</Text>
              <Text style={styles.statLabel}>ভোটার</Text>
            </View>
          </View>

          {/* Election Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>নির্বাচনের অবস্থা</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>নির্বাচন:</Text>
                <View style={[styles.statusBadge, electionState.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                  <Text style={styles.statusBadgeText}>
                    {electionState.isActive ? 'চলমান' : 'বন্ধ'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏠 Home Menu Visibility</Text>
            <Text style={styles.formHint}>এই সেটিংস পরিবর্তন করলে সব ব্যবহারকারীর জন্য Home স্ক্রিনের কার্ড লুকবে/দেখাবে।</Text>
            {Object.entries(MENU_LABELS).map(([key, label]) => (
              <View key={key} style={styles.visibilityRow}>
                <Text style={styles.visibilityLabel}>{label}</Text>
                <Switch
                  value={menuVisibility[key as MenuOptionKey]}
                  onValueChange={() => handleToggleMenuVisibility(key as MenuOptionKey)}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={menuVisibility[key as MenuOptionKey] ? '#2563eb' : '#ffffff'}
                />
              </View>
            ))}
          </View>

          {/* Position-wise Results */}
          {/* Admin Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>দ্রুত অ্যাকশন</Text>
            <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('add')}>
              <Text style={styles.actionButtonText}>➕ নতুন প্রার্থী যোগ করুন</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('candidates')}>
              <Text style={styles.actionButtonText}>👥 প্রার্থী ব্যবস্থাপনা</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('voters')}>
              <Text style={styles.actionButtonText}>🎓 ভোটার যোগ/ব্যবস্থাপনা</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleResetVotes}>
              <Text style={styles.dangerButtonText}>🔄 সব ভোট রিসেট করুন</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>JOKSU Admin Panel v1.0</Text>
          </View>
        </ScrollView>
      )}

      {/* ====================== GPA COURSE EDIT MODAL ====================== */}
      <Modal visible={showEditCourseModal} animationType="slide" transparent>
        <View style={styles.editOverlay}>
          <View style={styles.editContainer}>
            <ScrollView>
              <Text style={styles.editTitle}>✏️ কোর্স এডিট</Text>

              <Text style={styles.formLabel}>কোর্স কোড *</Text>
              <TextInput
                style={styles.formInput}
                value={editCourseCode}
                onChangeText={setEditCourseCode}
                autoCapitalize="characters"
              />

              <Text style={styles.formLabel}>কোর্স টাইটেল *</Text>
              <TextInput
                style={styles.formInput}
                value={editCourseTitle}
                onChangeText={setEditCourseTitle}
              />

              <Text style={styles.formLabel}>ক্রেডিট *</Text>
              <TextInput
                style={styles.formInput}
                value={editCourseCredit}
                onChangeText={setEditCourseCredit}
                keyboardType="numeric"
              />

              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.editCancelBtn}
                  onPress={() => {
                    setShowEditCourseModal(false);
                    setEditingCourse(null);
                  }}
                >
                  <Text style={styles.editCancelText}>বাতিল</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editSaveBtn} onPress={handleUpdateCourse}>
                  <Text style={styles.editSaveText}>আপডেট করুন</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ====================== GPA RESULT EDIT MODAL ====================== */}
      <Modal visible={showEditResultModal} animationType="slide" transparent>
        <View style={styles.editOverlay}>
          <View style={styles.editContainer}>
            <ScrollView>
              <Text style={styles.editTitle}>✏️ GPA রেজাল্ট এডিট</Text>

              <Text style={styles.formLabel}>Student ID *</Text>
              <TextInput
                style={styles.formInput}
                value={resultId}
                onChangeText={setResultId}
                autoCapitalize="characters"
              />

              <Text style={styles.formLabel}>নাম *</Text>
              <TextInput
                style={styles.formInput}
                value={resultName}
                onChangeText={setResultName}
              />

              <Text style={styles.formLabel}>Semester GPA *</Text>
              <TextInput
                style={styles.formInput}
                value={resultSemesterGpa}
                onChangeText={setResultSemesterGpa}
                keyboardType="numeric"
              />

              <Text style={styles.formLabel}>CGPA *</Text>
              <TextInput
                style={styles.formInput}
                value={resultCgpa}
                onChangeText={setResultCgpa}
                keyboardType="numeric"
              />

              <Text style={styles.formLabel}>Subject-wise GPA</Text>
              {gpaCoursesState.map((course) => (
                <View key={course.code} style={styles.gpaGradeRow}>
                  <View style={styles.gpaGradeInfo}>
                    <Text style={styles.gpaGradeTitle} numberOfLines={2}>{course.title}</Text>
                    <Text style={styles.gpaGradeMeta}>{course.code} • {course.credit} credit</Text>
                  </View>
                  <TextInput
                    style={styles.gpaGradeInput}
                    value={resultGrades[course.code] ?? ''}
                    onChangeText={(value) => setResultGrades((prev) => ({ ...prev, [course.code]: value }))}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#999"
                  />
                </View>
              ))}

              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.editCancelBtn}
                  onPress={() => {
                    setShowEditResultModal(false);
                    setEditingResult(null);
                  }}
                >
                  <Text style={styles.editCancelText}>বাতিল</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editSaveBtn} onPress={handleSaveResult}>
                  <Text style={styles.editSaveText}>সেভ করুন</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ====================== CANDIDATES TAB ====================== */}
      {activeTab === 'candidates' && (
        <ScrollView style={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>প্রার্থী তালিকা ({filteredCandidates.length})</Text>

            {/* Position Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, filterPosition === 'ALL' && styles.filterChipActive]}
                onPress={() => setFilterPosition('ALL')}
              >
                <Text style={[styles.filterChipText, filterPosition === 'ALL' && styles.filterChipTextActive]}>সব</Text>
              </TouchableOpacity>
              {positions.map(pos => (
                <TouchableOpacity
                  key={pos.id}
                  style={[styles.filterChip, filterPosition === pos.id && styles.filterChipActive]}
                  onPress={() => setFilterPosition(pos.id)}
                >
                  <Text style={[styles.filterChipText, filterPosition === pos.id && styles.filterChipTextActive]}>
                    {pos.id}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Candidate Cards */}
          {filteredCandidates.map(candidate => (
            <View key={candidate.id} style={styles.candidateCard}>
              <View style={styles.candidateCardHeader}>
                <View style={styles.candidateSymbolBox}>
                  <Text style={styles.symbolText}>{candidate.symbol}</Text>
                </View>
                <View style={styles.candidateCardInfo}>
                  <Text style={styles.candidateCardName}>{candidate.name}</Text>
                  <Text style={styles.candidateCardMeta}>
                    {positions.find(p => p.id === candidate.position)?.titleBn} • {candidate.department}
                  </Text>
                  <Text style={styles.candidateCardMeta}>
                    ID: {candidate.studentId} • সেশন: {candidate.session}
                  </Text>
                  <Text style={styles.candidateCardVotes}>🗳️ {candidate.votes} ভোট</Text>
                </View>
              </View>
              {candidate.manifesto ? (
                <Text style={styles.candidateManifesto} numberOfLines={2}>
                  📜 {candidate.manifesto}
                </Text>
              ) : null}
              <View style={styles.candidateActions}>
                <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(candidate)}>
                  <Text style={styles.editButtonText}>✏️ এডিট</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteCandidate(candidate)}>
                  <Text style={styles.deleteButtonText}>🗑️ মুছুন</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {filteredCandidates.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📭</Text>
              <Text style={styles.emptyStateText}>কোনো প্রার্থী নেই</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ====================== ADD CANDIDATE TAB ====================== */}
      {activeTab === 'add' && (
        <ScrollView style={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>➕ নতুন প্রার্থী যোগ করুন</Text>

            <View style={styles.formCard}>
              <Text style={styles.formLabel}>নাম *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="প্রার্থীর পুরো নাম"
                placeholderTextColor="#999"
                value={addName}
                onChangeText={setAddName}
              />

              <Text style={styles.formLabel}>Student ID *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Student ID"
                placeholderTextColor="#999"
                value={addStudentId}
                onChangeText={setAddStudentId}
                autoCapitalize="none"
              />

              <Text style={styles.formLabel}>পদ *</Text>
              <TouchableOpacity style={styles.formPicker} onPress={() => setShowPositionPicker(true)}>
                <Text style={styles.formPickerText}>
                  {positions.find(p => p.id === addPosition)?.titleBn} ({addPosition})
                </Text>
                <Text style={styles.formPickerArrow}>▼</Text>
              </TouchableOpacity>

              <Text style={styles.formLabel}>বিভাগ *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="যেমন: Computer Science"
                placeholderTextColor="#999"
                value={addDepartment}
                onChangeText={setAddDepartment}
              />

              <Text style={styles.formLabel}>সেশন *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="যেমন: 2021-22"
                placeholderTextColor="#999"
                value={addSession}
                onChangeText={setAddSession}
              />

              <Text style={styles.formLabel}>প্রতীক</Text>
              <TouchableOpacity style={styles.formPicker} onPress={() => setShowSymbolPicker(true)}>
                <Text style={styles.symbolPickerText}>{addSymbol}</Text>
                <Text style={styles.formPickerArrow}>▼</Text>
              </TouchableOpacity>

              <Text style={styles.formLabel}>ইশতেহার *</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                placeholder="প্রার্থীর ইশতেহার লিখুন..."
                placeholderTextColor="#999"
                value={addManifesto}
                onChangeText={setAddManifesto}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleAddCandidate}>
                <Text style={styles.submitButtonText}>✅ প্রার্থী যোগ করুন</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ====================== VOTERS TAB ====================== */}
      {activeTab === 'voters' && (
        <ScrollView style={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🙂 Face Verification</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.statusLabel}>ভোটের আগে Face match বাধ্যতামূলক</Text>
                  <Text style={styles.formHint}>ID scan এর পর face match করলে তবেই ভোট দিতে পারবে।</Text>
                </View>
                <Switch
                  value={faceRequired}
                  onValueChange={setFaceRequired}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={faceRequired ? '#2563eb' : '#ffffff'}
                />
              </View>
              <View style={[styles.statusRow, { marginTop: 12 }]}> 
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.statusLabel}>📱 SMS OTP বাধ্যতামূলক</Text>
                  <Text style={styles.formHint}>ভোটার request দিবে, admin approve করে manually SMS পাঠাবে, তারপর OTP verify হবে।</Text>
                </View>
                <Switch
                  value={otpRequired}
                  onValueChange={setOtpRequired}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={otpRequired ? '#2563eb' : '#ffffff'}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📨 OTP Request Queue</Text>
            <View style={styles.formCard}>
              {otpRequests.length === 0 ? (
                <Text style={styles.formHint}>এখনো কোনো OTP request আসেনি।</Text>
              ) : (
                otpRequests
                  .slice()
                  .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
                  .map((request, idx) => (
                    <View key={`${request.studentId}-${idx}`} style={styles.otpRequestCard}>
                      <Text style={styles.otpRequestTitle}>{request.studentId}</Text>
                      <Text style={styles.otpRequestMeta}>Phone: {request.phoneNumber || 'N/A'}</Text>
                      <Text style={styles.otpRequestMeta}>Status: {request.status.toUpperCase()}</Text>
                      <Text style={styles.otpRequestMeta}>Requested: {formatOtpTime(request.requestedAt)}</Text>
                      <Text style={styles.otpRequestMeta}>Expires: {formatOtpTime(request.expiresAt)}</Text>
                      {request.otpCode ? <Text style={styles.otpRequestCode}>OTP: {request.otpCode}</Text> : null}
                      {!!request.note && <Text style={styles.otpRequestNote}>Note: {request.note}</Text>}

                      <View style={styles.otpRequestActionsRow}>
                        <TouchableOpacity style={styles.otpApproveBtn} onPress={() => handleApproveOtp(request.studentId)}>
                          <Text style={styles.otpApproveBtnText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.otpSendBtn} onPress={() => handleSendManualSms(request.studentId, request.phoneNumber, request.otpCode)}>
                          <Text style={styles.otpSendBtnText}>Send SMS</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.otpRejectBtn} onPress={() => handleRejectOtp(request.studentId)}>
                          <Text style={styles.otpRejectBtnText}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.otpClearBtn} onPress={() => handleClearOtpRequest(request.studentId)}>
                          <Text style={styles.otpClearBtnText}>Clear</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎓 নতুন ভোটার যোগ করুন</Text>

            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Student ID *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="যেমন: B210305030"
                placeholderTextColor="#999"
                value={voterStudentId}
                onChangeText={setVoterStudentId}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.formHint}>
                💡 স্ক্যানে last ৯ digit মিললেই ম্যাচ হবে (B210305030 = 210305030)
              </Text>

              <Text style={styles.formLabel}>নাম *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="ছাত্র/ছাত্রীর পুরো নাম"
                placeholderTextColor="#999"
                value={voterName}
                onChangeText={setVoterName}
              />

              <Text style={styles.formLabel}>পাসওয়ার্ড *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="লগইন পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর)"
                placeholderTextColor="#999"
                value={voterPassword}
                onChangeText={setVoterPassword}
                autoCapitalize="none"
              />

              <Text style={styles.formLabel}>Phone Number (OTP) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="যেমন: +8801XXXXXXXXX"
                placeholderTextColor="#999"
                value={voterPhoneNumber}
                onChangeText={setVoterPhoneNumber}
                keyboardType="phone-pad"
              />

              <Text style={styles.formLabel}>বিভাগ</Text>
              <TextInput
                style={styles.formInput}
                placeholder="যেমন: Computer Science"
                placeholderTextColor="#999"
                value={voterDepartment}
                onChangeText={setVoterDepartment}
              />

              <Text style={styles.formLabel}>সেশন</Text>
              <TextInput
                style={styles.formInput}
                placeholder="যেমন: 2021-22"
                placeholderTextColor="#999"
                value={voterSession}
                onChangeText={setVoterSession}
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleAddStudent}>
                <Text style={styles.submitButtonText}>✅ ভোটার যোগ করুন</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Registered Students List */}
          <View style={styles.section}>
            <View style={styles.voterListHeader}>
              <Text style={styles.sectionTitle}>📋 নিবন্ধিত ভোটার ({registeredStudents.length})</Text>
              <TouchableOpacity onPress={loadStudents} style={styles.refreshBtn}>
                <Text style={styles.refreshBtnText}>🔄</Text>
              </TouchableOpacity>
            </View>

            {registeredStudents.map((student, idx) => (
              <View key={`${student.studentId}-${idx}`} style={styles.voterCard}>
                <View style={styles.voterAvatar}>
                  <Text style={styles.voterAvatarText}>{student.name.charAt(0).toUpperCase()}</Text>
                </View>

                <View style={styles.voterContent}>
                  <View style={styles.voterInfo}>
                    <Text style={styles.voterName}>{student.name}</Text>
                    <Text style={styles.voterId}>ID: {student.studentId}</Text>
                    <Text style={styles.voterMeta}>Phone: {student.phoneNumber || 'N/A'}</Text>
                    <Text style={styles.voterMeta}>{student.department} • {student.session}</Text>
                    <Text style={[styles.voterMeta, faceStatus[student.studentId] ? styles.faceOn : styles.faceOff]}>
                      {faceStatus[student.studentId] ? '🙂 Face Enrolled' : '⚪ Face Not Set'}
                    </Text>
                  </View>

                  <View style={styles.voterActionsRow}>
                    <TouchableOpacity
                      style={styles.voterFaceBtn}
                      onPress={() => openFaceModal(student)}
                    >
                      <Text style={styles.voterFaceText}>{faceStatus[student.studentId] ? 'Update Face' : 'Set Face'}</Text>
                    </TouchableOpacity>

                    {faceStatus[student.studentId] && (
                      <TouchableOpacity
                        style={styles.voterFaceRemoveBtn}
                        onPress={() => handleClearFace(student)}
                      >
                        <Text style={styles.voterFaceRemoveText}>Remove</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.iconSmallBtn}
                      onPress={() => openEditVoterModal(student)}
                    >
                      <Text style={styles.iconSmallText}>✏️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.iconSmallBtn}
                      onPress={() => openPasswordResetModal(student)}
                    >
                      <Text style={styles.iconSmallText}>🔒</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.iconSmallBtn}
                      onPress={() => handleRemoveStudent(student)}
                    >
                      <Text style={styles.iconSmallText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {registeredStudents.length === 0 && studentsLoaded && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📭</Text>
                <Text style={styles.emptyStateText}>কোনো ভোটার নিবন্ধিত নেই</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* ====================== GPA TAB ====================== */}
      {activeTab === 'gpa' && (
        <ScrollView style={styles.scrollContent}>
          <View style={styles.section}>
            <View style={styles.gpaHeaderRow}>
              <Text style={styles.sectionTitle}>📚 GPA Control (3.1)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={loadGpaData} style={styles.refreshBtn}>
                  <Text style={styles.refreshBtnText}>🔄</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleExport} style={styles.exportBtn}>
                  <Text style={styles.exportBtnText}>Export</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowImportModal(true)} style={styles.importBtn}>
                  <Text style={styles.importBtnText}>Import</Text>
                </TouchableOpacity>
              </View>
            </View>
            {(!gpaLoaded || gpaSaving) && (
              <View style={styles.gpaStatusRow}>
                <ActivityIndicator size="small" color="#9C27B0" />
                <Text style={styles.gpaStatusText}>{gpaSaving ? 'Saving...' : 'Loading...'}</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📌 কোর্স</Text>
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>কোর্স কোড *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="CSE-3101"
                placeholderTextColor="#999"
                value={courseCode}
                onChangeText={setCourseCode}
                autoCapitalize="characters"
              />
              <Text style={styles.formLabel}>কোর্স টাইটেল *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Theory of Computation"
                placeholderTextColor="#999"
                value={courseTitle}
                onChangeText={setCourseTitle}
              />
              <Text style={styles.formLabel}>ক্রেডিট *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="3"
                placeholderTextColor="#999"
                value={courseCredit}
                onChangeText={setCourseCredit}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.submitButton} onPress={handleAddCourse}>
                <Text style={styles.submitButtonText}>✅ কোর্স যোগ করুন</Text>
              </TouchableOpacity>
            </View>

            {gpaCoursesState.map((course) => (
              <View key={course.code} style={styles.gpaCourseRow}>
                <View style={styles.gpaCourseTop}>
                  <View style={styles.courseCodeBox}>
                    <Text style={styles.courseCodeText}>{course.code}</Text>
                  </View>
                  <View style={styles.gpaCourseInfo}>
                    <Text style={styles.gpaCourseTitle} numberOfLines={2} ellipsizeMode="tail">
                      {course.title}
                    </Text>
                    <Text style={styles.gpaCourseMeta} numberOfLines={1}>
                      {course.code} • {course.credit} credit
                    </Text>
                  </View>
                </View>
                <View style={styles.gpaCourseActions}>
                  <TouchableOpacity style={[styles.iconBtn, styles.iconBtnEdit]} onPress={() => openEditCourseModal(course)}>
                    <Text style={[styles.iconBtnText, styles.iconBtnLabel]}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDelete]} onPress={() => handleDeleteCourse(course)}>
                    <Text style={[styles.iconBtnText, styles.iconBtnDeleteText]}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.gpaHeaderRow}>
              <Text style={styles.sectionTitle}>🧾 রেজাল্ট</Text>
              <TouchableOpacity style={styles.addSmallBtn} onPress={() => openResultModal()}>
                <Text style={styles.addSmallBtnText}>➕ নতুন</Text>
              </TouchableOpacity>
            </View>

            {gpaResultsState.map((student) => (
              <View key={student.id} style={styles.gpaResultCard}>
                <View style={styles.gpaResultHeader}>
                  <View style={styles.gpaResultInfo}>
                    <Text style={styles.gpaResultName}>{student.name}</Text>
                    <Text style={styles.gpaResultMeta}>{student.id}</Text>
                  </View>
                  <View style={styles.gpaResultScoreBox}>
                    <Text style={styles.gpaResultScoreLabel}>Sem GPA</Text>
                    <Text style={styles.gpaResultScoreValue}>{student.semesterGpa.toFixed(2)}</Text>
                  </View>
                </View>
                <Text style={styles.gpaResultMeta}>CGPA: {student.cgpa.toFixed(2)}</Text>
                <View style={styles.gpaResultActions}>
                  <TouchableOpacity style={[styles.iconBtn, styles.iconBtnEdit]} onPress={() => openResultModal(student)}>
                    <Text style={[styles.iconBtnText, { marginRight: 6 }]}>✏️</Text>
                    <Text style={[styles.iconBtnText, { color: '#1565C0' }]}>এডিট</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDelete]} onPress={() => handleDeleteResult(student)}>
                    <Text style={[styles.iconBtnText, { marginRight: 6, color: '#C62828' }]}>🗑️</Text>
                    <Text style={[styles.iconBtnText, { color: '#C62828' }]}>মুছুন</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ====================== POSITION PICKER MODAL ====================== */}
      <Modal visible={showPositionPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowPositionPicker(false)}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>পদ নির্বাচন করুন</Text>
            <ScrollView style={styles.pickerScroll}>
              {positions.map(pos => (
                <TouchableOpacity
                  key={pos.id}
                  style={[styles.pickerItem, addPosition === pos.id && styles.pickerItemActive]}
                  onPress={() => {
                    setAddPosition(pos.id);
                    setShowPositionPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, addPosition === pos.id && styles.pickerItemTextActive]}>
                    {pos.titleBn} ({pos.id})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ====================== SYMBOL PICKER MODAL ====================== */}
      <Modal visible={showSymbolPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowSymbolPicker(false)}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>প্রতীক নির্বাচন করুন</Text>
            <View style={styles.symbolGrid}>
              {SYMBOLS.map((sym, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.symbolOption, addSymbol === sym && styles.symbolOptionActive]}
                  onPress={() => {
                    setAddSymbol(sym);
                    setShowSymbolPicker(false);
                  }}
                >
                  <Text style={styles.symbolOptionText}>{sym}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ====================== PASSWORD RESET MODAL ====================== */}
      <Modal visible={showPasswordResetModal} animationType="slide" transparent>
        <View style={styles.editOverlay}>
          <View style={styles.editContainer}>
            <Text style={styles.editTitle}>🔐 পাসওয়ার্ড পরিবর্তন</Text>
            <Text style={styles.formHint}>এই পাসওয়ার্ড দিয়ে ব্যবহারকারী পরবর্তী লগইনে লগইন করতে পারবে।</Text>
            <TextInput
              style={styles.formInput}
              placeholder="নতুন পাসওয়ার্ড"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
              secureTextEntry
            />
            <View style={styles.editButtons}>
              <TouchableOpacity
                style={styles.editCancelBtn}
                onPress={() => {
                  setShowPasswordResetModal(false);
                  setPasswordResetStudentId(null);
                  setNewPassword('');
                }}
              >
                <Text style={styles.editCancelText}>বাতিল</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editSaveBtn} onPress={handlePasswordReset}>
                <Text style={styles.editSaveText}>সেভ করুন</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ====================== EDIT MODAL ====================== */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.editOverlay}>
          <View style={styles.editContainer}>
            <ScrollView>
              <Text style={styles.editTitle}>✏️ প্রার্থী এডিট করুন</Text>

              <Text style={styles.formLabel}>নাম</Text>
              <TextInput style={styles.formInput} value={editName} onChangeText={setEditName} />

              <Text style={styles.formLabel}>পদ</Text>
              <TouchableOpacity style={styles.formPicker} onPress={() => setShowEditPositionPicker(true)}>
                <Text style={styles.formPickerText}>
                  {positions.find(p => p.id === editPosition)?.titleBn} ({editPosition})
                </Text>
                <Text style={styles.formPickerArrow}>▼</Text>
              </TouchableOpacity>

              <Text style={styles.formLabel}>বিভাগ</Text>
              <TextInput style={styles.formInput} value={editDepartment} onChangeText={setEditDepartment} />

              <Text style={styles.formLabel}>সেশন</Text>
              <TextInput style={styles.formInput} value={editSession} onChangeText={setEditSession} />

              <Text style={styles.formLabel}>প্রতীক</Text>
              <TouchableOpacity style={styles.formPicker} onPress={() => setShowEditSymbolPicker(true)}>
                <Text style={styles.symbolPickerText}>{editSymbol}</Text>
                <Text style={styles.formPickerArrow}>▼</Text>
              </TouchableOpacity>

              <Text style={styles.formLabel}>ইশতেহার</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                value={editManifesto}
                onChangeText={setEditManifesto}
                multiline
                numberOfLines={3}
              />

              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.editCancelBtn}
                  onPress={() => {
                    setShowEditModal(false);
                    setEditingCandidate(null);
                  }}
                >
                  <Text style={styles.editCancelText}>বাতিল</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editSaveBtn} onPress={handleUpdateCandidate}>
                  <Text style={styles.editSaveText}>আপডেট করুন</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT POSITION PICKER */}
      <Modal visible={showEditPositionPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowEditPositionPicker(false)}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>পদ নির্বাচন করুন</Text>
            <ScrollView style={styles.pickerScroll}>
              {positions.map(pos => (
                <TouchableOpacity
                  key={pos.id}
                  style={[styles.pickerItem, editPosition === pos.id && styles.pickerItemActive]}
                  onPress={() => {
                    setEditPosition(pos.id);
                    setShowEditPositionPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, editPosition === pos.id && styles.pickerItemTextActive]}>
                    {pos.titleBn} ({pos.id})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* EDIT SYMBOL PICKER */}
      <Modal visible={showEditSymbolPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowEditSymbolPicker(false)}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>প্রতীক নির্বাচন করুন</Text>
            <View style={styles.symbolGrid}>
              {SYMBOLS.map((sym, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.symbolOption, editSymbol === sym && styles.symbolOptionActive]}
                  onPress={() => {
                    setEditSymbol(sym);
                    setShowEditSymbolPicker(false);
                  }}
                >
                  <Text style={styles.symbolOptionText}>{sym}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ====================== FACE SETUP MODAL ====================== */}
      <Modal visible={showFaceModal} animationType="fade" transparent onRequestClose={closeFaceModal}>
        <View style={styles.editOverlay}>
          <View style={styles.editContainer}>
            <ScrollView>
              <Text style={styles.editTitle}>🙂 Face সেটআপ</Text>
              <Text style={{ textAlign: 'center', color: '#777', marginBottom: 10, fontSize: 13 }}>
                {selectedVoterForFace?.name} ({selectedVoterForFace?.studentId})
              </Text>

              <Text style={styles.formLabel}>Face Code *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Face code"
                placeholderTextColor="#999"
                value={faceCode}
                onChangeText={setFaceCode}
                secureTextEntry
              />

              <TouchableOpacity style={styles.faceCaptureBtn} onPress={() => setShowCameraFaceCapture(true)}>
                <Text style={styles.faceCaptureText}>📷 Camera দিয়ে Face নিন (Demo)</Text>
              </TouchableOpacity>

              <Text style={styles.formLabel}>Confirm Code *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="একই code আবার লিখুন"
                placeholderTextColor="#999"
                value={confirmFaceCode}
                onChangeText={setConfirmFaceCode}
                secureTextEntry
              />

              <View style={styles.editButtons}>
                <TouchableOpacity style={styles.editCancelBtn} onPress={closeFaceModal}>
                  <Text style={styles.editCancelText}>বাতিল</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editSaveBtn} onPress={handleSaveFace} disabled={isSavingFace}>
                  {isSavingFace ? <ActivityIndicator color="#fff" /> : <Text style={styles.editSaveText}>সংরক্ষণ</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CameraFaceCapture
        visible={showCameraFaceCapture}
        onClose={() => setShowCameraFaceCapture(false)}
        onTemplateReady={(templateCode) => {
          setFaceCode(templateCode);
          setConfirmFaceCode(templateCode);
        }}
      />

      {/* ====================== EXPORT / IMPORT MODALS ====================== */}
      <Modal visible={showExportModal} animationType="slide" transparent>
        <View style={styles.editOverlay}>
          <View style={styles.editContainer}>
            <Text style={styles.editTitle}>📤 Export GPA Data (JSON)</Text>
            <Text style={{ color: '#666', marginBottom: 8 }}>Copy the JSON below to backup or transfer.</Text>
            <ScrollView style={{ maxHeight: 320, marginBottom: 12 }}>
              <TextInput
                style={[styles.formInput, { minHeight: 200, textAlignVertical: 'top' }]}
                value={exportJsonText}
                multiline
                editable={false}
              />
            </ScrollView>
            <View style={styles.editButtons}>
              <TouchableOpacity style={styles.editCancelBtn} onPress={() => setShowExportModal(false)}>
                <Text style={styles.editCancelText}>বন্ধ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showImportModal} animationType="slide" transparent>
        <View style={styles.editOverlay}>
          <View style={styles.editContainer}>
            <Text style={styles.editTitle}>📥 Import GPA Data (Paste JSON)</Text>
            <Text style={{ color: '#666', marginBottom: 8 }}>Paste JSON with shape {`{ courses: [...], results: [...] }`}.</Text>
            <ScrollView style={{ maxHeight: 320, marginBottom: 12 }}>
              <TextInput
                style={[styles.formInput, { minHeight: 180, textAlignVertical: 'top' }]}
                value={importJsonText}
                onChangeText={setImportJsonText}
                multiline
                placeholder='{"courses": [...], "results": [...]}'
              />
            </ScrollView>
            <View style={styles.editButtons}>
              <TouchableOpacity style={styles.editCancelBtn} onPress={() => setShowImportModal(false)}>
                <Text style={styles.editCancelText}>বাতিল</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editSaveBtn} onPress={handleImport}>
                <Text style={styles.editSaveText}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* ====================== EDIT VOTER MODAL ====================== */}
      <Modal visible={showEditVoterModal} animationType="slide" transparent>
        <View style={styles.editOverlay}>
          <View style={styles.editContainer}>
            <ScrollView>
              <Text style={styles.editTitle}>✏️ ভোটার এডিট করুন</Text>
              {editingVoter && (
                <Text style={{ textAlign: 'center', color: '#777', marginBottom: 10, fontSize: 13 }}>
                  ID: {editingVoter.studentId}
                </Text>
              )}

              <Text style={styles.formLabel}>নাম</Text>
              <TextInput style={styles.formInput} value={editVoterName} onChangeText={setEditVoterName} />

              <Text style={styles.formLabel}>বিভাগ</Text>
              <TextInput style={styles.formInput} value={editVoterDepartment} onChangeText={setEditVoterDepartment} />

              <Text style={styles.formLabel}>Phone Number (OTP)</Text>
              <TextInput
                style={styles.formInput}
                value={editVoterPhoneNumber}
                onChangeText={setEditVoterPhoneNumber}
                keyboardType="phone-pad"
              />

              <Text style={styles.formLabel}>সেশন</Text>
              <TextInput style={styles.formInput} value={editVoterSession} onChangeText={setEditVoterSession} />

              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.editCancelBtn}
                  onPress={() => {
                    setShowEditVoterModal(false);
                    setEditingVoter(null);
                  }}
                >
                  <Text style={styles.editCancelText}>বাতিল</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editSaveBtn} onPress={handleUpdateVoter}>
                  <Text style={styles.editSaveText}>আপডেট করুন</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f7',
  },
  scrollContent: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: '#eef2f7',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },

  // Tab Bar
  tabBar: {
    backgroundColor: '#9C27B0',
    paddingTop: 4,
    maxHeight: 56,
  },
  tabBarContent: {
    flexDirection: 'row',
    flexGrow: 1,
  },
  tab: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // GPA Admin
  gpaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gpaStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  gpaStatusText: {
    fontSize: 12,
    color: '#666',
  },
  gpaCourseRow: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  gpaCourseTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseCodeBox: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 3,
  },
  courseCodeText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
  },
  gpaCourseInfo: {
    flex: 1,
    paddingRight: 10,
  },
  gpaCourseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    lineHeight: 20,
  },
  gpaCourseMeta: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
    lineHeight: 16,
  },
  gpaCourseActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    minWidth: 92,
    justifyContent: 'center',
    elevation: 2,
  },
  iconBtnEdit: {
    backgroundColor: '#E3F2FD',
  },
  iconBtnDelete: {
    backgroundColor: '#FFEBEE',
  },
  iconBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1565C0',
  },
  iconBtnLabel: {
    textAlign: 'center',
  },
  iconBtnDeleteText: {
    color: '#C62828',
    textAlign: 'center',
  },
  addSmallBtn: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  addSmallBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  gpaResultCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  gpaResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gpaResultInfo: {
    flex: 1,
    paddingRight: 12,
  },
  gpaResultName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#222',
  },
  gpaResultMeta: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  gpaResultScoreBox: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F3E5F5',
  },
  gpaResultScoreLabel: {
    fontSize: 10,
    color: '#6A1B9A',
    fontWeight: '700',
  },
  gpaResultScoreValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6A1B9A',
  },
  gpaResultActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  gpaGradeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  gpaGradeInfo: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1.5,
    borderColor: '#cfcfcf',
    borderRadius: 10,
    padding: 13,
    backgroundColor: 'white',
    color: '#111',
  },
  gpaGradeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    lineHeight: 20,
  },
  gpaGradeMeta: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
    lineHeight: 15,
  },
  gpaGradeInput: {
    width: 76,
    minWidth: 76,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: 'center',
    color: '#222',
    fontSize: 14,
  },

  // Header
  header: {
    backgroundColor: '#9C27B0',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#9C27B0',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },

  // Section
  section: {
    margin: 16,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  // Status
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 15,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  inactiveBadge: {
    backgroundColor: '#f44336',
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Positions
  positionSummary: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#dbdde1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  positionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  positionStats: {
    fontSize: 12,
    color: '#888',
  },
  leaderText: {
    fontSize: 13,
    color: '#9C27B0',
    marginTop: 6,
    fontWeight: '600',
  },

  // Action Buttons
  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#dbdde1',
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Filter
  filterRow: {
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
  },
  filterChipActive: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: 'white',
  },

  // Candidate Card
  candidateCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  candidateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  candidateSymbolBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  symbolText: {
    fontSize: 24,
  },
  candidateCardInfo: {
    flex: 1,
  },
  candidateCardName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
  },
  candidateCardMeta: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  candidateCardVotes: {
    fontSize: 13,
    color: '#9C27B0',
    fontWeight: 'bold',
    marginTop: 4,
  },
  candidateManifesto: {
    fontSize: 13,
    color: '#555',
    marginTop: 10,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  candidateActions: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#1565C0',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#C62828',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },

  // Form
  formCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 20,
    marginBottom: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
    marginTop: 14,
  },
  formInput: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  formTextarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 13,
    backgroundColor: '#fafafa',
  },
  formPickerText: {
    fontSize: 15,
    color: '#333',
  },
  formPickerArrow: {
    fontSize: 12,
    color: '#999',
  },
  symbolPickerText: {
    fontSize: 28,
  },
  submitButton: {
    backgroundColor: '#9C27B0',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },

  // Picker Modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerScroll: {
    maxHeight: 350,
  },
  pickerItem: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#f5f5f5',
  },
  pickerItemActive: {
    backgroundColor: '#9C27B0',
  },
  pickerItemText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  pickerItemTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  symbolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  symbolOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  symbolOptionActive: {
    borderColor: '#9C27B0',
    backgroundColor: '#F3E5F5',
  },
  symbolOptionText: {
    fontSize: 26,
  },

  // Edit Modal
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  editContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  editTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9C27B0',
    textAlign: 'center',
    marginBottom: 8,
  },
  editButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  editCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  editCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  editSaveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#9C27B0',
    alignItems: 'center',
  },
  editSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },

  footer: {
    alignItems: 'center',
    padding: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#9C27B0',
    fontWeight: 'bold',
  },

  // Voter styles
  formHint: {
    fontSize: 12,
    color: '#9C27B0',
    marginTop: 4,
    fontStyle: 'italic',
  },
  voterListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshBtn: {
    padding: 8,
  },
  refreshBtnText: {
    fontSize: 22,
  },
  exportBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  exportBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  importBtn: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  importBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  voterCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  voterAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  voterAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  voterInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  voterName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 3,
  },
  voterId: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4b5563',
    marginBottom: 2,
  },
  voterMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  faceOn: {
    color: '#0284c7',
    fontWeight: '700',
  },
  faceOff: {
    color: '#9ca3af',
    fontWeight: '700',
  },
  voterFaceBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(37,99,235,0.12)',
    marginRight: 8,
  },
  voterFaceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  voterFaceRemoveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(220,38,38,0.12)',
    marginRight: 8,
  },
  voterFaceRemoveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c',
  },
  voterDeleteBtn: {
    padding: 10,
  },
  voterDeleteText: {
    fontSize: 20,
  },
  voterEditBtn: {
    padding: 10,
  },
  voterEditText: {
    fontSize: 20,
  },
  voterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 4,
  },
  voterContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  voterActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  iconSmallBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(243,244,246,0.8)',
    marginRight: 6,
  },
  iconSmallText: {
    fontSize: 16,
  },
  faceCaptureBtn: {
    marginTop: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  faceCaptureText: {
    fontSize: 13,
    color: '#3730a3',
    fontWeight: '700',
  },
  otpRequestCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  otpRequestTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  otpRequestMeta: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 2,
  },
  otpRequestCode: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  otpRequestNote: {
    marginTop: 4,
    fontSize: 12,
    color: '#b91c1c',
    fontStyle: 'italic',
  },
  otpRequestActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  otpApproveBtn: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  otpApproveBtnText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 12,
  },
  otpSendBtn: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  otpSendBtnText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 12,
  },
  otpRejectBtn: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  otpRejectBtnText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 12,
  },
  otpClearBtn: {
    backgroundColor: '#f3f4f6',
    borderColor: '#9ca3af',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  otpClearBtnText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 12,
  },
});