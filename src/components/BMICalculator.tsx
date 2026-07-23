import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

type BmiProfile = {
  label: string;
  summary: string;
  accent: readonly [string, string];
  border: string;
  foodTitle: string;
  foods: string[];
  avoid: string[];
  habits: string[];
  note: string;
};

export const BMICalculator: React.FC = () => {
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [kg, setKg] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<BmiCategory | null>(null);
  const scaleAnim = useMemo(() => new Animated.Value(0), []);

  const calc = () => {
    const f = parseFloat(feet) || 0;
    const i = parseFloat(inches) || 0;
    const w = parseFloat(kg) || 0;
    const totalInches = f * 12 + i;
    const meters = totalInches * 0.0254;
    if (meters <= 0 || w <= 0) return;
    const val = w / (meters * meters);
    const rounded = Math.round(val * 10) / 10;
    setBmi(rounded);
    Animated.spring(scaleAnim, { toValue: 1, bounciness: 12, useNativeDriver: true }).start();
    setCategory(getBmiCategory(rounded));
  };

  const getBmiCategory = (v: number): BmiCategory => {
    if (v < 18.5) return 'underweight';
    if (v < 25) return 'normal';
    if (v < 30) return 'overweight';
    return 'obese';
  };

  const profile = useMemo<BmiProfile | null>(() => {
    if (category === null) return null;

    const profiles: Record<BmiCategory, BmiProfile> = {
      underweight: {
        label: 'আপনি পাতলা (Underweight)',
        summary: 'শরীরে শক্তি ও পুষ্টির ঘাটতি থাকতে পারে। ধীরে ধীরে ওজন বাড়ানোই লক্ষ্য হওয়া উচিত।',
        accent: Colors.gradients.sunset,
        border: Colors.warning,
        foodTitle: 'যে খাবারগুলো বেশি খাবেন',
        foods: [
          'ডিম, দুধ, দই, পনির',
          'মুরগি, মাছ, গরুর মাংস (পরিমাণমতো)',
          'কলা, খেজুর, আনারস, আম',
          'ভাত, রুটি, আলু, ওটস',
          'বাদাম, চিনাবাদাম, কাজু, তিল',
          'ডাল, ছোলা, সয়াবিন, খিচুড়ি',
        ],
        avoid: [
          'খাবার স্কিপ করবেন না',
          'খুব বেশি জাঙ্ক/ফাস্ট ফুডে ভরসা করবেন না',
          'খুব বেশি চা-কফি খেলে ক্ষুধা কমে যেতে পারে',
        ],
        habits: [
          'দিনে ৩টি বড় খাবার আর ২-৩টি স্ন্যাকস নিন',
          'প্রতিবার খাবারে প্রোটিন রাখুন',
          'হালকা strength exercise করুন',
          'পর্যাপ্ত ঘুম নিন',
        ],
        note: 'দ্রুত ওজন বাড়ানোর জন্য শুধু মিষ্টি বা তেল-চর্বি নয়, পুষ্টিকর ক্যালরি দরকার।',
      },
      normal: {
        label: 'আপনি স্বাভাবিক (Normal)',
        summary: 'আপনার BMI স্বাস্থ্যকর রেঞ্জে আছে। এই ভারসাম্য ধরে রাখাই মূল লক্ষ্য।',
        accent: Colors.gradients.success,
        border: Colors.success,
        foodTitle: 'যে খাবারগুলো নিয়মিত রাখবেন',
        foods: [
          'সবজি, সালাদ, ফলমূল',
          'ডাল, ডিম, মাছ, মুরগি',
          'বাদাম, বীজ, দই',
          'আটা/লাল চাল/ওটস',
          'পর্যাপ্ত পানি',
          'পরিমিত ঘি/তেল',
        ],
        avoid: [
          'অতিরিক্ত চিনি ও কোমল পানীয় কমান',
          'রাতে অতিভোজ এড়িয়ে চলুন',
          'প্রসেসড স্ন্যাকস কম খান',
        ],
        habits: [
          'সপ্তাহে অন্তত ৫ দিন হাঁটা/ব্যায়াম করুন',
          'খাবারের প্লেটে half veggies রাখুন',
          'ঘুম ৭-৮ ঘণ্টা রাখুন',
          'শরীরের মাপ মাসে একবার দেখুন',
        ],
        note: 'ওজন ঠিক থাকলেও ফিটনেস, ঘুম আর খাদ্যাভ্যাস ঠিক রাখা জরুরি।',
      },
      overweight: {
        label: 'আপনি ওভারওয়েট (Overweight)',
        summary: 'ওজন কিছুটা বেশি। ছোট পরিবর্তনেই ধীরে ধীরে BMI ভালো করা যায়।',
        accent: Colors.gradients.warning,
        border: Colors.warning,
        foodTitle: 'যে খাবারগুলো কমিয়ে/সঠিকভাবে খাবেন',
        foods: [
          'সালাদ, শসা, টমেটো, পেঁপে',
          'গ্রিলড/সেদ্ধ মাছ, চিকেন',
          'ডাল, ছোলা, মসুর, মুগ',
          'আটা রুটি, ব্রাউন রাইস, ওটস',
          'আপেল, কমলা, পেয়ারা, বেরি',
          'লো-ফ্যাট দই, টক দই',
        ],
        avoid: [
          'তেলেভাজা, বার্গার, পিৎজা, স্ন্যাকস কমান',
          'সফট ড্রিংক, অতিরিক্ত মিষ্টি এড়িয়ে চলুন',
          'রাতে ভারী খাবার কমান',
        ],
        habits: [
          'প্রতিদিন ৩০-৪৫ মিনিট হাঁটুন',
          'portion control করুন',
          'খাবার ধীরে খান',
          'সপ্তাহে ২-৩ দিন strength training যোগ করুন',
        ],
        note: 'কঠোর ডায়েট নয়, বরং ধারাবাহিক control-ই সবচেয়ে কার্যকর।',
      },
      obese: {
        label: 'আপনি স্থূল/Obese',
        summary: 'BMI বেশি। স্বাস্থ্যঝুঁকি কমাতে খাবার, ঘুম আর চলাফেরা নিয়ন্ত্রণ করা দরকার।',
        accent: Colors.gradients.danger,
        border: Colors.danger,
        foodTitle: 'যে খাবারগুলো অগ্রাধিকার দেবেন',
        foods: [
          'সবজি, লেটুস, শাক, ব্রকলি',
          'সেদ্ধ/গ্রিলড মাছ, চিকেন, ডিম',
          'ডাল, স্যুপ, ছোলা',
          'ফলমূল: আপেল, পেয়ারা, কমলা',
          'ওটস, লাল চাল, রুটি পরিমিত',
          'পর্যাপ্ত পানি, লেবু পানি (চিনি ছাড়া)',
        ],
        avoid: [
          'ভাজাপোড়া, মিষ্টি, ফাস্ট ফুড কমান',
          'রাত জেগে স্ন্যাকিং বন্ধ করুন',
          'খাবারের সাথে অতিরিক্ত সফট ড্রিংক নয়',
        ],
        habits: [
          'চিকিৎসক/ডায়েটিশিয়ানের পরামর্শ নিন',
          'ক্যালরি ট্র্যাক করুন',
          'প্রতিদিন হাঁটা দিয়ে শুরু করুন',
          'ঘুম আর স্ট্রেস ম্যানেজ করুন',
        ],
        note: 'যদি শ্বাসকষ্ট, উচ্চ রক্তচাপ বা ডায়াবেটিস থাকে, পেশাদার পরামর্শ জরুরি।',
      },
    };

    return profiles[category];
  }, [category]);

  const fillWidth = bmi === null
    ? '0%'
    : `${Math.min(100, Math.max(15, (bmi / 40) * 100))}%`;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.contentContainer}>
      <LinearGradient colors={Colors.gradients.aurora} style={s.hero}>
        <Text style={s.kicker}>স্বাস্থ্য বিশ্লেষণ</Text>
        <Text style={s.title}>BMI ক্যালকুলেটর</Text>
        <Text style={s.heroText}>আপনার BMI অনুযায়ী বিস্তারিত খাদ্য পরামর্শ, লাইফস্টাইল টিপস এবং স্বাস্থ্য গাইডেন্স পান।</Text>
      </LinearGradient>

      <View style={s.formCard}>
        <Text style={s.sectionTitle}>আপনার তথ্য দিন</Text>
        <View style={s.row}>
          <TextInput placeholder="ফুট" value={feet} onChangeText={setFeet} keyboardType="numeric" style={[s.input, s.inputFlex]} placeholderTextColor={Colors.textMuted} />
          <Text style={s.sep}>ft</Text>
          <TextInput placeholder="ইঞ্চি" value={inches} onChangeText={setInches} keyboardType="numeric" style={[s.input, s.inputFlex]} placeholderTextColor={Colors.textMuted} />
          <Text style={s.sep}>in</Text>
        </View>
        <View style={s.row}>
          <TextInput placeholder="ওজন (kg)" value={kg} onChangeText={setKg} keyboardType="numeric" style={s.inputFull} placeholderTextColor={Colors.textMuted} />
        </View>
        <TouchableOpacity onPress={calc} style={s.btn} activeOpacity={0.9}>
          <LinearGradient colors={Colors.gradients.primary} style={s.btnGradient}>
            <Text style={s.btnText}>BMI হিসাব করুন</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {bmi !== null && profile && (
        <View style={s.resultWrap}>
          <LinearGradient colors={profile.accent} style={s.resultHero}>
            <Text style={s.resultLabel}>আপনার BMI</Text>
            <Text style={s.resultValue}>{bmi}</Text>
            <View style={s.categoryPill}>
              <Text style={s.categoryText}>{profile.label}</Text>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: fillWidth, backgroundColor: profile.border }]} />
            </View>
          </LinearGradient>

          <View style={s.detailCard}>
            <Text style={s.detailTitle}>📝 সংক্ষিপ্ত বিশ্লেষণ</Text>
            <Text style={s.detailText}>{profile.summary}</Text>
          </View>

          {/* Foods to Eat */}
          <View style={s.detailCard}>
            <View style={s.sectionHeader}>
              <View style={[s.iconBox, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="apple" size={20} color="#00C853" />
              </View>
              <Text style={s.detailTitle}>{profile.foodTitle}</Text>
            </View>
            <View style={s.foodGrid}>
              {profile.foods.map((item, idx) => (
                <View key={idx} style={s.foodChip}>
                  <MaterialCommunityIcons name="check-circle" size={14} color="#00C853" />
                  <Text style={s.foodChipText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Foods to Avoid */}
          <View style={s.detailCard}>
            <View style={s.sectionHeader}>
              <View style={[s.iconBox, { backgroundColor: '#FFEBEE' }]}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#FF5252" />
              </View>
              <Text style={s.detailTitle}>❌ যা এড়াবেন / কমাবেন</Text>
            </View>
            <View style={s.avoidGrid}>
              {profile.avoid.map((item, idx) => (
                <View key={idx} style={s.avoidChip}>
                  <MaterialCommunityIcons name="close" size={14} color="#FF5252" />
                  <Text style={s.avoidChipText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Daily Habits */}
          <View style={s.detailCard}>
            <View style={s.sectionHeader}>
              <View style={[s.iconBox, { backgroundColor: '#E3F2FD' }]}>
                <MaterialCommunityIcons name="dumbbell" size={20} color="#2979F0" />
              </View>
              <Text style={s.detailTitle}>💪 দৈনন্দিন অভ্যাস</Text>
            </View>
            <View style={s.habitsContainer}>
              {profile.habits.map((item, idx) => (
                <View key={idx} style={s.habitCard}>
                  <View style={s.habitBadge}>
                    <Text style={s.habitBadgeText}>{idx + 1}</Text>
                  </View>
                  <Text style={s.habitText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Important Note */}
          <View style={[s.detailCard, s.noteCard]}>
            <View style={s.noteBadge}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#FFB300" />
              <Text style={s.noteTitle}>⚠️ গুরুত্বপূর্ণ নোট</Text>
            </View>
            <Text style={s.noteText}>{profile.note}</Text>
          </View>
        </View>
      )}

      {bmi === null && (
        <View style={s.helperCard}>
          <Text style={s.helperTitle}>🔍 কীভাবে ব্যবহার করবেন</Text>
          <Text style={s.helperText}>ফুট, ইঞ্চি আর ওজন দিন। তারপর BMI অনুযায়ী স্বাস্থ্য পরামর্শ, খাবার তালিকা, আর lifestyle guidance দেখা যাবে।</Text>
        </View>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  contentContainer: { paddingVertical: 12, paddingHorizontal: 12 },
  hero: { padding: 18, borderRadius: 20, marginBottom: 14 },
  kicker: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: '900', marginTop: 6, color: Colors.textOnPrimary },
  heroText: { marginTop: 8, color: 'rgba(255,255,255,0.92)', lineHeight: 21 },
  formCard: { padding: 16, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: Colors.border, padding: 12, borderRadius: BorderRadius.sm, backgroundColor: '#fff', color: Colors.textPrimary },
  inputFlex: { flex: 1 },
  inputFull: { borderWidth: 1, borderColor: Colors.border, padding: 12, borderRadius: BorderRadius.sm, backgroundColor: '#fff', flex: 1, color: Colors.textPrimary },
  sep: { marginHorizontal: 6, fontWeight: '700', color: Colors.textSecondary },
  btn: { borderRadius: 14, overflow: 'hidden' },
  btnGradient: { padding: 13, alignItems: 'center', borderRadius: 14 },
  btnText: { color: Colors.textOnPrimary, fontWeight: '800', fontSize: 15 },
  resultWrap: { gap: 14 },
  resultHero: { padding: 18, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  resultLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '700' },
  resultValue: { color: '#fff', fontSize: 40, fontWeight: '900', marginTop: 4 },
  categoryPill: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)' },
  categoryText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  progressTrack: { marginTop: 14, height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  detailCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  detailText: { color: Colors.textSecondary, lineHeight: 22 },
  foodGrid: { gap: 8, flexDirection: 'column' },
  foodChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#F0FFF4', borderRadius: 12, borderWidth: 1, borderColor: '#C6F6D5' },
  foodChipText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
  avoidGrid: { gap: 8, flexDirection: 'column' },
  avoidChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFF3F3', borderRadius: 12, borderWidth: 1, borderColor: '#FFE0E0' },
  avoidChipText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
  habitsContainer: { gap: 12, flexDirection: 'column' },
  habitCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#E3F2FD', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#2979F0' },
  habitBadge: { width: 28, height: 28, borderRadius: 999, backgroundColor: '#2979F0', alignItems: 'center', justifyContent: 'center', minWidth: 28 },
  habitBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  habitText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18, paddingTop: 4 },
  noteCard: { backgroundColor: '#FFF8E1', borderColor: '#FFE082', borderLeftWidth: 4, borderLeftColor: '#FFB300' },
  noteBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 179, 0, 0.2)' },
  noteTitle: { fontSize: 14, fontWeight: '800', color: '#F57F17' },
  noteText: { color: '#F57F17', lineHeight: 22, fontSize: 13, fontWeight: '500' },
  helperCard: { marginTop: 4, padding: 16, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border },
  helperTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  helperText: { color: Colors.textSecondary, lineHeight: 22 },
});

export default BMICalculator;
