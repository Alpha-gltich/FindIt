import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Radii, Spacing } from '../constants/colors';
import AppShell from '../components/AppShell';
import Button from '../components/Button';
import ReportCard from '../components/ReportCard';
import SkeletonList from '../components/SkeletonList';
import { supabase } from '../services/supabase';
import { Report, RootStackParamList } from '../types/navigation';

const LIST_COLUMNS =
  'id, user_id, type, item_name, description, category, location, photo_url, status, created_at';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MyReportsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();
  const columns = width >= 1024 ? 3 : width >= 640 ? 2 : 1;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const fetchMyReports = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsLoggedOut(true);
      setFetchError(false);
      setReports([]);
      return;
    }

    setIsLoggedOut(false);

    const { data, error } = await supabase
      .from('reports')
      .select(LIST_COLUMNS)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch my reports:', error.message);
      setFetchError(true);
    } else {
      setFetchError(false);
      setReports((data ?? []) as unknown as Report[]);
    }
  };

  useEffect(() => {
    fetchMyReports().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyReports();
    setRefreshing(false);
  }, []);

  const renderContent = () => {
    if (loading) return <SkeletonList />;

    if (isLoggedOut) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Log in to view your reports</Text>
          <Text style={styles.emptySubtext}>Your submitted reports will show up here once you are signed in.</Text>
          <View style={styles.actionWrapper}>
            <Button title="Log In" onPress={() => navigation.navigate('Login')} />
          </View>
        </View>
      );
    }

    if (fetchError) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Could not load your reports</Text>
          <Text style={styles.emptySubtext}>Check your connection and try again.</Text>
          <View style={styles.actionWrapper}>
            <Button
              title="Retry"
              onPress={() => {
                setLoading(true);
                fetchMyReports().finally(() => setLoading(false));
              }}
            />
          </View>
        </View>
      );
    }

    if (reports.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No reports yet</Text>
          <Text style={styles.emptySubtext}>Reports you submit will show up here.</Text>
        </View>
      );
    }

    return (
      <FlatList
        key={columns}
        data={reports}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={columns > 1 ? styles.gridItem : undefined}>
            <ReportCard
              report={item}
              grid={columns > 1}
              showStatus
              onPress={() => navigation.navigate('Detail', { report: item })}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    );
  };

  return (
    <AppShell title="My Reports" active="MyReports">
      <View style={styles.container}>{renderContent()}</View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  },
  listContent: {
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  columnWrapper: {
    gap: Spacing.lg,
  },
  gridItem: {
    flex: 1,
  },
});
