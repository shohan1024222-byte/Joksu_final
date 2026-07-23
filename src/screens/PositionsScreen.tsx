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

const CARD_GRADIENTS = [
  Colors.gradients.primary,
  Colors.gradients.ocean,
  Colors.gradients.sunset,
  Colors.gradients.success,
  Colors.gradients.purple,
  Colors.gradients.candy,
  Colors.gradients.info,
  Colors.gradients.warning,
];

export const PositionsScreen: React.FC = () => {
  const { positions, candidates } = useVoting();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradients.dark}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerEmoji}>📋</Text>
        <Text style={styles.headerTitle}>পদসমূহের তালিকা</Text>
        <Text style={styles.headerSubtitle}>List of All Positions</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>মোট {positions.length} টি পদ</Text>
        </View>
      </LinearGradient>

      {/* Positions */}
      <View style={styles.listContainer}>
        {positions.map((position, index) => {
          const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
          const positionCandidates = candidates.filter(c => c.position === position.id);
          const totalVotes = positionCandidates.reduce((sum, c) => sum + c.votes, 0);

          return (
            <View key={position.id} style={styles.card}>
              {/* Card top gradient strip */}
              <LinearGradient
                colors={gradient}
                style={styles.cardStrip}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />

              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <LinearGradient
                    colors={gradient}
                    style={styles.numberBadge}
                  >
                    <Text style={styles.numberText}>{index + 1}</Text>
                  </LinearGradient>

                  <View style={styles.codeBadge}>
                    <Text style={styles.codeText}>{position.id}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.bnTitle}>{position.titleBn}</Text>
                  <Text style={styles.enTitle}>{position.title}</Text>
                  <Text style={styles.description}>{position.description}</Text>
                </View>

                {/* Stats row */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>👥</Text>
                    <Text style={styles.statValue}>{positionCandidates.length}</Text>
                    <Text style={styles.statLabel}>প্রার্থী</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>🗳️</Text>
                    <Text style={styles.statValue}>{totalVotes}</Text>
                    <Text style={styles.statLabel}>ভোট</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>🏆</Text>
                    <Text style={styles.statValue}>
                      {positionCandidates.length > 0
                        ? [...positionCandidates].sort((a, b) => b.votes - a.votes)[0]?.symbol || '-'
                        : '-'}
                    </Text>
                    <Text style={styles.statLabel}>অগ্রণী</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>

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
  header: {
    padding: 24,
    alignItems: 'center',
  },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 14,
  },
  totalBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  totalBadgeText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: { padding: 16 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardStrip: { height: 5 },
  cardContent: { padding: 18 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  codeBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  codeText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardBody: { marginBottom: 14 },
  bnTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  enTitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
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
