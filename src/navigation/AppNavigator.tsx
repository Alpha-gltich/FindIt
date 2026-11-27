import React, { useEffect } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { DefaultTheme, NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ReportLostScreen from '../screens/ReportLostScreen';
import ReportFoundScreen from '../screens/ReportFoundScreen';
import BrowseScreen from '../screens/BrowseScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import MyReportsScreen from '../screens/MyReportsScreen';
import EditReportScreen from '../screens/EditReportScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen from '../screens/TermsScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';
import AdminModerationScreen from '../screens/AdminModerationScreen';
import AdminAuditLogScreen from '../screens/AdminAuditLogScreen';
import AdminDeletionRequestsScreen from '../screens/AdminDeletionRequestsScreen';
import { RootStackParamList } from '../types/navigation';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Colors, Fonts } from '../constants/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.white,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.danger,
  },
};

function RecoveryRedirect() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { passwordRecovery, clearPasswordRecovery } = useAuth();

  useEffect(() => {
    if (!passwordRecovery) {
      return;
    }
    clearPasswordRecovery();
    navigation.navigate('ResetPassword');
  }, [passwordRecovery, clearPasswordRecovery, navigation]);

  return null;
}

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
    <NavigationContainer theme={navigationTheme}>
      <RecoveryRedirect />
      <Stack.Navigator
        screenOptions={{
          animation: Platform.OS === 'android' ? 'ios_from_right' : 'default',
          animationDuration: 260,
          gestureEnabled: true,
          headerStyle: {
            backgroundColor: Colors.white,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            color: Colors.text,
            fontFamily: Fonts.bold,
            fontSize: 16,
          },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ReportLost" component={ReportLostScreen} options={{ title: 'Report Lost Item' }} />
        <Stack.Screen name="ReportFound" component={ReportFoundScreen} options={{ title: 'Report Found Item' }} />
        <Stack.Screen name="Browse" component={BrowseScreen} options={{ title: 'Browse Reports' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Log In' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Set New Password' }} />
        <Stack.Screen name="Detail" component={ItemDetailScreen} options={{ title: 'Item Details' }} />
        <Stack.Screen name="MyReports" component={MyReportsScreen} options={{ title: 'My Reports' }} />
        <Stack.Screen name="EditReport" component={EditReportScreen} options={{ title: 'Edit Report' }} />
        <Stack.Screen name="Privacy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
        <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms and Conditions' }} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{ title: 'Delete Account' }} />
        <Stack.Screen name="AdminModeration" component={AdminModerationScreen} options={{ title: 'Admin Moderation' }} />
        <Stack.Screen name="AdminAuditLog" component={AdminAuditLogScreen} options={{ title: 'Admin Audit Log' }} />
        <Stack.Screen name="AdminDeletionRequests" component={AdminDeletionRequestsScreen} options={{ title: 'Deletion Requests' }} />
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
