import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radii, Spacing } from '../constants/colors';
import Logo from '../components/Logo';
import FadeIn from '../components/FadeIn';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../services/supabase';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  const handleUpdate = async () => {
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setDone(true);
    setMessage('Password updated. Log in with your new password.');
  };

  const handleBackToLogin = async () => {
    await supabase.auth.signOut();
    navigation.navigate('Login');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <FadeIn>
        <View style={styles.brand}>
        <Logo size="large" showTagline animate />
      </View>

      <Text style={styles.title}>Set new password</Text>
      <Text style={styles.subtitle}>Choose a new password for your FindIt account</Text>

      {done ? (
        <View style={styles.resultCard}>
          <Text style={styles.success}>{message}</Text>
          <Button title="Go to Log In" onPress={handleBackToLogin} variant="primary" />
        </View>
      ) : (
        <View>
          <Input
            label="New password"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          <Input
            label="Confirm new password"
            placeholder="Repeat your new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <Button
            title="Update Password"
            onPress={handleUpdate}
            variant="primary"
            loading={loading}
          />
        </View>
      )}
      </FadeIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.extraBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  message: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.danger,
    marginBottom: Spacing.lg,
  },
  resultCard: {
    backgroundColor: Colors.successSoft,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  success: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.successDark,
    textAlign: 'center',
  },
});
