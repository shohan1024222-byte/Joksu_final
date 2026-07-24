import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, BorderRadius } from '../theme';
import { gpaResults, StudentResult } from '../data/gpaResults';
import { loadGpaResults } from '../data/gpaStore';
import { useAuth } from '../context/AuthContext';
import { normalizeStudentId } from '../utils/studentId';

type RankedStudent = StudentResult & { rank: number; score: number };

type ScoreKey = 'semesterGpa' | 'cgpa';

const buildRanking = (students: StudentResult[], key: ScoreKey): RankedStudent[] => {
  const sorted = [...students].sort((a, b) => {
    const diff = b[key] - a[key];
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });

  let lastScore: number | null = null;
  let lastRank = 0;

  return sorted.map((student, index) => {
    const score = student[key];
    const rank = lastScore !== null && score === lastScore ? lastRank : index + 1;
    lastScore = score;
    lastRank = rank;
    return { ...student, rank, score };
  });
};

export const GpaRankingScreen: React.FC = () => {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [results, setResults] = useState<StudentResult[]>(gpaResults);

  const fullSemesterRanking = useMemo(() => buildRanking(results, 'semesterGpa'), [results]);
  const fullCgpaRanking = useMemo(() => buildRanking(results, 'cgpa'), [results]);

  const visibleSemesterRanking = useMemo(() => {
    if (isAdmin) return fullSemesterRanking;
    if (!user) return [];
    const currentId = normalizeStudentId(user.studentId);
    return fullSemesterRanking.filter((student) => normalizeStudentId(student.id) === currentId);
  }, [fullSemesterRanking, user, isAdmin]);

  const visibleCgpaRanking = useMemo(() => {
    if (isAdmin) return fullCgpaRanking;
    if (!user) return [];
    const currentId = normalizeStudentId(user.studentId);
    return fullCgpaRanking.filter((student) => normalizeStudentId(student.id) === currentId);
  }, [fullCgpaRanking, user, isAdmin]);

  const refreshResults = useCallback(async () => {
    const storedResults = await loadGpaResults();
    setResults(storedResults);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshResults();
    }, [refreshResults])
  );

  const semesterRanking = visibleSemesterRanking;
  const cgpaRanking = visibleCgpaRanking;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={Colors.gradients.primary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerIcon}>🏅</Text>
        <Text style={styles.title}>GPA Ranking</Text>
        <Text style={styles.subtitle}>GPA এবং CGPA অনুযায়ী পজিশন</Text>
      </LinearGradient>

      {!isAuthenticated ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>로그인 필요</Text>
          <Text style={styles.rankInfo}>আপনি লগইন করলে আপনার নিজস্ব র‍্যাঙ্ক দেখানো হবে।</Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Semester GPA Position</Text>
            {semesterRanking.length ? (
              semesterRanking.map((student) => (
                <View key={`gpa-${student.id}`} style={styles.rankRow}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankValue}>{student.rank}</Text>
                  </View>
                  <View style={styles.rankInfo}>
                    <Text style={styles.rankName}>{student.name}</Text>
                    <Text style={styles.rankId}>{student.id}</Text>
                  </View>
                  <Text style={styles.rankScore}>{student.score.toFixed(2)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.rankInfo}>আপনার রেজাল্ট পাওয়া যায়নি।</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CGPA Position</Text>
            {cgpaRanking.length ? (
              cgpaRanking.map((student) => (
                <View key={`cgpa-${student.id}`} style={styles.rankRow}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankValue}>{student.rank}</Text>
                  </View>
                  <View style={styles.rankInfo}>
                    <Text style={styles.rankName}>{student.name}</Text>
                    <Text style={styles.rankId}>{student.id}</Text>
                  </View>
                  <Text style={styles.rankScore}>{student.score.toFixed(2)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.rankInfo}>আপনার রেজাল্ট পাওয়া যায়নি।</Text>
            )}
          </View>
        </>
      )}
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
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  section: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(108,99,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankValue: { fontWeight: '800', color: Colors.primary },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  rankId: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rankScore: { fontSize: 14, fontWeight: '800', color: Colors.primaryDark },
});
