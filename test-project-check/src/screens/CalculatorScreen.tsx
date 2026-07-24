import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import ScientificCalculator from '../components/ScientificCalculator';

export const CalculatorScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScientificCalculator />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    paddingBottom: 20,
  },
});

export default CalculatorScreen;
