import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { evaluate } from 'mathjs';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const ScientificCalculator: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState('');
  const [result, setResult] = useState('');
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG');

  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const toDegrees = (rad: number) => (rad * 180) / Math.PI;

  const press = (value: string) => {
    if (value === '.' && input.includes('.')) return;
    setInput((prev) => prev + value);
  };

  const clear = () => {
    setInput('');
    setHistory('');
    setResult('');
  };

  const backspace = () => setInput((prev) => prev.slice(0, -1));

  const evaluate_expr = () => {
    try {
      let sanitized = input
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, Math.PI.toString())
        .replace(/e/g, Math.E.toString());

      const res = evaluate(sanitized);
      setHistory(input);
      setResult(String(res));
      setInput(String(res));
    } catch (e) {
      setResult('Error');
    }
  };

  const scientificFunc = (func: string, needsAngleConversion: boolean = false) => {
    try {
      let val = parseFloat(input || '0');
      let res: number;

      if (needsAngleConversion && angleMode === 'DEG') {
        val = toRadians(val);
      }

      switch (func) {
        case 'sin':
          res = Math.sin(val);
          break;
        case 'cos':
          res = Math.cos(val);
          break;
        case 'tan':
          res = Math.tan(val);
          break;
        case 'asin':
          res = Math.asin(val);
          break;
        case 'acos':
          res = Math.acos(val);
          break;
        case 'atan':
          res = Math.atan(val);
          break;
        case 'sinh':
          res = Math.sinh(val);
          break;
        case 'cosh':
          res = Math.cosh(val);
          break;
        case 'tanh':
          res = Math.tanh(val);
          break;
        case 'sqrt':
          res = Math.sqrt(val);
          break;
        case 'cube':
          res = val * val * val;
          break;
        case 'log':
          res = Math.log10(val);
          break;
        case 'ln':
          res = Math.log(val);
          break;
        case 'exp':
          res = Math.exp(val);
          break;
        case 'fact':
          res = factorial(val);
          break;
        case 'reciprocal':
          res = 1 / val;
          break;
        case 'percent':
          res = val / 100;
          break;
        case 'negate':
          res = -val;
          break;
        default:
          res = 0;
      }

      if (needsAngleConversion && angleMode === 'DEG') {
        res = toDegrees(res);
      }

      setResult(String(Math.round(res * 10000000) / 10000000));
      setInput(String(Math.round(res * 10000000) / 10000000));
    } catch (e) {
      setResult('Error');
    }
  };

  const factorial = (n: number): number => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  const buttonWidth = (width - 60) / 4;

  const Button = ({ label, onPress, style, textStyle, icon }: any) => (
    <TouchableOpacity onPress={onPress} style={[st.button, { width: buttonWidth }, style]}>
      {icon ? <MaterialCommunityIcons name={icon} size={18} color="#fff" /> : null}
      <Text style={[st.buttonText, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );

  const OperatorButton = ({ label, onPress }: any) => (
    <Button label={label} onPress={onPress} style={st.operatorButton} textStyle={{ fontWeight: '700' }} />
  );

  const EqualsButton = ({ label, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={[st.button, st.equalsButton, { width: buttonWidth * 2 + 8 }]}>
      <Text style={[st.buttonText, st.equalsButtonText]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={st.container} contentContainerStyle={st.contentContainer} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#2C3E50', '#34495E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.calcBody}>
        {/* Solar Panel */}
        <View style={st.solarPanel}>
          {[...Array(12)].map((_, i) => (
            <View key={i} style={st.solarCell} />
          ))}
        </View>

        {/* Main Display */}
        <View style={st.displayContainer}>
          <Text style={st.historyDisplay}>{history}</Text>
          <TextInput
            style={st.mainDisplay}
            value={input}
            onChangeText={setInput}
            placeholder="0"
            placeholderTextColor="#888"
            editable={false}
            keyboardType="numeric"
          />
          <Text style={st.resultDisplay}>{result}</Text>
        </View>

        {/* Mode Indicator */}
        <View style={st.modeIndicator}>
          <TouchableOpacity onPress={() => setAngleMode(angleMode === 'DEG' ? 'RAD' : 'DEG')} style={[st.modeBtn, angleMode === 'DEG' && st.modeBtnActive]}>
            <Text style={[st.modeBtnText, angleMode === 'DEG' && st.modeBtnTextActive]}>DEG</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.modeBtn, angleMode === 'RAD' && st.modeBtnActive]}>
            <Text style={[st.modeBtnText, angleMode === 'RAD' && st.modeBtnTextActive]}>RAD</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.modeBtn}>
            <Text style={st.modeBtnText}>GRAD</Text>
          </TouchableOpacity>
        </View>

        {/* Function Buttons Row 1 */}
        <View style={st.row}>
          <Button label="sin" onPress={() => scientificFunc('sin', true)} style={st.funcButton} />
          <Button label="cos" onPress={() => scientificFunc('cos', true)} style={st.funcButton} />
          <Button label="tan" onPress={() => scientificFunc('tan', true)} style={st.funcButton} />
          <Button label="π" onPress={() => press(Math.PI.toString().slice(0, 8))} style={st.funcButton} />
        </View>

        {/* Function Buttons Row 2 */}
        <View style={st.row}>
          <Button label="sin⁻¹" onPress={() => scientificFunc('asin', true)} style={st.funcButton} />
          <Button label="cos⁻¹" onPress={() => scientificFunc('acos', true)} style={st.funcButton} />
          <Button label="tan⁻¹" onPress={() => scientificFunc('atan', true)} style={st.funcButton} />
          <Button label="e" onPress={() => press(Math.E.toString().slice(0, 8))} style={st.funcButton} />
        </View>

        {/* Function Buttons Row 3 */}
        <View style={st.row}>
          <Button label="sinh" onPress={() => scientificFunc('sinh')} style={st.funcButton} />
          <Button label="cosh" onPress={() => scientificFunc('cosh')} style={st.funcButton} />
          <Button label="tanh" onPress={() => scientificFunc('tanh')} style={st.funcButton} />
          <Button label="log" onPress={() => scientificFunc('log')} style={st.funcButton} />
        </View>

        {/* Function Buttons Row 4 */}
        <View style={st.row}>
          <Button label="√" onPress={() => scientificFunc('sqrt')} style={st.funcButton} />
          <Button label="∛" onPress={() => scientificFunc('cube')} style={st.funcButton} />
          <Button label="xⁿ" onPress={() => press('^')} style={st.funcButton} />
          <Button label="ln" onPress={() => scientificFunc('ln')} style={st.funcButton} />
        </View>

        {/* Function Buttons Row 5 */}
        <View style={st.row}>
          <Button label="1/x" onPress={() => scientificFunc('reciprocal')} style={st.funcButton} />
          <Button label="n!" onPress={() => scientificFunc('fact')} style={st.funcButton} />
          <Button label="|x|" onPress={() => press('abs(')} style={st.funcButton} />
          <Button label="%" onPress={() => scientificFunc('percent')} style={st.funcButton} />
        </View>

        {/* Main Keypad */}
        <View style={st.row}>
          <OperatorButton label="AC" onPress={clear} />
          <OperatorButton label="DEL" onPress={backspace} />
          <OperatorButton label="(" onPress={() => press('(')} />
          <OperatorButton label=")" onPress={() => press(')')} />
        </View>

        <View style={st.row}>
          <Button label="7" onPress={() => press('7')} />
          <Button label="8" onPress={() => press('8')} />
          <Button label="9" onPress={() => press('9')} />
          <OperatorButton label="÷" onPress={() => press('/')} />
        </View>

        <View style={st.row}>
          <Button label="4" onPress={() => press('4')} />
          <Button label="5" onPress={() => press('5')} />
          <Button label="6" onPress={() => press('6')} />
          <OperatorButton label="×" onPress={() => press('*')} />
        </View>

        <View style={st.row}>
          <Button label="1" onPress={() => press('1')} />
          <Button label="2" onPress={() => press('2')} />
          <Button label="3" onPress={() => press('3')} />
          <OperatorButton label="−" onPress={() => press('-')} />
        </View>

        <View style={st.row}>
          <Button label="0" onPress={() => press('0')} />
          <Button label="." onPress={() => press('.')} />
          <Button label="+/−" onPress={() => scientificFunc('negate')} />
          <OperatorButton label="+" onPress={() => press('+')} />
        </View>

        <View style={st.row}>
          <EqualsButton label="=" onPress={evaluate_expr} />
        </View>

        <TouchableOpacity onPress={clear} style={st.clearAllBtn}>
          <Text style={st.clearAllBtnText}>Clear All</Text>
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
  );
};

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  contentContainer: { paddingVertical: 16, paddingHorizontal: 10 },
  calcBody: { borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 15 },
  solarPanel: { flexDirection: 'row', marginBottom: 16, gap: 3, backgroundColor: '#1a472a', padding: 8, borderRadius: 8 },
  solarCell: { flex: 1, height: 12, backgroundColor: '#2d5f3f', borderRadius: 2, borderWidth: 0.5, borderColor: '#1a472a' },
  displayContainer: { backgroundColor: '#F0E68C', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 2, borderColor: '#8B8B00' },
  historyDisplay: { fontSize: 12, color: '#666', fontWeight: '600', height: 16, textAlign: 'right' },
  mainDisplay: { fontSize: 28, fontWeight: '800', color: '#2C3E50', textAlign: 'right', paddingVertical: 8 },
  resultDisplay: { fontSize: 14, color: '#007AFF', fontWeight: '700', textAlign: 'right', height: 16 },
  modeIndicator: { flexDirection: 'row', marginBottom: 12, gap: 4 },
  modeBtn: { flex: 1, paddingVertical: 6, backgroundColor: '#34495E', borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#45596A' },
  modeBtnActive: { backgroundColor: '#3498DB', borderColor: '#3498DB' },
  modeBtnText: { fontSize: 11, fontWeight: '700', color: '#95A5A6' },
  modeBtnTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  button: { height: 48, backgroundColor: '#34495E', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#45596A' },
  buttonText: { fontSize: 14, fontWeight: '600', color: '#ECF0F1' },
  funcButton: { backgroundColor: '#2C5F7C', borderColor: '#34495E' },
  operatorButton: { backgroundColor: '#E67E22', borderColor: '#D35400' },
  equalsButton: { height: 48, backgroundColor: '#27AE60', borderRadius: 8, borderWidth: 1, borderColor: '#229954', alignItems: 'center', justifyContent: 'center' },
  equalsButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  clearAllBtn: { marginTop: 8, paddingVertical: 10, backgroundColor: '#C0392B', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#A93226' },
  clearAllBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

export default ScientificCalculator;
