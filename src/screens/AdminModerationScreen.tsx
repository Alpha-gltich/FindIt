import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
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
import SkeletonList from '../components/SkeletonList';
import { supabase } from '../services/supabase';
import { showAlert, showConfirm } from '../utils/alert';
import { Report, RootStackParamList } from '../types/navigation';

const ADMIN_LIST_COLUMNS =
  'id, user_id, type, item_name, description, category, location, photo_url, status, contact_info, created_at';
const PAGE_SIZE = 50;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function photoPathFromUrl(photoUrl: string | null): string | null {
  if (!photoUrl) {
    return null;
  }

  const marker = '/report-photos/';
  const markerIndex = photoUrl.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  const rawPath = photoUrl.slice(markerIndex + marker.length).split('?')[0];
  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

export default function AdminModerationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [reports, setReports] = useState<Report[]>([]);
  const [flagCounts, setFlagCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingFlagsId, setClearingFlagsId] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [revealedContacts, setRevealedContacts] = useState<Record<string, boolean>>({});
  const [denied, setDenied] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const fetchReports = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setDenied(true);
      setAdminUserId(null);
      setReports([]);
      return;
    }

    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');

    if (adminError || !isAdmin) {
      setDenied(true);
      setAdminUserId(null);
      setReports([]);
      return;
    }

    setDenied(false);
    setAdminUserId(user.id);

    const { data, error } = await supabase
      .from('reports')
      .select(ADMIN_LIST_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.error('Failed to fetch reports for moderation:', error.message);
      setFetchError(true);
      return;
    }

    setFetchError(false);
    setReports((data ?? []) as unknown as Report[]);

    const { data: flagData, error: flagError } = await supabase
      .from('report_flags')
      .select('report_id')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!flagError) {
      const counts: Record<string, number> = {};
      for (const row of flagData ?? []) {
        const reportId = row.report_id as string;
        counts[reportId] = (counts[reportId] ?? 0) + 1;
      }
      setFlagCounts(counts);
    }
  }, []);

  useEffect(() => {
    fetchReports().finally(() => setLoading(false));
  }, [fetchReports]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, [fetchReports]);

  const deleteReport = async (report: Report) => {
    setDeletingId(report.id);

    const { error } = await supabase.from('reports').delete().eq('id', report.id);

    if (error) {
      showAlert('Delete failed', error.message);
      setDeletingId(null);
      return;
    }

    const photoPath = photoPathFromUrl(report.photo_url);
    if (photoPath) {
      const { error: storageError } = await supabase.storage
        .from('report-photos')
        .remove([photoPath]);

      if (storageError) {
        console.warn('Report deleted but photo removal failed:', storageError.message);
      }
    }

    setReports((current) => current.filter((item) => item.id !== report.id));
    setFlagCounts((current) => {
      const next = { ...current };
      delete next[report.id];
      return next;
    });
    setDeletingId(null);
    showAlert('Report deleted', 'The report and its attached photo were removed.');
  };

  const handleDelete = (report: Report) => {
    showConfirm(
      'Delete this report?',
      `This will permanently remove "${report.item_name}" and its photo.`,
      () => {
        void deleteReport(report);
      },
      { confirmLabel: 'Delete', destructive: true }
    );
  };

  const clearFlags = async (report: Report) => {
    const flagCount = flagCounts[report.id] ?? 0;

    if (!adminUserId) {
      showAlert('Access error', 'Please reopen the moderation screen and try again.');
      return;
    }

    setClearingFlagsId(report.id);

    const { error: auditError } = await supabase.from('report_flag_clear_audit').insert({
      admin_user_id: adminUserId,
      report_id: report.id,
      cleared_count: flagCount,
    });

    if (auditError) {
      showAlert('Could not log flag clear', auditError.message);
      setClearingFlagsId(null);
      return;
    }

    const { error } = await supabase
      .from('report_flags')
      .delete()
      .eq('report_id', report.id);

    if (error) {
      showAlert('Could not clear flags', error.message);
      setClearingFlagsId(null);
      return;
    }

    setFlagCounts((current) => {
      const next = { ...current };
      delete next[report.id];
      return next;
    });
    setClearingFlagsId(null);
    showAlert('Flags cleared', 'This report is visible in Browse again.');
  };

  const handleClearFlags = (report: Report) => {
    const flagCount = flagCounts[report.id] ?? 0;

    showConfirm(
      'Clear flags on this report?',
      `This removes ${flagCount} ${flagCount === 1 ? 'flag' : 'flags'} and makes the report visible in Browse again. The action is logged.`,
      () => {
        void clearFlags(report);
      },
      { confirmLabel: 'Clear flags' }
    );
  };

  const toggleContact = async (report: Report) => {
    if (revealedContacts[report.id]) {
      setRevealedContacts((current) => ({ ...current, [report.id]: false }));
      return;
    }

    if (!adminUserId) {
      showAlert('Access error', 'Please reopen the moderation screen and try again.');
      return;
    }

    const { error } = await supabase.from('contact_reveal_audit').insert({
      admin_user_id: adminUserId,
      report_id: report.id,
    });

    if (error) {
      showAlert('Could not log contact access', error.message);
      return;
    }

    setRevealedContacts((current) => ({ ...current, [report.id]: true }));
  };

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
          <Text style={styles.emptyText}>Could not load reports</Text>
          <Text style={styles.emptySubtext}>Check your connection and try again.</Text>
          <View style={styles.actionWrapper}>
            <Button
              title="Retry"
              onPress={() => {
                setLoading(true);
                fetchReports().finally(() => setLoading(false));
              }}
            />
          </View>
        </View>
      );
    }

    if (reports.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No reports to moderate</Text>
          <Text style={styles.emptySubtext}>New reports will appear here.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const contactVisible = Boolean(revealedContacts[item.id] && item.contact_info);
          const flagCount = flagCounts[item.id] ?? 0;

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.badge,
                    item.type === 'lost' ? styles.lostBadge : styles.foundBadge,
                  ]}
                >
                  <Text style={styles.badgeText}>{item.type.toUpperCase()}</Text>
                </View>
                <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
              </View>

              <Text style={styles.itemName}>{item.item_name}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.metaText}>
                {item.category} • {item.location}
              </Text>

              {flagCount > 0 ? (
                <View style={styles.flagBadge}>
                  <Text style={styles.flagText}>
                    ⚑ {flagCount} {flagCount === 1 ? 'flag' : 'flags'}
                  </Text>
                </View>
              ) : null}

              {item.photo_url ? (
                <Image source={{ uri: item.photo_url }} style={styles.thumbnail} />
              ) : null}

              {contactVisible ? (
                <View style={styles.contactBox}>
                  <Text style={styles.contactLabel}>Contact</Text>
                  <Text style={styles.contactValue}>{item.contact_info}</Text>
                </View>
              ) : null}

              <View style={styles.actions}>
                <Button
                  title="View"
                  variant="outline"
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Detail', { report: item })}
                />
                {item.contact_info ? (
                  <Button
                    title={contactVisible ? 'Hide contact' : 'Reveal contact'}
                    variant="outline"
                    style={styles.actionButton}
                    onPress={() => {
                      void toggleContact(item);
                    }}
                  />
                ) : null}
                {flagCount > 0 ? (
                  <Button
                    title={clearingFlagsId === item.id ? 'Clearing...' : 'Clear flags'}
                    variant="outline"
                    style={styles.actionButton}
                    loading={clearingFlagsId === item.id}
                    onPress={() => handleClearFlags(item)}
                  />
                ) : null}
                <Button
                  title={deletingId === item.id ? 'Deleting...' : 'Delete'}
                  variant="danger"
                  style={styles.actionButton}
                  loading={deletingId === item.id}
                  onPress={() => handleDelete(item)}
                />
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    );
  };

  return (
    <AppShell title="Moderation">
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.privacyNote}>
            Contact numbers stay hidden until an admin reveals them. Reveals and flag clears are logged.
          </Text>
          <View style={styles.adminTools}>
            <Button
              title="Audit log"
              variant="outline"
              onPress={() => navigation.navigate('AdminAuditLog')}
            />
            <Button
              title="Deletion requests"
              variant="outline"
              onPress={() => navigation.navigate('AdminDeletionRequests')}
            />
          </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  privacyNote: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  adminTools: {
    width: 170,
    gap: Spacing.sm,
  },
  listContent: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    borderRadius: Radii.lg,
    backgroundColor: Colors.white,
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
    marginBottom: Spacing.sm,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  lostBadge: {
    backgroundColor: Colors.dangerSoft,
  },
  foundBadge: {
    backgroundColor: Colors.successSoft,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  dateText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  itemName: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  metaText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  flagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dangerSoft,
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: Spacing.sm,
  },
  flagText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.danger,
  },
  thumbnail: {
    width: '100%',
    height: 180,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    marginBottom: Spacing.md,
  },
  contactBox: {
    borderRadius: Radii.md,
    backgroundColor: Colors.primarySoft,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  contactLabel: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  contactValue: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionButton: {
    flexGrow: 1,
    minWidth: 120,
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
