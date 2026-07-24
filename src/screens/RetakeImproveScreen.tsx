import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../theme';
import { useAuth } from '../context';
import { gpaCourses } from '../data/gpaCourses';
import { gpaResults } from '../data/gpaResults';
import { normalizeStudentId } from '../utils/studentId';

type SemesterOption = {
  id: string;
  title: string;
};

type GradeInput = string;
type ExpectedGradeMap = Record<string, GradeInput>;

const semesters: SemesterOption[] = [
  { id: '3.1', title: '3rd Year 1st Semester (3.1)' },
];

const isValidPoint = (value: number) => value >= 0 && value <= 4;

export const RetakeImproveScreen: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [studentId, setStudentId] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [expectedGrades, setExpectedGrades] = useState<ExpectedGradeMap>({});
  const [showExpectedPage, setShowExpectedPage] = useState(false);

  useEffect(() => {
    if (!isAdmin && user?.studentId) {
      setStudentId(user.studentId);
    }
  }, [isAdmin, user?.studentId]);

  const effectiveStudentId = useMemo(() => {
    if (isAdmin) {
      return studentId.trim();
    }
    return user?.studentId?.trim() ?? '';
  }, [isAdmin, studentId, user?.studentId]);

  const matchedStudent = useMemo(() => {
    const term = normalizeStudentId(effectiveStudentId);
    if (!term) return null;
    return gpaResults.find((student) => normalizeStudentId(student.id) === term) || null;
  }, [effectiveStudentId]);

  const totalCredits = useMemo(
    () => gpaCourses.reduce((sum, course) => sum + course.credit, 0),
    []
  );

  const currentTotalPoints = useMemo(() => {
    if (!matchedStudent) return null;
    return gpaCourses.reduce((sum, course) => {
      return sum + course.credit * (matchedStudent.grades[course.code] ?? 0);
    }, 0);
  }, [matchedStudent]);

  const allSelectedValid = useMemo(() => {
    if (!selectedCourses.length) return false;
    return selectedCourses.every((code) => {
      const value = Number((expectedGrades[code] ?? '').trim());
      return Number.isFinite(value) && isValidPoint(value);
    });
  }, [selectedCourses, expectedGrades]);

  const canCalculate =
    matchedStudent &&
    selectedCourses.length > 0 &&
    allSelectedValid &&
    currentTotalPoints !== null;

  const recalculatedGpa = useMemo(() => {
    if (!canCalculate || !matchedStudent || currentTotalPoints === null) {
      return null;
    }
    let newTotal = currentTotalPoints;
    selectedCourses.forEach((code) => {
      const course = gpaCourses.find((c) => c.code === code);
      if (!course) return;
      const previous = matchedStudent.grades[code] ?? 0;
      const expected = Number((expectedGrades[code] ?? '').trim());
      newTotal = newTotal - previous * course.credit + expected * course.credit;
    });
    return newTotal / totalCredits;
  }, [canCalculate, matchedStudent, selectedCourses, expectedGrades, currentTotalPoints, totalCredits]);

  const currentGpa = matchedStudent?.semesterGpa ?? null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={Colors.gradients.midnight}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerIcon}>📈</Text>
        <Text style={styles.title}>Retake / Improve Result</Text>
        <Text style={styles.subtitle}>Retake বা Improve করলে সম্ভাব্য GPA দেখুন</Text>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Step 1: Semester বাছাই করুন</Text>
        {semesters.map((semester) => (
          <TouchableOpacity
            key={semester.id}
            onPress={() => {
              setSelectedSemester(semester.id);
              setSelectedCourses([]);
              setExpectedGrades({});
            }}
            activeOpacity={0.85}
            style={[
              styles.semesterCard,
              selectedSemester === semester.id && styles.semesterCardActive,
            ]}
          >
            <Text style={styles.semesterText}>{semester.title}</Text>
            <Text style={styles.semesterHint}>{selectedSemester === semester.id ? 'Selected' : 'Select'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedSemester && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 2: Student ID দিন</Text>
          <TextInput
            value={studentId}
            onChangeText={(value) => {
              if (isAdmin) {
                setStudentId(value);
                setSelectedCourses([]);
                setExpectedGrades({});
              }
            }}
            placeholder="Enter Student ID"
            placeholderTextColor={Colors.textMuted}
            style={[styles.input, !isAdmin && styles.inputDisabled]}
            editable={isAdmin}
          />
          {!isAdmin && user?.studentId && (
            <Text style={styles.metaText}>আপনি কেবল আপনার নিজের ID দিয়ে calculation করতে পারবেন</Text>
          )}
          {!studentId.trim() && isAdmin && (
            <Text style={styles.metaText}>ID না দিলে calculation হবে না</Text>
          )}
          {studentId.trim() && !matchedStudent && (
            <Text style={styles.metaText}>Result পাওয়া যায়নি</Text>
          )}
          {matchedStudent && (
            <View style={styles.studentCard}>
              <Text style={styles.studentName}>{matchedStudent.name}</Text>
              <Text style={styles.studentId}>{matchedStudent.id}</Text>
              <Text style={styles.studentMeta}>Published GPA: {matchedStudent.semesterGpa.toFixed(2)}</Text>
              <Text style={styles.studentMeta}>CGPA: {matchedStudent.cgpa.toFixed(2)}</Text>
            </View>
          )}
        </View>
      )}

      {selectedSemester && matchedStudent && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 3: Subject সিলেক্ট করুন</Text>
          {selectedCourses.length > 0 && (
            <Text style={styles.metaText}>Selected: {selectedCourses.length}</Text>
          )}
          {gpaCourses.map((course) => (
            <TouchableOpacity
              key={course.code}
              onPress={() => {
                setSelectedCourses((prev) =>
                  prev.includes(course.code)
                    ? prev.filter((code) => code !== course.code)
                    : [...prev, course.code]
                );
                setExpectedGrades((prev) => {
                  if (prev[course.code]) {
                    const next = { ...prev };
                    delete next[course.code];
                    return next;
                  }
                  return prev;
                });
              }}
              activeOpacity={0.85}
              style={[
                styles.courseCard,
                selectedCourses.includes(course.code) && styles.courseCardActive,
              ]}
            >
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseCode}>{course.code} • {course.credit} credit</Text>
              </View>
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeLabel}>Current</Text>
                <Text style={styles.gradeValue}>{matchedStudent.grades[course.code].toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setShowExpectedPage(true)}
            activeOpacity={0.85}
            style={[styles.nextBtn, selectedCourses.length === 0 && styles.nextBtnDisabled]}
            disabled={selectedCourses.length === 0}
          >
            <Text style={styles.nextBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showExpectedPage}
        animationType="slide"
        onRequestClose={() => setShowExpectedPage(false)}
      >
        <ScrollView style={styles.modalContainer} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={Colors.gradients.midnight}
            style={styles.modalHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.modalTitle}>Step 4: Expected GPA</Text>
            <Text style={styles.modalSubtitle}>Selected subjects: {selectedCourses.length}</Text>
          </LinearGradient>

          <View style={styles.section}>
            {selectedCourses.map((code) => {
              const course = gpaCourses.find((c) => c.code === code);
              const value = expectedGrades[code] ?? '';
              const numberValue = Number(value.trim());
              const isInvalid = value.trim().length > 0 && (!Number.isFinite(numberValue) || !isValidPoint(numberValue));
              return (
                <View key={code} style={styles.expectedRow}>
                  <View style={styles.expectedInfo}>
                    <Text style={styles.courseTitle}>{course?.title}</Text>
                    <Text style={styles.courseCode}>{code}</Text>
                  </View>
                  <TextInput
                    value={value}
                    onChangeText={(nextValue) =>
                      setExpectedGrades((prev) => ({ ...prev, [code]: nextValue }))
                    }
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    style={[styles.expectedInput, isInvalid && styles.expectedInputError]}
                  />
                </View>
              );
            })}
            {!allSelectedValid && (
              <Text style={styles.metaText}>সব সিলেক্টেড সাবজেক্টে 0.00 থেকে 4.00 দিন</Text>
            )}

            {canCalculate && recalculatedGpa !== null && (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>Expected Result</Text>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Published GPA</Text>
                  <Text style={styles.resultValue}>{currentGpa?.toFixed(2)}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>New GPA</Text>
                  <Text style={styles.resultValue}>{recalculatedGpa.toFixed(2)}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Change</Text>
                  <Text style={styles.resultValue}>
                    {(recalculatedGpa - (currentGpa ?? 0)).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setShowExpectedPage(false)}
              activeOpacity={0.85}
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    padding: 22,
    paddingTop: 50,
    paddingBottom: 28,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerIcon: { fontSize: 34, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  section: { padding: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  semesterCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  semesterCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(108,99,255,0.08)' },
  semesterText: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  semesterHint: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
  },
  metaText: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },
  studentCard: {
    marginTop: 12,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  studentName: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  studentId: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  studentMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 6 },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  courseCardActive: { borderColor: Colors.tertiary, backgroundColor: 'rgba(0,210,255,0.08)' },
  courseInfo: { flex: 1 },
  courseTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  courseCode: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  nextBtn: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: '#fff', fontWeight: '800' },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    padding: 22,
    paddingTop: 50,
    paddingBottom: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  modalSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  expectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  expectedInfo: { flex: 1, paddingRight: 10 },
  expectedInput: {
    width: 70,
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
    color: Colors.textPrimary,
    backgroundColor: '#fff',
  },
  expectedInputError: { borderColor: Colors.danger, color: Colors.danger },
  backBtn: {
    marginTop: 14,
    backgroundColor: Colors.tertiary,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  backBtnText: { color: '#fff', fontWeight: '800' },
  gradeBadge: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,179,0,0.12)',
  },
  gradeLabel: { fontSize: 10, color: Colors.textMuted },
  gradeValue: { fontSize: 13, fontWeight: '800', color: Colors.warning },
  resultBox: {
    marginTop: 12,
    backgroundColor: 'rgba(0,210,255,0.12)',
    borderRadius: BorderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,210,255,0.2)',
  },
  resultTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  resultLabel: { fontSize: 12, color: Colors.textSecondary },
  resultValue: { fontSize: 12, fontWeight: '800', color: Colors.textPrimary },
});
