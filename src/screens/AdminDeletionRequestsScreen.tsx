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
import { showAlert, showConfirm } from '../utils/alert';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DeletionTab = 'pending' | 'resolved';
type RequestStatus = 'pending' | 'completed' | 'cancelled';

type DeletionRequestRow = {
  user_id: string;
  email: string;
  reason: string | null;
  status: RequestStatus;
  created_at: string;
  processed_at: string | null;
};

const REQUEST_COLUMNS = 'user_id, email, reason, status, created_at, processed_at';
const PAGE_SIZE = 100;

function shortId(value: string): string {
  return value.length > 12 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

export default function AdminDeletionRequestsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [tab, setTab] = useState<DeletionTab>('pending');
  const [pending, setPending] = useState<DeletionRequestRow[]>([]);
  const [resolved, setResolved] = useState<DeletionRequestRow[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [denied, setDenied] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const fetchRequests = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setDenied(true);
      setPending([]);
      setResolved([]);
      return;
    }

    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');

    if (adminError || !isAdmin) {
      setDenied(true);
      setPending([]);
      setResolved([]);
      return;
    }

    setDenied(false);

    const { data, error } = await supabase
      .from('account_deletion_requests')
      .select(REQUEST_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.error('Failed to fetch deletion requests:', error.message);
      setFetchError(true);
      return;
    }

    const rows = (data ?? []) as DeletionRequestRow[];
    setPending(rows.filter((row) => row.status === 'pending'));
    setResolved(rows.filter((row) => row.status !== 'pending'));
    setFetchError(false);
  }, []);

  useEffect(() => {
    fetchRequests().finally(() => setLoading(false));
  }, [fetchRequests]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  }, [fetchRequests]);

  const updateStatus = async (row: DeletionRequestRow, status: 'completed' | 'cancelled') => {
    setUpdatingId(row.user_id);

    const { data, error } = await supabase
      .from('account_deletion_requests')
      .update({ status })
      .eq('user_id', row.user_id)
      .eq('status', 'pending')
      .select('user_id');

    if (error) {
      showAlert('Update failed', error.message);
      setUpdatingId(null);
      return;
    }

    if (!data || data.length === 0) {
      showAlert('Already processed', 'This request was updated by another admin.');
      setUpdatingId(null);
      await fetchRequests();
      return;
    }

    const updated: DeletionRequestRow = {
      ...row,
      status,
      processed_at: new Date().toISOString(),
    };

    setPending((current) => current.filter((item) => item.user_id !== row.user_id));
    setResolved((current) => [updated, ...current]);
    setUpdatingId(null);

    if (status === 'completed') {
      showAlert(
        'Request completed',
        'Delete the auth user in the Supabase dashboard to finish the account removal.'
      );
    } else {
      showAlert('Request cancelled', 'The request is now marked cancelled.');
    }
  };

  const handleUpdate = (row: DeletionRequestRow, status: 'completed' | 'cancelled') => {
    const label = status === 'completed' ? 'Complete' : 'Cancel';
    const message =
      status === 'completed'
        ? 'Mark this request completed after removing the user data. You still need to delete the auth user in Supabase.'
        : 'Cancel this deletion request? The user has not been deleted.';

    showConfirm(`${label} deletion request?`, message, () => {
      void updateStatus(row, status);
    }, { confirmLabel: label, destructive: true });
  };

  const renderRow = (item: DeletionRequestRow) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.statusBadge,
            item.status === 'pending'
              ? styles.pendingBadge
              : item.status === 'completed'
                ? styles.completedBadge
                : styles.cancelledBadge,
          ]}
        >
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>

      <Text style={styles.email}>{item.email}</Text>
      <Text style={styles.userId}>User: {shortId(item.user_id)}</Text>

      {item.reason ? (
        <Text style={styles.reason} numberOfLines={3}>
          “{item.reason}”
        </Text>
      ) : (
        <Text style={styles.reasonMuted}>No reason provided</Text>
      )}

      {item.processed_at ? (
        <Text style={styles.processedText}>Processed {formatDate(item.processed_at)}</Text>
      ) : null}

      {item.status === 'pending' ? (
        <View style={styles.actions}>
          <Button
            title="Complete"
            variant="primary"
            style={styles.actionButton}
            loading={updatingId === item.user_id}
            onPress={() => handleUpdate(item, 'completed')}
          />
          <Button
            title="Cancel request"
            variant="outline"
            style={styles.actionButton}
            loading={updatingId === item.user_id}
            onPress={() => handleUpdate(item, 'cancelled')}
          />
        </View>
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
          <Text style={styles.emptyText}>Could not load requests</Text>
          <Text style={styles.emptySubtext}>Check your connection and try again.</Text>
          <View style={styles.actionWrapper}>
            <Button
              title="Retry"
              onPress={() => {
                setLoading(true);
                fetchRequests().finally(() => setLoading(false));
              }}
            />
          </View>
        </View>
      );
    }

    const data = tab === 'pending' ? pending : resolved;

    if (data.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {tab === 'pending' ? 'No pending requests' : 'No resolved requests'}
          </Text>
          <Text style={styles.emptySubtext}>
            {tab === 'pending'
              ? 'New deletion requests will appear here.'
              : 'Completed and cancelled requests will appear here.'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => renderRow(item)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    );
  };

  const options = [
    { label: `Pending (${pending.length})`, value: 'pending' as const },
    { label: `Resolved (${resolved.length})`, value: 'resolved' as const },
  ];

  return (
    <AppShell title="Deletion Requests">
      <View style={styles.container}>
        <View style={styles.top}>
          <SegmentedControl options={options} value={tab} onChange={setTab} />
          <Text style={styles.note}>
            This screen marks requests reviewed. Delete the auth user in the Supabase dashboard to finish account removal.
          </Text>
        </View>
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
  top: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  note: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
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
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  pendingBadge: {
    backgroundColor: Colors.primarySoft,
  },
  completedBadge: {
    backgroundColor: Colors.successSoft,
  },
  cancelledBadge: {
    backgroundColor: Colors.dangerSoft,
  },
  statusText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  dateText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  email: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  userId: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  reason: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  reasonMuted: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  processedText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.successDark,
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
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
