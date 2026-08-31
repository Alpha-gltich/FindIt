import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../services/supabase';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
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
      Alert.alert('Registration failed', error.message);
      return;
    }

    if (!data.session) {
      Alert.alert(
        'Check your email',
        'We sent a confirmation link to your email. Please confirm your account, then log in.'
      );
      navigation.navigate('Login');
      return;
    }

    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Join FindIt to report and recover items</Text>

      <Input
        placeholder="Full name"
        value={name}
        onChangeText={setName}
        editable={!loading}
      />
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
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
      >
        <Text style={styles.linkText}>
          Already have an account? <Text style={styles.linkTextBold}>Log In</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  linkWrapper: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  linkTextBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
});