import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, BorderRadius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { gpaCourses, GpaCourse } from '../data/gpaCourses';
import { gpaResults, StudentResult } from '../data/gpaResults';
import { loadGpaCourses, loadGpaResults } from '../data/gpaStore';

export const GpaCheckScreen: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [courses, setCourses] = useState<GpaCourse[]>(gpaCourses);
  const [results, setResults] = useState<StudentResult[]>(gpaResults);
  const [query, setQuery] = useState(isAdmin ? '' : user?.studentId ?? '');
  const [showSemester, setShowSemester] = useState(false);
  const totalCredits = useMemo(() => courses.reduce((sum, course) => sum + course.credit, 0), [courses]);

  useEffect(() => {
    if (!isAdmin) {
      setQuery(user?.studentId ?? '');
    }
  }, [user, isAdmin]);

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

  const matchedStudent = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return null;
    return results.find((student) => student.id.toLowerCase() === term) || null;
  }, [query, results]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={Colors.gradients.dark}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerIcon}>🎓</Text>
        <Text style={styles.title}>GPA Check</Text>
        <Text style={styles.subtitle}>ফর্মুলা এবং কোর্স তালিকা</Text>
      </LinearGradient>

      <View style={styles.section}>
        <Pressable
          onPress={() => setShowSemester((prev) => !prev)}
          style={styles.semesterToggle}
        >
          <Text style={styles.semesterTitle}>3rd Year 1st Semester (3.1)</Text>
          <Text style={styles.semesterHint}>{showSemester ? 'Hide' : 'Show'}</Text>
        </Pressable>
        {!showSemester && (
          <Text style={styles.metaText}>Tap to view semester details</Text>
        )}
        {showSemester && (
          <>
            <Text style={styles.sectionTitle}>🧾 Result Sheet (3.1)</Text>
            {isAdmin ? (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Enter Student ID"
                placeholderTextColor={Colors.textMuted}
                style={styles.searchInput}
              />
            ) : (
              <View style={styles.lockedInfo}>
                <Text style={styles.lockedText}>আপনার Student ID ({user?.studentId ?? 'শূন্য'}) অনুযায়ী ফলাফল দেখানো হচ্ছে।</Text>
              </View>
            )}
            {!isAdmin && !user && (
              <Text style={styles.metaText}>লগইন করে আপনার রেজাল্ট দেখুন।</Text>
            )}
            {isAdmin && !query.trim() && (
              <Text style={styles.metaText}>Student ID দিয়ে সার্চ করুন</Text>
            )}
            {query.trim() && !matchedStudent && (
              <Text style={styles.metaText}>Result পাওয়া যায়নি</Text>
            )}
            {matchedStudent && (
              <>
                <View style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <View>
                      <Text style={styles.resultName}>{matchedStudent.name}</Text>
                      <Text style={styles.resultId}>{matchedStudent.id}</Text>
                    </View>
                    <View style={styles.gpaPill}>
                      <Text style={styles.gpaLabel}>Semester GPA</Text>
                      <Text style={styles.gpaValue}>{matchedStudent.semesterGpa.toFixed(2)}</Text>
                    </View>
                  </View>
                  <View style={styles.cgpaRow}>
                    <Text style={styles.cgpaLabel}>CGPA</Text>
                    <Text style={styles.cgpaValue}>{matchedStudent.cgpa.toFixed(2)}</Text>
                  </View>
                </View>
                <View style={styles.resultSheet}>
                  <Text style={styles.resultSheetTitle}>Subject-wise GPA</Text>
                  {courses.map((course) => (
                    <View key={course.code} style={styles.resultRow}>
                      <View style={styles.resultCourseInfo}>
                        <Text style={styles.resultCourseTitle} numberOfLines={2}>{course.title}</Text>
                        <Text style={styles.resultCourseCode}>{course.code} • {course.credit} credit</Text>
                      </View>
                      <Text style={styles.resultCourseGrade}>
                        {(matchedStudent.grades[course.code] ?? 0).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            <View style={styles.formulaBox}>
              <Text style={styles.formulaTitle}>GPA সূত্র</Text>
              <Text style={styles.formulaText}>
                GPA = Σ (Credit × Grade Point) / Total Credits
              </Text>
              <Text style={styles.creditText}>Total Credits: {totalCredits}</Text>
            </View>
            <Text style={styles.sectionTitle}>📚 ৩.১ সেমিস্টারের কোর্স</Text>
            {courses.map((course, index) => (
              <View key={course.code} style={styles.courseCard}>
                <View style={styles.courseLeft}>
                  <Text style={styles.courseIndex}>{index + 1}</Text>
                </View>
                <View style={styles.courseBody}>
                  <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                  <Text style={styles.courseCode}>{course.code}</Text>
                </View>
                <View style={styles.creditBadge}>
                  <Text style={styles.creditValue}>{course.credit}</Text>
                  <Text style={styles.creditLabel}>credit</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </View>
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
  formulaBox: {
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  formulaTitle: { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 6 },
  formulaText: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  creditText: { marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  section: { padding: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  semesterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  semesterTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  semesterHint: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: BorderRadius.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  courseLeft: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(108,99,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  courseIndex: { fontWeight: '800', color: Colors.primary },
  courseBody: { flex: 1, minWidth: 0 },
  courseTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, lineHeight: 19, flexShrink: 1 },
  courseCode: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  creditBadge: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,210,255,0.12)',
  },
  creditValue: { fontWeight: '800', color: Colors.tertiary },
  creditLabel: { fontSize: 10, color: Colors.textMuted },
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    color: Colors.textPrimary,
  },
  metaText: { fontSize: 12, color: Colors.textMuted, marginBottom: 10 },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, flexShrink: 1, paddingRight: 8 },
  resultId: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  resultSheet: {
    marginBottom: 14,
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
    backgroundColor: 'rgba(108,99,255,0.08)',
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
  gpaPill: {
    backgroundColor: 'rgba(0,210,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  gpaLabel: { fontSize: 10, color: Colors.textMuted },
  gpaValue: { fontSize: 14, fontWeight: '800', color: Colors.tertiary },
  cgpaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cgpaLabel: { fontSize: 12, color: Colors.textSecondary },
  cgpaValue: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
});
