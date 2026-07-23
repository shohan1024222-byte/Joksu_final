import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../theme';

export const OthersScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 12 }}>
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>More tools</Text>
        <Text style={styles.emptyText}>BMI Calculator, Snake Game, and Calculator are now available from the main menu.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  emptyState: {
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: Colors.card,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});

export default OthersScreen;
