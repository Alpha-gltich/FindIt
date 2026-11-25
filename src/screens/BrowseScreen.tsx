import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Radii, Spacing } from '../constants/colors';
import AppShell from '../components/AppShell';
import Input from '../components/Input';
import Button from '../components/Button';
import SegmentedControl, { SegmentedOption } from '../components/SegmentedControl';
import ReportCard from '../components/ReportCard';
import SkeletonList from '../components/SkeletonList';
import { supabase } from '../services/supabase';
import { Report, RootStackParamList } from '../types/navigation';

const CATEGORIES = ['All', 'Phone', 'Wallet', 'Keys', 'ID Card', 'Laptop', 'Other'];
const PAGE_SIZE = 20;
const LIST_COLUMNS =
  'id, user_id, type, item_name, description, category, location, photo_url, status, created_at';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TypeFilter = 'All' | 'Lost' | 'Found';

const TYPE_FILTERS: SegmentedOption<TypeFilter>[] = [
  { label: 'All', value: 'All' },
  { label: 'Lost', value: 'Lost' },
  { label: 'Found', value: 'Found' },
];

const sanitizeSearch = (text: string) =>
  text.replace(/[%_,()*\\"']/g, ' ').replace(/\s+/g, ' ').trim();

export default function BrowseScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();
  const columns = width >= 1024 ? 3 : width >= 640 ? 2 : 1;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState<TypeFilter>('All');
  const [fetchError, setFetchError] = useState(false);
  const requestCounter = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchReports = useCallback(
    async (offset: number, replace: boolean) => {
      const requestId = ++requestCounter.current;

      let query = supabase
        .from('reports')
        .select(LIST_COLUMNS)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (selectedType !== 'All') {
        query = query.eq('type', selectedType.toLowerCase());
      }
      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }
      const term = sanitizeSearch(debouncedSearch);
      if (term) {
        query = query.or(`item_name.ilike.%${term}%,description.ilike.%${term}%`);
      }

      const { data, error } = await query;

      if (requestId !== requestCounter.current) return;

      if (error) {
        console.error('Failed to fetch reports:', error.message);
        if (replace) setFetchError(true);
      } else {
        const rows = (data ?? []) as unknown as Report[];
        setFetchError(false);
        setHasMore(rows.length === PAGE_SIZE);
        setReports((prev) => {
          if (replace) return rows;
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...rows.filter((r) => !seen.has(r.id))];
        });
      }
      setLoading(false);
      setLoadingMore(false);
    },
    [selectedType, selectedCategory, debouncedSearch]
  );

  useEffect(() => {
    setLoading(true);
    fetchReports(0, true);
  }, [fetchReports]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports(0, true);
    setRefreshing(false);
  }, [fetchReports]);

  const loadMore = () => {
    if (loading || loadingMore || refreshing || fetchError || !hasMore) return;
    setLoadingMore(true);
    fetchReports(reports.length, false);
  };

  const renderResults = () => {
    if (loading) return <SkeletonList />;

    if (fetchError) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Something went wrong loading reports</Text>
          <Text style={styles.emptySubtext}>Check your connection and try again</Text>
          <View style={styles.retryWrapper}>
            <Button
              title="Retry"
              onPress={() => {
                setLoading(true);
                fetchReports(0, true);
              }}
            />
          </View>
        </View>
      );
    }

    if (reports.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No reports found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
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
              onPress={() => navigation.navigate('Detail', { report: item })}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? <View style={styles.footerLoader} /> : undefined
        }
      />
    );
  };

  return (
    <AppShell title="Browse Reports" active="Browse">
      <View style={styles.container}>
        <View style={styles.filterBar}>
          <Input
            placeholder="Search items..."
            value={searchText}
            onChangeText={setSearchText}
            containerStyle={styles.searchContainer}
          />

          <SegmentedControl
            options={TYPE_FILTERS}
            value={selectedType}
            onChange={setSelectedType}
            style={styles.typeControl}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, selectedCategory === cat && styles.chipSelected]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {renderResults()}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    marginBottom: Spacing.sm,
  },
  typeControl: {
    marginBottom: Spacing.md,
  },
  categoryRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  chipTextSelected: {
    color: Colors.white,
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
  retryWrapper: {
    marginTop: Spacing.lg,
    width: '100%',
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
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
  footerLoader: {
    paddingVertical: Spacing.lg,
  },
});
