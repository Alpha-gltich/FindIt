import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Radii, Spacing } from '../constants/colors';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { showAlert } from '../utils/alert';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { session } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  const handleLogout = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);

    if (error) {
      showAlert('Log out failed', error.message);
    }
  };

  const metadataName = session?.user.user_metadata?.full_name;
  const firstName =
    typeof metadataName === 'string' && metadataName.trim()
      ? metadataName.trim().split(' ')[0]
      : 'there';

  return (
    <Animated.ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Animated.View style={{ opacity: fade }}>
        <View style={styles.header}>
          <Logo size="small" animate />
          <Text style={styles.greeting}>Hello, {firstName}!</Text>
          <Text style={styles.subtitle}>What are you looking for today?</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionCard, styles.lostCard]}
            onPress={() => navigation.navigate('ReportLost')}
            activeOpacity={0.88}
          >
            <View style={styles.iconBubble}>
              <Text style={styles.iconText}>⌕</Text>
            </View>
            <Text style={styles.actionTitle}>I Lost Something</Text>
            <Text style={styles.actionSubtitle}>Report a missing item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.foundCard]}
            onPress={() => navigation.navigate('ReportFound')}
            activeOpacity={0.88}
          >
            <View style={styles.iconBubble}>
              <Text style={styles.iconText}>♥</Text>
            </View>
            <Text style={styles.actionTitle}>I Found Something</Text>
            <Text style={styles.actionSubtitle}>Help someone find it</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonStack}>
          <Button
            title="Browse Reports"
            onPress={() => navigation.navigate('Browse')}
            variant="outline"
          />
          <Button
            title="My Reports"
            onPress={() => navigation.navigate('MyReports')}
            variant="outline"
          />
          {session ? (
            <Button
              title={signingOut ? 'Logging out...' : 'Log out'}
              onPress={handleLogout}
              variant="outline"
              loading={signingOut}
            />
          ) : (
            <>
              <Button
                title="Log In"
                onPress={() => navigation.navigate('Login')}
                variant="primary"
              />
              <Button
                title="Register"
                onPress={() => navigation.navigate('Register')}
                variant="outline"
              />
            </>
          )}
        </View>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
            <Text style={styles.legalLink}>Privacy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>•</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
            <Text style={styles.legalLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>•</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DeleteAccount')}>
            <Text style={[styles.legalLink, styles.deleteLink]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.ScrollView>
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
  header: {
    marginBottom: Spacing.xxl,
  },
  greeting: {
    marginTop: Spacing.xl,
    fontSize: 26,
    fontFamily: Fonts.extraBold,
    color: Colors.text,
  },
  subtitle: {
    marginTop: Spacing.sm,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionCard: {
    flex: 1,
    minHeight: 156,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  lostCard: {
    backgroundColor: Colors.primary,
  },
  foundCard: {
    backgroundColor: Colors.successDark,
  },
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  iconText: {
    color: Colors.white,
    fontSize: 26,
    fontFamily: Fonts.bold,
  },
  actionTitle: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
  },
  actionSubtitle: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  buttonStack: {
    gap: Spacing.md,
  },
  legalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  legalLink: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.medium,
    textDecorationLine: 'underline',
  },
  deleteLink: {
    color: Colors.danger,
  },
  legalDivider: {
    color: Colors.borderStrong,
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
});
