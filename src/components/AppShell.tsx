import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Radii, Spacing } from '../constants/colors';
import Logo from './Logo';
import FadeIn from './FadeIn';
import Button from './Button';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showAlert } from '../utils/alert';
import { RootStackParamList } from '../types/navigation';

type NavRoute = 'Home' | 'Browse' | 'MyReports';

interface AppShellProps {
  title: string;
  active?: NavRoute;
  children: React.ReactNode;
}

const NAV_ITEMS: { label: string; route: NavRoute }[] = [
  { label: 'Home', route: 'Home' },
  { label: 'Browse Reports', route: 'Browse' },
  { label: 'My Reports', route: 'MyReports' },
];

export default function AppShell({ title, active, children }: AppShellProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const [signingOut, setSigningOut] = useState(false);
  const desktop = Platform.OS === 'web' && width >= 1024;

  const handleLogout = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) showAlert('Log out failed', error.message);
  };

  if (!desktop) {
    return (
      <View style={styles.plain}>
        <FadeIn style={styles.flex}>{children}</FadeIn>
      </View>
    );
  }

  const metadataName = session?.user.user_metadata?.full_name;
  const initial =
    typeof metadataName === 'string' && metadataName.trim()
      ? metadataName.trim().charAt(0).toUpperCase()
      : 'F';

  return (
    <View style={styles.shell}>
      <View style={styles.sidebar}>
        <View style={styles.sidebarBrand}>
          <Logo size="small" showTagline animate />
        </View>

        <View style={styles.navList}>
          {NAV_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.navItem, active === item.route && styles.navItemActive]}
              onPress={() => navigation.navigate(item.route)}
              accessibilityRole="button"
            >
              <Text style={[styles.navText, active === item.route && styles.navTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sidebarFooter}>
          {session ? (
            <Button
              title={signingOut ? 'Logging out...' : 'Log out'}
              onPress={handleLogout}
              variant="outline"
              loading={signingOut}
            />
          ) : (
            <Button
              title="Log In"
              onPress={() => navigation.navigate('Login')}
              variant="outline"
            />
          )}
        </View>
      </View>

      <View style={styles.main}>
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>{title}</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        </View>
        <View style={styles.mainContent}>
          <FadeIn style={styles.flex}>{children}</FadeIn>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plain: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  shell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background,
  },
  sidebar: {
    width: 240,
    backgroundColor: Colors.white,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  sidebarBrand: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  navList: {
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  navItem: {
    minHeight: 48,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  navItemActive: {
    backgroundColor: Colors.primarySoft,
  },
  navText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
  },
  navTextActive: {
    color: Colors.primary,
  },
  sidebarFooter: {
    gap: Spacing.md,
  },
  main: {
    flex: 1,
  },
  topBar: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topBarTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  mainContent: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});
