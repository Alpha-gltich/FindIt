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

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      showAlert('Missing info', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      showAlert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
      },
    });
    setLoading(false);

    if (error) {
      showAlert('Registration failed', error.message);
      return;
    }

    if (!data.session) {
      showAlert(
        'Check your email',
        'We sent a confirmation link to your email. Please confirm your account, then log in.'
      );
      navigation.navigate('Login');
      return;
    }

    navigation.navigate('Home');
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

      <SegmentedControl
        options={AUTH_TABS}
        value="register"
        onChange={(value) => {
          if (value === 'login') navigation.navigate('Login');
        }}
      />

      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Join FindIt to report and recover items</Text>

      <Input
        label="Full name"
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        editable={!loading}
      />
      <Input
        label="Campus Email"
        placeholder="you@school.edu"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />
      <Input
        label="Password"
        placeholder="At least 6 characters"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        helper="Use a password you have not used elsewhere."
        editable={!loading}
      />

      <Button
        title="Create Account"
        onPress={handleRegister}
        variant="primary"
        loading={loading}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        disabled={loading}
        style={styles.linkWrapper}
        accessibilityRole="button"
      >
        <Text style={styles.linkText}>
          Already have an account? <Text style={styles.linkTextBold}>Log In</Text>
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
