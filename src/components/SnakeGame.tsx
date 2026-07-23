import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, PanResponder, Animated, Share, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const GRID_SIZE = 20;
const CELL = Math.floor((width - 80) / GRID_SIZE);

const randomPos = () => ({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) });

export const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [dir, setDir] = useState({ x: 1, y: 0 });
  const [food, setFood] = useState(randomPos);
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(120);
  const [sensitivity, setSensitivity] = useState(12);
  const [leaderboard, setLeaderboard] = useState<Array<{score:number;ts:number}>>([]);
  const foodScale = useRef(new Animated.Value(1)).current;
  const headAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (running) {
      intervalRef.current = setInterval(() => tick(), speed) as unknown as number;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [dir, running, speed]);

  const panHandlers = useRef<any>(null);
  useEffect(() => {
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gesture) => {
        const { dx, dy } = gesture;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > sensitivity) changeDir(1, 0);
          else if (dx < -sensitivity) changeDir(-1, 0);
        } else {
          if (dy > sensitivity) changeDir(0, 1);
          else if (dy < -sensitivity) changeDir(0, -1);
        }
      },
    });
    panHandlers.current = responder.panHandlers;
  }, [snake, sensitivity]);

  useEffect(() => {
    foodScale.setValue(0.8);
    Animated.spring(foodScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }, [food]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(headAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(headAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => { loadLeaderboard(); }, []);

  const LEADERBOARD_KEY = '@snake_leaderboard';
  const HIGH_SCORE_KEY = '@snake_high_score';

  async function loadLeaderboard() {
    try {
      const raw = await AsyncStorage.getItem(LEADERBOARD_KEY);
      if (raw) setLeaderboard(JSON.parse(raw));
      const hs = await AsyncStorage.getItem(HIGH_SCORE_KEY);
      if (hs) setHighScore(parseInt(hs));
    } catch (e) { /* ignore */ }
  }

  async function saveScoreEntry(sc: number) {
    try {
      const raw = await AsyncStorage.getItem(LEADERBOARD_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push({ score: sc, ts: Date.now() });
      arr.sort((a:any,b:any)=> b.score - a.score || b.ts - a.ts);
      const sliced = arr.slice(0, 20);
      await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(sliced));
      setLeaderboard(sliced);

      if (sc > highScore) {
        setHighScore(sc);
        await AsyncStorage.setItem(HIGH_SCORE_KEY, String(sc));
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      }
    } catch (e) { /* ignore */ }
  }

  useEffect(() => {
    if (!running) {
      if (score > 0) saveScoreEntry(score);
    }
  }, [running, score, highScore]);

  const exportLeaderboard = async () => {
    try {
      const data = JSON.stringify(leaderboard.slice(0, 10), null, 2);
      await Share.share({ message: data, title: 'Snake Leaderboard (top 10)' });
    } catch (e) { /* ignore */ }
  };

  const clearLeaderboard = async () => {
    try {
      await AsyncStorage.removeItem(LEADERBOARD_KEY);
      setLeaderboard([]);
    } catch (e) { /* ignore */ }
  };

  const tick = () => {
    if (!running) return;
    setSnake((s) => {
      const head = { x: (s[0].x + dir.x + GRID_SIZE) % GRID_SIZE, y: (s[0].y + dir.y + GRID_SIZE) % GRID_SIZE };
      const collided = s.some(p => p.x === head.x && p.y === head.y);
      if (collided) { setRunning(false); return s; }
      let next = [head, ...s];
      if (head.x === food.x && head.y === food.y) {
        setScore((q) => q + 1);
        setSpeed((sp) => Math.max(40, Math.floor(sp * 0.95)));
        let nf = randomPos();
        const occupied = (pos: any) => next.some(p => p.x === pos.x && p.y === pos.y);
        let attempts = 0;
        while (occupied(nf) && attempts < 200) { nf = randomPos(); attempts++; }
        setFood(nf);
      } else {
        next = next.slice(0, -1);
      }
      return next;
    });
  };

  const changeDir = (x: number, y: number) => {
    if (snake.length > 1 && snake[0].x + x === snake[1].x && snake[0].y + y === snake[1].y) return;
    setDir({ x, y });
  };

  const reset = () => { 
    setSnake([{ x: 10, y: 10 }]); 
    setDir({ x: 1, y: 0 }); 
    setFood(randomPos()); 
    setRunning(true); 
    setScore(0); 
    setSpeed(120); 
  };

  return (
    <ScrollView style={st.container} contentContainerStyle={st.contentContainer}>
      <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.header}>
        <Text style={st.title}>🐍 Snake Game</Text>
        <View style={st.statsRow}>
          <View style={st.statBox}>
            <Text style={st.statLabel}>Score</Text>
            <Text style={[st.statValue, { color: '#FFD700' }]}>{score}</Text>
          </View>
          <View style={st.statBox}>
            <Text style={st.statLabel}>High Score</Text>
            <Animated.Text style={[st.statValue, { color: '#00FF00', transform: [{ scale: scaleAnim }] }]}>{highScore}</Animated.Text>
          </View>
          <View style={st.statBox}>
            <Text style={st.statLabel}>Level</Text>
            <Text style={[st.statValue, { color: '#FF6B9D' }]}>{Math.max(1, Math.round(1000 / speed))}</Text>
          </View>
        </View>
      </LinearGradient>

      <View {...(panHandlers.current||{})} style={[st.board, { width: CELL * GRID_SIZE, height: CELL * GRID_SIZE }] }>
        {Array.from({ length: GRID_SIZE }).map((_, ry) => (
          <View key={ry} style={{ flexDirection: 'row' }}>
            {Array.from({ length: GRID_SIZE }).map((__, rx) => {
              const isSnake = snake.some(s => s.x === rx && s.y === ry);
              const isFood = food.x === rx && food.y === ry;
              if (isFood) {
                return <Animated.View key={rx} style={[st.cell, { width: CELL, height: CELL, justifyContent: 'center', alignItems: 'center' }]}>
                  <Animated.View style={{ width: CELL * 0.8, height: CELL * 0.8, borderRadius: 6, backgroundColor: Colors.secondary, transform: [{ scale: foodScale }] }} />
                </Animated.View>;
              }
              const segIndex = snake.findIndex(s => s.x === rx && s.y === ry);
              if (segIndex === 0) {
                const rotate = headAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '10deg'] });
                const scale = headAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
                return (
                  <View key={rx} style={[st.cell, { width: CELL, height: CELL, justifyContent: 'center', alignItems: 'center' }]}>
                    <Animated.View style={{ transform: [{ rotate }, { scale }] }}>
                      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={{ width: CELL * 0.85, height: CELL * 0.85, borderRadius: CELL * 0.15, justifyContent: 'center', alignItems: 'center' }} />
                    </Animated.View>
                  </View>
                );
              }
              if (segIndex > 0) {
                return <View key={rx} style={[st.cell, { width: CELL, height: CELL, backgroundColor: Colors.primaryDark }]} />;
              }
              return <View key={rx} style={[st.cell, { width: CELL, height: CELL, backgroundColor: '#f7f7f7' }]} />;
            })}
          </View>
        ))}
      </View>

      {!running && (
        <View style={st.overlay}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={st.overlayContent}>
            <MaterialCommunityIcons name="skull" size={48} color="#FFD700" />
            <Text style={st.gameOver}>Game Over!</Text>
            <Text style={st.overlayScore}>{score}</Text>
            {score > highScore && <Text style={st.newRecord}>🏆 New Record! 🏆</Text>}
            <TouchableOpacity onPress={reset} style={st.overlayBtn}>
              <MaterialCommunityIcons name="play-circle" size={20} color="#fff" />
              <Text style={st.overlayBtnText}>Play Again</Text>
            </TouchableOpacity>
            
            <View style={st.leaderboardBox}>
              <Text style={st.leaderboardTitle}>🏅 Top Scores</Text>
              {leaderboard.length === 0 ? (
                <Text style={st.leaderboardEmpty}>No scores yet</Text>
              ) : (
                leaderboard.slice(0, 5).map((r, i) => (
                  <View key={i} style={st.leaderboardItem}>
                    <Text style={st.leaderboardRank}>#{i + 1}</Text>
                    <Text style={st.leaderboardScore}>{r.score}</Text>
                  </View>
                ))
              )}
            </View>
          </LinearGradient>
        </View>
      )}

      <View style={st.controlsContainer}>
        <View style={st.sensitivityRow}>
          <Text style={st.sensitivityLabel}>Swipe Sensitivity</Text>
          <View style={st.sensitivityControl}>
            <TouchableOpacity onPress={() => setSensitivity(s => Math.max(4, s - 2))} style={st.sensitivityBtn}><Text style={st.sensitivityBtnText}>−</Text></TouchableOpacity>
            <Text style={st.sensitivityValue}>{sensitivity}</Text>
            <TouchableOpacity onPress={() => setSensitivity(s => Math.min(40, s + 2))} style={st.sensitivityBtn}><Text style={st.sensitivityBtnText}>+</Text></TouchableOpacity>
          </View>
        </View>

        <View style={st.controls}>
          <TouchableOpacity onPress={() => changeDir(0, -1)} style={st.ctrlCenter}><MaterialCommunityIcons name="chevron-up" size={32} color="#fff" /></TouchableOpacity>
          <View style={st.controlsRow}>
            <TouchableOpacity onPress={() => changeDir(-1, 0)} style={st.ctrlSide}><MaterialCommunityIcons name="chevron-left" size={32} color="#fff" /></TouchableOpacity>
            <TouchableOpacity onPress={() => changeDir(1, 0)} style={st.ctrlSide}><MaterialCommunityIcons name="chevron-right" size={32} color="#fff" /></TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => changeDir(0, 1)} style={st.ctrlCenter}><MaterialCommunityIcons name="chevron-down" size={32} color="#fff" /></TouchableOpacity>
        </View>

        <View style={st.actionButtons}>
          <TouchableOpacity onPress={() => setRunning(r => !r)} style={[st.actionBtn, { backgroundColor: running ? '#FF6B6B' : '#00C853' }]}>
            <MaterialCommunityIcons name={running ? 'pause' : 'play'} size={20} color="#fff" />
            <Text style={st.actionBtnText}>{running ? 'Pause' : 'Resume'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={reset} style={[st.actionBtn, { backgroundColor: '#667eea' }]}>
            <MaterialCommunityIcons name="restart" size={20} color="#fff" />
            <Text style={st.actionBtnText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={exportLeaderboard} style={[st.actionBtn, { backgroundColor: '#764ba2' }]}>
            <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
            <Text style={st.actionBtnText}>Export</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={clearLeaderboard} style={st.dangerBtn}>
          <Text style={st.dangerBtnText}>Clear Leaderboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  contentContainer: { paddingBottom: 32 },
  header: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 16, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, minWidth: 90 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 22, fontWeight: '900', marginTop: 4 },
  board: { backgroundColor: '#1a1a2e', alignSelf: 'center', borderRadius: 20, overflow: 'hidden', borderWidth: 4, borderColor: '#667eea', marginHorizontal: 20, marginTop: 24, shadowColor: '#667eea', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 12 },
  cell: { borderWidth: 0.5, borderColor: 'rgba(102, 126, 234, 0.2)' },
  controlsContainer: { paddingHorizontal: 20, marginTop: 24 },
  sensitivityRow: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  sensitivityLabel: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  sensitivityControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  sensitivityBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center' },
  sensitivityBtnText: { fontSize: 24, color: '#fff', fontWeight: '700' },
  sensitivityValue: { fontSize: 18, fontWeight: '800', color: '#667eea', minWidth: 40, textAlign: 'center' },
  controls: { alignItems: 'center', marginBottom: 16 },
  ctrlCenter: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#667eea', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  controlsRow: { flexDirection: 'row', gap: 12 },
  ctrlSide: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#764ba2', alignItems: 'center', justifyContent: 'center', shadowColor: '#764ba2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  actionButtons: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  dangerBtn: { paddingVertical: 12, borderRadius: 12, backgroundColor: '#ffe6e6', alignItems: 'center', borderWidth: 1, borderColor: '#FFB3B3' },
  dangerBtnText: { color: '#D32F2F', fontWeight: '700', fontSize: 13 },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  overlayContent: { backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 28, paddingVertical: 32, alignItems: 'center', width: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 20 },
  gameOver: { fontSize: 32, color: '#1a1a2e', fontWeight: '900', marginVertical: 12 },
  overlayScore: { fontSize: 48, fontWeight: '900', color: '#667eea', marginBottom: 8 },
  newRecord: { fontSize: 16, color: '#FFB300', fontWeight: '800', marginBottom: 16 },
  overlayBtn: { backgroundColor: '#667eea', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  overlayBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  leaderboardBox: { marginTop: 24, width: '100%', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E8ECF4' },
  leaderboardTitle: { fontSize: 14, fontWeight: '800', color: '#667eea', marginBottom: 12, textAlign: 'center' },
  leaderboardItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, alignItems: 'center' },
  leaderboardRank: { fontSize: 16, fontWeight: '700', color: '#667eea', minWidth: 40 },
  leaderboardScore: { fontSize: 16, fontWeight: '800', color: '#1a1a2e', flex: 1, textAlign: 'right' },
  leaderboardEmpty: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});

export default SnakeGame;
