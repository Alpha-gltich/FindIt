import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ReportLostScreen from '../screens/ReportLostScreen';
import ReportFoundScreen from '../screens/ReportFoundScreen';
import BrowseScreen from '../screens/BrowseScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ReportLost"
          component={ReportLostScreen}
          options={{ title: 'Report Lost Item' }}
        />
        <Stack.Screen
          name="ReportFound"
          component={ReportFoundScreen}
          options={{ title: 'Report Found Item' }}
        />
        <Stack.Screen
          name="Browse"
          component={BrowseScreen}
          options={{ title: 'Browse Reports' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}