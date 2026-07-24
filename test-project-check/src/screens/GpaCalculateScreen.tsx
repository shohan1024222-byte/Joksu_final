import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { Colors, BorderRadius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { gpaCourses, GpaCourse } from '../data/gpaCourses';
import { gpaResults, StudentResult } from '../data/gpaResults';
import { loadGpaCourses, loadGpaResults } from '../data/gpaStore';
import { RootStackParamList } from '../navigation/types';

type GradeInputs = Record<string, string>;

const isValidPoint = (value: number) => value >= 0 && value <= 4;
const normalizeNumberInput = (value: string) =>
  value.replace(/[০-৯]/g, (digit) => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));

export const GpaCalculateScreen: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, 'GpaCalculate'>>();
  const scrollRef = useRef<ScrollView>(null);
  const [showSemester, setShowSemester] = useState(false);
  const [studentId, setStudentId] = useState(isAdmin ? route.params?.studentId ?? '' : user?.studentId ?? '');
  const [showResult, setShowResult] = useState(!isAdmin && Boolean(user));
  const [courses, setCourses] = useState<GpaCourse[]>(gpaCourses);
  const [results, setResults] = useState<StudentResult[]>(gpaResults);
  const [gradeInputs, setGradeInputs] = useState<GradeInputs>(() =>
    Object.fromEntries(gpaCourses.map((course) => [course.code, '']))
  );

  const totalCredits = useMemo(
    () => courses.reduce((sum, course) => sum + course.credit, 0),
    [courses]
  );

  const refreshData = useCallback(async () => {
    const [storedCourses, storedResults] = await Promise.all([
      loadGpaCourses(),
      loadGpaResults(),
    ]);
    setCourses(storedCourses);
    setResults(storedResults);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  useEffect(() => {
    setGradeInputs((prev) => {
      const next: GradeInputs = {};
      courses.forEach((course) => {
        next[course.code] = prev[course.code] ?? '';
      });
      return next;
    });
  }, [courses]);

  const parsedPoints = useMemo(() => {
    return courses.map((course) => {
      const normalized = normalizeNumberInput(gradeInputs[course.code]).trim();
      if (!normalized || normalized === '.') return 0;
      const value = Number(normalized);
      if (!Number.isFinite(value)) return null;
      return value;
    });
  }, [courses, gradeInputs]);

  const isComplete = parsedPoints.every((value) => value !== null && isValidPoint(value));

  const totalPoints = useMemo(() => {
    if (!isComplete) return 0;
    return courses.reduce((sum, course, index) => {
      const point = parsedPoints[index] as number;
      return sum + course.credit * point;
    }, 0);
  }, [courses, isComplete, parsedPoints]);

  const gpa = isComplete ? totalPoints / totalCredits : null;

  useEffect(() => {
    if (isAdmin && route.params?.studentId) {
      setStudentId(route.params.studentId);
      setShowResult(Boolean(route.params.studentId));
    }
    if (!isAdmin) {
      setStudentId(user?.studentId ?? '');
      setShowResult(Boolean(user));
    }
  }, [route.params?.studentId, user, isAdmin]);

  const selectedStudent = useMemo(() => {
    const term = studentId.trim().toLowerCase();
    if (!term) return null;
    return results.find((student) => student.id.toLowerCase() === term) || null;
  }, [results, studentId]);

  const handleChange = (code: string, value: string) => {
    const normalized = normalizeNumberInput(value);
    const cleaned = normalized.replace(/[^0-9.]/g, '');
    setGradeInputs((prev) => ({ ...prev, [code]: cleaned }));
  };

  const handleResultCheck = () => {
    setShowResult(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const canCalculate = showResult && Boolean(selectedStudent);
  const shouldCompare = canCalculate && gpa !== null;
  const isAllowed = isAdmin || Boolean(user);
  const isMatch = shouldCompare
    ? Math.abs(gpa - selectedStudent.semesterGpa) < 0.01
    : false;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={Colors.gradients.ocean}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerIcon}>🧮</Text>
          <Text style={styles.title}>GPA Calculate</Text>
          <Text style={styles.subtitle}>প্রতি কোর্সের Grade Point লিখুন (0.00 - 4.00)</Text>
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Student Result</Text>
            <Text style={styles.resultSubtitle}>Student ID দিন, result দেখার পর GPA calculate হবে</Text>
            <View style={styles.resultInputRow}>
              <TextInput
                value={studentId}
                onChangeText={(value) => {
                  setStudentId(value);
                  setShowResult(false);
                }}
                placeholder="Student ID"
                placeholderTextColor={Colors.textMuted}
                style={styles.resultInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity onPress={handleResultCheck} activeOpacity={0.85}>
                <LinearGradient
                  colors={Colors.gradients.primary}
                  style={styles.resultBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.resultBtnText}>Check</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            {showResult && !studentId.trim() && (
              <Text style={styles.resultMessage}>Please enter a Student ID.</Text>
            )}
            {!isAllowed && (
              <Text style={styles.resultMessage}>দয়া করে প্রথমে লগইন করুন।</Text>
            )}
            {showResult && studentId.trim() && !selectedStudent && (
              <Text style={styles.resultMessage}>Result not found for this ID.</Text>
            )}
            {showResult && selectedStudent && (
              <View style={styles.resultDetails}>
                <Text style={styles.resultName}>{selectedStudent.name}</Text>
                <View style={styles.resultMetaRow}>
                  <Text style={styles.resultMeta}>ID: {selectedStudent.id}</Text>
                  <Text style={styles.resultMeta}>Semester GPA: {selectedStudent.semesterGpa.toFixed(2)}</Text>
                </View>
                <Text style={styles.resultMeta}>CGPA: {selectedStudent.cgpa.toFixed(2)}</Text>
              </View>
            )}
            {showResult && selectedStudent && (
              <View style={styles.resultSheet}>
                <Text style={styles.resultSheetTitle}>Result Sheet</Text>
                {courses.map((course) => (
                  <View key={course.code} style={styles.resultRow}>
                    <View style={styles.resultCourseInfo}>
                      <Text style={styles.resultCourseTitle} numberOfLines={2}>{course.title}</Text>
                      <Text style={styles.resultCourseCode}>{course.code} • {course.credit} credit</Text>
                    </View>
                    <Text style={styles.resultCourseGrade}>
                      {(selectedStudent.grades[course.code] ?? 0).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {!canCalculate && (
            <View style={styles.lockedCard}>
              <Text style={styles.lockedTitle}>GPA Calculate locked</Text>
              <Text style={styles.lockedText}>Result দেখতে Student ID দিন, তারপর GPA calculate অপশন আসবে।</Text>
            </View>
          )}

          {canCalculate && (
            <>
              <TouchableOpacity
                onPress={() => setShowSemester((prev) => !prev)}
                activeOpacity={0.85}
                style={styles.semesterToggle}
              >
                <Text style={styles.semesterTitle}>3rd Year 1st Semester (3.1)</Text>
                <Text style={styles.semesterHint}>{showSemester ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
              {!showSemester && (
                <Text style={styles.noteText}>Tap to enter grades</Text>
              )}
              {showSemester && (
                <>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryLabel}>Total Credits</Text>
                      <Text style={styles.summaryValue}>{totalCredits}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryLabel}>GPA</Text>
                      <Text style={styles.summaryValue}>{gpa !== null ? gpa.toFixed(2) : '--'}</Text>
                    </View>
                  </View>
                  {shouldCompare && (
                    <View style={[styles.matchBox, isMatch ? styles.matchBoxOk : styles.matchBoxWarn]}>
                      <View style={styles.matchHeader}>
                        <Text style={[styles.matchTitle, isMatch ? styles.matchTitleOk : styles.matchTitleWarn]}>
                          {isMatch ? 'GPA match with your published result' : 'GPA unmatched'}
                        </Text>
                        <View style={[styles.matchBadge, isMatch ? styles.matchBadgeOk : styles.matchBadgeWarn]}>
                          <Text style={styles.matchBadgeText}>{isMatch ? 'MATCH' : 'UNMATCHED'}</Text>
                        </View>
                      </View>
                      <View style={styles.matchRow}>
                        <Text style={styles.matchLabel}>Calculated GPA</Text>
                        <Text style={[styles.matchValue, isMatch ? styles.matchValueOk : styles.matchValueWarn]}>
                          {gpa?.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.matchRow}>
                        <Text style={styles.matchLabel}>Published GPA</Text>
                        <Text style={styles.matchValue}>{selectedStudent?.semesterGpa.toFixed(2)}</Text>
                      </View>
                      {!isMatch && (
                        <View style={styles.matchRow}>
                          <Text style={styles.matchLabel}>Published CGPA</Text>
                          <Text style={styles.matchValue}>{selectedStudent?.cgpa.toFixed(2)}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {courses.map((course, index) => {
                    const isError = parsedPoints[index] !== null && !isValidPoint(parsedPoints[index] as number);
                    return (
                      <View key={course.code} style={styles.row}>
                        <View style={styles.courseInfo}>
                          <Text style={styles.courseTitle}>{course.title}</Text>
                          <Text style={styles.courseCode}>{course.code} • {course.credit} credit</Text>
                        </View>
                        <TextInput
                          value={gradeInputs[course.code]}
                          onChangeText={(value) => handleChange(course.code, value)}
                          keyboardType="numeric"
                          placeholder="0.00"
                          placeholderTextColor={Colors.textMuted}
                          style={[styles.input, isError && styles.inputError]}
                        />
                      </View>
                    );
                  })}

                  <View style={styles.noteBox}>
                    <Text style={styles.noteTitle}>নোট</Text>
                    <Text style={styles.noteText}>সব কোর্সের Grade Point দিলে GPA দেখাবে। স্কেলে ভিন্নতা থাকলে জানাবেন।</Text>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity onPress={handleResultCheck} activeOpacity={0.85}>
                      <LinearGradient
                        colors={Colors.gradients.success}
                        style={styles.actionBtn}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.actionText}>Check</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          )}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 24 },
  header: { padding: 22, paddingTop: 50, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerIcon: { fontSize: 34, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  summaryRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary },
  summaryValue: { fontSize: 20, fontWeight: '800', color: Colors.primaryDark, marginTop: 4 },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  resultSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  resultInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  resultInput: {
    flex: 1,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    backgroundColor: '#fff',
  },
  resultBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  resultBtnText: { color: Colors.textOnPrimary, fontWeight: '800' },
  resultMessage: { fontSize: 12, color: Colors.dangerDark, marginTop: 8 },
  resultDetails: {
    marginTop: 10,
    padding: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  resultName: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, flexShrink: 1 },
  resultMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  resultMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  resultSheet: {
    marginTop: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  resultSheetTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  resultCourseInfo: { flex: 1, minWidth: 0, paddingRight: 10 },
  resultCourseTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, lineHeight: 18 },
  resultCourseCode: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  resultCourseGrade: { fontSize: 13, fontWeight: '800', color: Colors.primaryDark },
  lockedCard: {
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    borderRadius: BorderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.2)',
  },
  lockedTitle: { fontSize: 13, fontWeight: '800', color: Colors.warning },
  lockedText: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  section: { padding: 18, gap: 12 },
  semesterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  semesterTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  semesterHint: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  courseInfo: { flex: 1, minWidth: 0, paddingRight: 10 },
  courseTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, lineHeight: 19, flexShrink: 1 },
  courseCode: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  input: {
    width: 70,
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
    color: Colors.textPrimary,
    backgroundColor: '#fff',
  },
  inputError: { borderColor: Colors.danger, color: Colors.danger },
  noteBox: {
    marginHorizontal: 18,
    marginTop: 4,
    backgroundColor: 'rgba(255,179,0,0.12)',
    borderRadius: BorderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,179,0,0.2)',
  },
  noteTitle: { fontWeight: '800', color: Colors.warning, marginBottom: 4 },
  noteText: { fontSize: 12, color: Colors.textSecondary },
  matchBox: {
    marginHorizontal: 18,
    marginTop: 12,
    borderRadius: BorderRadius.md,
    padding: 12,
    borderWidth: 1,
  },
  matchBoxOk: { backgroundColor: 'rgba(0,200,83,0.12)', borderColor: 'rgba(0,200,83,0.2)' },
  matchBoxWarn: { backgroundColor: 'rgba(255,82,82,0.12)', borderColor: 'rgba(255,82,82,0.25)' },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchTitle: { fontSize: 13, fontWeight: '800' },
  matchTitleOk: { color: Colors.successDark },
  matchTitleWarn: { color: Colors.dangerDark },
  matchBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  matchBadgeOk: { backgroundColor: 'rgba(0,200,83,0.2)' },
  matchBadgeWarn: { backgroundColor: 'rgba(255,82,82,0.2)' },
  matchBadgeText: { fontSize: 10, fontWeight: '900', color: Colors.textPrimary, letterSpacing: 0.6 },
  matchRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  matchLabel: { fontSize: 12, color: Colors.textSecondary },
  matchValue: { fontSize: 12, fontWeight: '800', color: Colors.textPrimary },
  matchValueOk: { color: Colors.successDark },
  matchValueWarn: { color: Colors.dangerDark },
  actions: { paddingHorizontal: 18, marginTop: 16 },
  actionBtn: { paddingVertical: 12, borderRadius: BorderRadius.lg, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '800' },
});
