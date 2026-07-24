import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVoting } from '../context';
import { Colors, BorderRadius } from '../theme';

const { width } = Dimensions.get('window');

const POSITION_GRADIENTS = [
  Colors.gradients.primary,
  Colors.gradients.ocean,
  Colors.gradients.sunset,
  Colors.gradients.success,
  Colors.gradients.purple,
  Colors.gradients.candy,
  Colors.gradients.info,
  Colors.gradients.warning,
];

const BAR_COLORS = [
  ['#6C63FF', '#B24BF3'],
  ['#448AFF', '#00BCD4'],
  ['#FF6B6B', '#FF8E53'],
  ['#00C853', '#00E676'],
  ['#9C27B0', '#E040FB'],
  ['#FF6B6B', '#B24BF3'],
];

export const ResultsScreen: React.FC = () => {
  const { candidates, positions, getResults } = useVoting();
  const results = getResults();
  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Header */}
      <LinearGradient
        colors={Colors.gradients.dark}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerDecor} />
        <Text style={styles.headerIcon}>📊</Text>
        <Text style={styles.title}>নির্বাচনী ফলাফল</Text>
        <Text style={styles.subtitle}>Election Results 2026</Text>

        {/* Total votes badge */}
        <View style={styles.totalVoteCard}>
          <LinearGradient
            colors={Colors.gradients.aurora}
            style={styles.totalVoteGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.totalVoteLabel}>মোট ভোট</Text>
            <Text style={styles.totalVoteCount}>{totalVotes}</Text>
          </LinearGradient>
        </View>
      </LinearGradient>

      {/* Results by Position */}
      {positions.map((position, posIndex) => {
        const positionCandidates = results.get(position.id) || [];
        const positionTotalVotes = positionCandidates.reduce((sum, c) => sum + c.votes, 0);
        const gradient = POSITION_GRADIENTS[posIndex % POSITION_GRADIENTS.length];

        return (
          <View key={position.id} style={styles.positionContainer}>
            {/* Position Header */}
            <LinearGradient
              colors={gradient}
              style={styles.positionHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.positionTitle}>{position.titleBn}</Text>
              <Text style={styles.positionSubtitle}>{position.title}</Text>
              <Text style={styles.positionVotes}>
                🗳️ {positionTotalVotes} টি ভোট পড়েছে
              </Text>
            </LinearGradient>

            {positionCandidates.length === 0 ? (
              <View style={styles.noCandidates}>
                <Text style={styles.noCandidatesText}>এই পদের জন্য কোন প্রার্থী নেই</Text>
              </View>
            ) : (
              <View style={styles.candidatesContainer}>
                {positionCandidates.map((candidate, index) => {
                  const percentage = positionTotalVotes > 0
                    ? Math.round((candidate.votes / positionTotalVotes) * 100)
                    : 0;
                  const isWinner = index === 0 && candidate.votes > 0;
                  const barGradient = BAR_COLORS[index % BAR_COLORS.length];

                  return (
                    <View
                      key={candidate.id}
                      style={[styles.candidateResult, isWinner && styles.winnerResult]}
                    >
                      {isWinner && (
                        <LinearGradient
                          colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']}
                          style={styles.winnerGlow}
                        />
                      )}
                      <View style={styles.candidateInfo}>
                        <View style={styles.rankBadge}>
                          {isWinner ? (
                            <LinearGradient
                              colors={Colors.gradients.gold}
                              style={styles.rankGradient}
                            >
                              <Text style={styles.crownIcon}>👑</Text>
                            </LinearGradient>
                          ) : (
                            <View style={styles.rankNumber}>
                              <Text style={styles.rankText}>{index + 1}</Text>
                            </View>
                          )}
                        </View>

                        <LinearGradient
                          colors={gradient}
                          style={styles.symbolContainer}
                        >
                          <Text style={styles.symbolText}>{candidate.symbol}</Text>
                        </LinearGradient>

                        <View style={styles.nameContainer}>
                          <Text style={styles.candidateName}>{candidate.name}</Text>
                          <Text style={styles.candidateDept}>{candidate.department}</Text>
                        </View>

                        <View style={styles.votesInfo}>
                          <Text style={[styles.votesCount, isWinner && styles.winnerVotes]}>
                            {candidate.votes}
                          </Text>
                          <Text style={styles.votesLabel}>ভোট</Text>
                          <View style={[styles.percentBadge, isWinner && styles.winnerPercentBadge]}>
                            <Text style={[styles.percentText, isWinner && styles.winnerPercentText]}>
                              {percentage}%
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.progressBar}>
                        <LinearGradient
                          colors={barGradient as any}
                          style={[styles.progressFill, { width: `${Math.max(percentage, 2)}%` }]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {/* Footer */}
      <LinearGradient
        colors={Colors.gradients.dark}
        style={styles.footer}
      >
        <Text style={styles.footerText}>JOKSHU Election 2026</Text>
        <Text style={styles.footerSubtext}>Jagannath University</Text>
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  // Header
  header: {
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    top: -80,
    right: -60,
  },
  headerIcon: { fontSize: 44, marginBottom: 8 },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  totalVoteCard: {
    marginTop: 18,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  totalVoteGradient: {
    paddingHorizontal: 30,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  totalVoteLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  totalVoteCount: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.white,
  },
  // Position
  positionContainer: {
    margin: 16,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  positionHeader: {
    padding: 18,
    alignItems: 'center',
  },
  positionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  positionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
  },
  positionVotes: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
    fontWeight: '600',
  },
  noCandidates: { padding: 30, alignItems: 'center' },
  noCandidatesText: { fontSize: 15, color: Colors.textMuted, fontStyle: 'italic' },
  candidatesContainer: { padding: 16 },
  candidateResult: {
    marginBottom: 16,
    position: 'relative',
  },
  winnerResult: {
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
    borderRadius: BorderRadius.md,
    padding: 12,
    margin: -6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  winnerGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: BorderRadius.md,
  },
  candidateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rankBadge: { marginRight: 10, minWidth: 38 },
  rankGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crownIcon: { fontSize: 18 },
  rankNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  symbolContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  symbolText: { fontSize: 22 },
  nameContainer: { flex: 1 },
  candidateName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  candidateDept: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  votesInfo: { alignItems: 'center', minWidth: 60 },
  votesCount: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  winnerVotes: { color: Colors.warning },
  votesLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  percentBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  winnerPercentBadge: {
    backgroundColor: 'rgba(255, 179, 0, 0.15)',
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  winnerPercentText: { color: Colors.warning },
  progressBar: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Footer
  footer: {
    alignItems: 'center',
    padding: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  footerSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
});
