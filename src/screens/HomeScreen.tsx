import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';

type RootStackParamList = {
  Home: undefined;
  ReportLost: undefined;
  ReportFound: undefined;
  Browse: undefined;
  Login: undefined;
  Register: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FindIt</Text>
        <Text style={styles.subtitle}>Lost & Found for Campus</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="I Lost Something"
          onPress={() => navigation.navigate('ReportLost')}
          variant="primary"
        />
        <Button
          title="I Found Something"
          onPress={() => navigation.navigate('ReportFound')}
          variant="secondary"
        />
        <Button
          title="Browse Reports"
          onPress={() => navigation.navigate('Browse')}
          variant="outline"
        />
        <Button
          title="Login (test)"
          onPress={() => navigation.navigate('Login')}
          variant="outline"
        />
        <Button
          title="Register (test)"
          onPress={() => navigation.navigate('Register')}
          variant="outline"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  buttonContainer: {
    gap: 16,
  },
});