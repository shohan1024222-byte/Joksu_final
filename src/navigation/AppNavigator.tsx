import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context';
import {
  LoginScreen,
  HomeScreen,
  VotingScreen,
  CandidatesScreen,
  ResultsScreen,
  AdminScreen,
  ProfileScreen,
  PositionsScreen,
  GpaCheckScreen,
  GpaCalculateScreen,
  GpaRankingScreen,
  RetakeImproveScreen,
  CalculatorScreen,
  BmiCalculatorScreen,
  SnakeGameScreen,
  OthersScreen,
} from '../screens';
import { RootStackParamList } from './types';
import { Colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1E2745',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Voting"
              component={VotingScreen}
              options={{
                title: 'ভোট দিন',
              }}
            />
            <Stack.Screen
              name="Candidates"
              component={CandidatesScreen}
              options={{
                title: 'প্রার্থী তালিকা',
              }}
            />
            <Stack.Screen
              name="Results"
              component={ResultsScreen}
              options={{
                title: 'নির্বাচনী ফলাফল',
              }}
            />
            <Stack.Screen
              name="Admin"
              component={AdminScreen}
              options={{
                title: 'অ্যাডমিন প্যানেল',
                headerStyle: {
                  backgroundColor: '#6C63FF',
                },
              }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                title: 'প্রোফাইল সেটিংস',
              }}
            />
            <Stack.Screen
              name="Positions"
              component={PositionsScreen}
              options={{
                title: 'পদসমূহ',
              }}
            />
            <Stack.Screen
              name="GpaCheck"
              component={GpaCheckScreen}
              options={{
                title: 'GPA Check',
              }}
            />
            <Stack.Screen
              name="GpaCalculate"
              component={GpaCalculateScreen}
              options={{
                title: 'GPA Calculate',
              }}
            />
            <Stack.Screen
              name="GpaRanking"
              component={GpaRankingScreen}
              options={{
                title: 'GPA Ranking',
              }}
            />
            <Stack.Screen
              name="RetakeImprove"
              component={RetakeImproveScreen}
              options={{
                title: 'Retake/Improve Result',
              }}
            />
            <Stack.Screen
              name="Calculator"
              component={CalculatorScreen}
              options={{
                title: 'Calculator',
              }}
            />
            <Stack.Screen
              name="BmiCalculator"
              component={BmiCalculatorScreen}
              options={{
                title: 'BMI Calculator',
              }}
            />
            <Stack.Screen
              name="SnakeGame"
              component={SnakeGameScreen}
              options={{
                title: 'Snake Game',
              }}
            />
            <Stack.Screen
              name="Others"
              component={OthersScreen}
              options={{
                title: 'অন্যান্য',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};