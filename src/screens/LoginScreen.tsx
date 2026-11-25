import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../constants/colors';
import Logo from '../components/Logo';
import FadeIn from '../components/FadeIn';
import SegmentedControl, { SegmentedOption } from '../components/SegmentedControl';
import Input from '../components/Input';
import Button from '../components/Button';
import { showAlert } from '../utils/alert';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type AuthTab = 'login' | 'register';

const AUTH_TABS: SegmentedOption<AuthTab>[] = [
  { label: 'Log In', value: 'login' },
  { label: 'Register', value: 'register' },
];

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert('Missing info', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      showAlert('Login failed', error.message);
      return;
    }

    navigation.navigate('Home');
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setResetMessage('Enter your email above first, then tap Forgot password.');
      return;
    }

    setSendingReset(true);
    const redirectTo =
      typeof window !== 'undefined' && window.location && window.location.origin
        ? `${window.location.origin}/`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setSendingReset(false);

    if (error) {
      setResetMessage(error.message);
      return;
    }

    setResetMessage(`Reset link sent to ${email.trim()}. Check your inbox.`);
  };

  const resetSucceeded = resetMessage.toLowerCase().includes('sent');

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

      <SegmentedControl
        options={AUTH_TABS}
        value="login"
        onChange={(value) => {
          if (value === 'register') navigation.navigate('Register');
        }}
      />

      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Log in to your FindIt account</Text>

      <Input
        label="Campus Email"
        placeholder="you@school.edu"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        helper="Use the email you registered with."
        editable={!loading}
      />

      <Input
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        onPress={handleForgotPassword}
        disabled={loading || sendingReset}
        style={styles.forgotWrapper}
        accessibilityRole="button"
      >
        <Text style={styles.linkTextBold}>
          {sendingReset ? 'Sending reset link...' : 'Forgot password?'}
        </Text>
      </TouchableOpacity>

      {resetMessage ? (
        <Text style={[styles.resetMessage, resetSucceeded && styles.resetMessageSuccess]}>
          {resetMessage}
        </Text>
      ) : null}

      <Button
        title="Log In"
        onPress={handleLogin}
        variant="primary"
        loading={loading}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('Register')}
        disabled={loading}
        style={styles.linkWrapper}
        accessibilityRole="button"
      >
        <Text style={styles.linkText}>
          Don&apos;t have an account? <Text style={styles.linkTextBold}>Register</Text>
        </Text>
      </TouchableOpacity>
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
  forgotWrapper: {
    alignSelf: 'flex-end',
    minHeight: 44,
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  resetMessage: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.danger,
    marginBottom: Spacing.lg,
    textAlign: 'right',
  },
  resetMessageSuccess: {
    color: Colors.successDark,
  },
  linkWrapper: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  linkTextBold: {
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
});
