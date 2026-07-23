import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import BMICalculator from '../components/BMICalculator';
import { Colors } from '../theme';

export const BmiCalculatorScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <BMICalculator />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
  },
});

export default BmiCalculatorScreen;
