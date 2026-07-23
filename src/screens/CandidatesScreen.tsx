import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVoting } from '../context';
import { Position, Candidate } from '../types';
import { Colors, BorderRadius } from '../theme';

const { width } = Dimensions.get('window');
const GRADS = [Colors.gradients.primary, Colors.gradients.ocean, Colors.gradients.sunset, Colors.gradients.success, Colors.gradients.purple, Colors.gradients.candy, Colors.gradients.info, Colors.gradients.warning];

export const CandidatesScreen: React.FC = () => {
  const { candidates, positions } = useVoting();
  const [selectedPosition, setSelectedPosition] = useState<Position | 'all'>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const filtered = selectedPosition === 'all' ? candidates : candidates.filter(c => c.position === selectedPosition);
  const posIdx = (id: Position) => positions.findIndex(p => p.id === id);

  return (
    <View style={styles.container}>
      {/* Filter */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <TouchableOpacity onPress={() => setSelectedPosition('all')} activeOpacity={0.8}>
            {selectedPosition === 'all' ? (
              <LinearGradient colors={Colors.gradients.primary} style={styles.pill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={[styles.pillText, { color: '#fff' }]}>✨ সকল</Text>
              </LinearGradient>
            ) : <View style={styles.pill}><Text style={styles.pillText}>সকল</Text></View>}
          </TouchableOpacity>
          {positions.map((p, i) => (
            <TouchableOpacity key={p.id} onPress={() => setSelectedPosition(p.id)} activeOpacity={0.8}>
              {selectedPosition === p.id ? (
                <LinearGradient colors={GRADS[i % GRADS.length]} style={styles.pill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={[styles.pillText, { color: '#fff' }]}>{p.id}</Text>
                </LinearGradient>
              ) : <View style={styles.pill}><Text style={styles.pillText}>{p.id}</Text></View>}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.count}>{filtered.length} জন প্রার্থী</Text>
      </View>

      {/* List */}
      <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
        {filtered.map(c => {
          const g = GRADS[posIdx(c.position) % GRADS.length];
          return (
            <TouchableOpacity key={c.id} style={styles.card} onPress={() => setSelectedCandidate(c)} activeOpacity={0.9}>
              <LinearGradient colors={g} style={styles.strip} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <View style={styles.cardRow}>
                <LinearGradient colors={g} style={styles.sym}><Text style={{ fontSize: 26 }}>{c.symbol}</Text></LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{c.name}</Text>
                  <Text style={styles.pos}>{positions.find(p => p.id === c.position)?.titleBn}</Text>
                  <Text style={styles.dept}>{c.department} • {c.session}</Text>
                </View>
                <View style={styles.voteBox}>
                  <Text style={styles.voteNum}>{c.votes}</Text>
                  <Text style={styles.voteLbl}>ভোট</Text>
                </View>
              </View>
              {c.manifesto ? <Text style={styles.manifestoPrev} numberOfLines={2}>📜 {c.manifesto}</Text> : null}
            </TouchableOpacity>
          );
        })}
        {filtered.length === 0 && <View style={{ alignItems: 'center', paddingVertical: 60 }}><Text style={{ fontSize: 50 }}>📭</Text><Text style={{ fontSize: 16, color: Colors.textMuted, marginTop: 12 }}>কোনো প্রার্থী পাওয়া যায়নি</Text></View>}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal */}
      <Modal visible={!!selectedCandidate} animationType="slide" onRequestClose={() => setSelectedCandidate(null)}>
        {selectedCandidate && (
          <View style={{ flex: 1, backgroundColor: Colors.background }}>
            <LinearGradient colors={GRADS[posIdx(selectedCandidate.position) % GRADS.length]} style={styles.modalHead} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.modalTopRow}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>প্রার্থীর বিস্তারিত</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedCandidate(null)}>
                  <Text style={{ fontSize: 16, color: '#fff', fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.bigSym}><Text style={{ fontSize: 45 }}>{selectedCandidate.symbol}</Text></View>
              <Text style={styles.bigName}>{selectedCandidate.name}</Text>
              <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>{positions.find(p => p.id === selectedCandidate.position)?.titleBn}</Text>
            </LinearGradient>
            <ScrollView style={{ flex: 1, padding: 20 }}>
              <View style={styles.infoGrid}>
                {[{ icon: '🏛️', label: 'বিভাগ', val: selectedCandidate.department }, { icon: '📅', label: 'সেশন', val: selectedCandidate.session }, { icon: '🎓', label: 'ID', val: selectedCandidate.studentId }, { icon: '🗳️', label: 'ভোট', val: `${selectedCandidate.votes}` }].map((item, i) => (
                  <View key={i} style={styles.infoItem}>
                    <Text style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</Text>
                    <Text style={{ fontSize: 12, color: Colors.textMuted, marginBottom: 4 }}>{item.label}</Text>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'center' }}>{item.val}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.manifestoBox}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.primary, marginBottom: 12 }}>📜 ইশতেহার</Text>
                <Text style={{ fontSize: 15, color: Colors.textPrimary, lineHeight: 24 }}>{selectedCandidate.manifesto}</Text>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterWrap: { backgroundColor: '#fff', paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pill: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 100, backgroundColor: Colors.background },
  pillText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  count: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  strip: { height: 4 },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 },
  sym: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  name: { fontSize: 17, fontWeight: 'bold', color: Colors.textPrimary },
  pos: { fontSize: 13, color: Colors.primary, fontWeight: '700', marginTop: 2 },
  dept: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  voteBox: { alignItems: 'center', backgroundColor: Colors.background, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  voteNum: { fontSize: 22, fontWeight: '900', color: Colors.primary },
  voteLbl: { fontSize: 11, color: Colors.textMuted },
  manifestoPrev: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic', paddingHorizontal: 16, paddingBottom: 14, lineHeight: 19 },
  modalHead: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20, alignItems: 'center' },
  modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  bigSym: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  bigName: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 4 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  infoItem: { width: (width - 52) / 2, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  manifestoBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
});
