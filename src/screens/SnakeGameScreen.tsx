import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import SnakeGame from '../components/SnakeGame';

export const SnakeGameScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SnakeGame />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    paddingTop: 0,
  },
});

export default SnakeGameScreen;
