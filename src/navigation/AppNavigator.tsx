import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ReportLostScreen from '../screens/ReportLostScreen';
import ReportFoundScreen from '../screens/ReportFoundScreen';
import BrowseScreen from '../screens/BrowseScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import MyReportsScreen from '../screens/MyReportsScreen';
import EditReportScreen from '../screens/EditReportScreen';
import { RootStackParamList } from '../types/navigation';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

function NavigatorContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ReportLost" component={ReportLostScreen} options={{ title: 'Report Lost Item' }} />
        <Stack.Screen name="ReportFound" component={ReportFoundScreen} options={{ title: 'Report Found Item' }} />
        <Stack.Screen name="Browse" component={BrowseScreen} options={{ title: 'Browse Reports' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Log In' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
        <Stack.Screen name="Detail" component={ItemDetailScreen} options={{ title: 'Item Details' }} />
        <Stack.Screen name="MyReports" component={MyReportsScreen} options={{ title: 'My Reports' }} />
        <Stack.Screen name="EditReport" component={EditReportScreen} options={{ title: 'Edit Report' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigatorContent />
    </AuthProvider>
  );
}