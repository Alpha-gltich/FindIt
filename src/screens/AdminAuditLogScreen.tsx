import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Radii, Spacing } from '../constants/colors';
import AppShell from '../components/AppShell';
import Button from '../components/Button';
import SegmentedControl from '../components/SegmentedControl';
import SkeletonList from '../components/SkeletonList';
import { supabase } from '../services/supabase';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type AuditTab = 'reveals' | 'flagClears';

type RevealRow = {
  id: string;
  admin_user_id: string;
  report_id: string;
  created_at: string;
};

type FlagClearRow = {
  id: string;
  admin_user_id: string;
  report_id: string;
  cleared_count: number;
  created_at: string;
};

const REVEAL_COLUMNS = 'id, admin_user_id, report_id, created_at';
const FLAG_CLEAR_COLUMNS = 'id, admin_user_id, report_id, cleared_count, created_at';
const PAGE_SIZE = 100;

const TABS = [
  { label: 'Contact reveals', value: 'reveals' },
  { label: 'Flag clears', value: 'flagClears' },
] as const;

function shortId(value: string): string {
  return value.length > 12 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

export default function AdminAuditLogScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [tab, setTab] = useState<AuditTab>('reveals');
  const [reveals, setReveals] = useState<RevealRow[]>([]);
  const [flagClears, setFlagClears] = useState<FlagClearRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [denied, setDenied] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const fetchRows = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setDenied(true);
      setReveals([]);
      setFlagClears([]);
      return;
    }

    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');

    if (adminError || !isAdmin) {
      setDenied(true);
      setReveals([]);
      setFlagClears([]);
      return;
    }

    setDenied(false);

    const [revealResult, flagClearResult] = await Promise.all([
      supabase
        .from('contact_reveal_audit')
        .select(REVEAL_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE),
      supabase
        .from('report_flag_clear_audit')
        .select(FLAG_CLEAR_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE),
    ]);

    if (revealResult.error || flagClearResult.error) {
      console.error(
        'Failed to fetch audit log:',
        revealResult.error?.message || flagClearResult.error?.message
      );
      setFetchError(true);
      return;
    }

    setFetchError(false);
    setReveals((revealResult.data ?? []) as RevealRow[]);
    setFlagClears((flagClearResult.data ?? []) as FlagClearRow[]);
  }, []);

  useEffect(() => {
    fetchRows().finally(() => setLoading(false));
  }, [fetchRows]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRows();
    setRefreshing(false);
  }, [fetchRows]);

  const renderRow = (item: RevealRow | FlagClearRow, kind: AuditTab) => (
    <View style={styles.card}>
      <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      <Text style={styles.rowText}>
        <Text style={styles.rowLabel}>Admin: </Text>
        {shortId(item.admin_user_id)}
      </Text>
      <Text style={styles.rowText}>
        <Text style={styles.rowLabel}>Report: </Text>
        {shortId(item.report_id)}
      </Text>
      {kind === 'flagClears' ? (
        <Text style={styles.rowText}>
          <Text style={styles.rowLabel}>Flags cleared: </Text>
          {(item as FlagClearRow).cleared_count}
        </Text>
      ) : null}
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return <SkeletonList />;
    }

    if (denied) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Admin access required</Text>
          <Text style={styles.emptySubtext}>This screen is only available to FindIt staff.</Text>
          <View style={styles.actionWrapper}>
            <Button title="Go Home" onPress={() => navigation.navigate('Home')} />
          </View>
        </View>
      );
    }

    if (fetchError) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Could not load the audit log</Text>
          <Text style={styles.emptySubtext}>Check your connection and try again.</Text>
          <View style={styles.actionWrapper}>
            <Button
              title="Retry"
              onPress={() => {
                setLoading(true);
                fetchRows().finally(() => setLoading(false));
              }}
            />
          </View>
        </View>
      );
    }

    const data: Array<RevealRow | FlagClearRow> = tab === 'reveals' ? reveals : flagClears;

    if (data.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No entries yet</Text>
          <Text style={styles.emptySubtext}>Logged admin actions will appear here.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderRow(item, tab)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    );
  };

  return (
    <AppShell title="Audit Log">
      <View style={styles.container}>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} style={styles.tabs} />
        {renderContent()}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabs: {
    marginHorizontal: Spacing.lg,
  },
  listContent: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  dateText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  rowText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  rowLabel: {
    fontFamily: Fonts.bold,
    color: Colors.textSecondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionWrapper: {
    marginTop: Spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
});
