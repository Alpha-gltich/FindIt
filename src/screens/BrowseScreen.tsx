import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../services/supabase';
import { Report, RootStackParamList } from '../types/navigation';

const CATEGORIES = ['All', 'Phone', 'Wallet', 'Keys', 'ID Card', 'Laptop', 'Other'];
const TYPE_FILTERS = ['All', 'Lost', 'Found'] as const;
const PAGE_SIZE = 20;
// contact_info is deliberately not listed: it is only fetched on the detail screen for logged-in users.
const LIST_COLUMNS =
  'id, user_id, type, item_name, description, category, location, photo_url, status, created_at';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Strip characters that have special meaning in filters so a search can't alter the query.
const sanitizeSearch = (text: string) =>
  text.replace(/[%_,()*\\"']/g, ' ').replace(/\s+/g, ' ').trim();

export default function BrowseScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState<typeof TYPE_FILTERS[number]>('All');
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

      // A newer request has started (filters changed): ignore this stale result.
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

  const renderItem = ({ item }: { item: Report }) => (
    <TouchableOpacity onPress={() => navigation.navigate('Detail', { report: item })} activeOpacity={0.8}>
      <View style={styles.card}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Text style={styles.thumbnailPlaceholderText}>No Photo</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.itemName} numberOfLines={1}>{item.item_name}</Text>
            <View style={[styles.typeTag, item.type === 'lost' ? styles.lostTag : styles.foundTag]}>
              <Text style={styles.typeTagText}>{item.type === 'lost' ? 'Lost' : 'Found'}</Text>
            </View>
          </View>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderResults = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    if (fetchError) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Something went wrong loading reports</Text>
          <Text style={styles.emptySubtext}>Check your connection and try again</Text>
          <View style={styles.retryButtonWrapper}>
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
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          <View style={styles.footerLoader}>
            {loadingMore ? <ActivityIndicator color={Colors.primary} /> : null}
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <Input
          placeholder="Search items..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />

        <View style={styles.typeToggleRow}>
          {TYPE_FILTERS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeToggle, selectedType === t && styles.typeToggleSelected]}
              onPress={() => setSelectedType(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeToggleText, selectedType === t && styles.typeToggleTextSelected]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryRow}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[styles.chip, selectedCategory === cat && styles.chipSelected]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextSelected]}>
                {cat}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {renderResults()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary },
  retryButtonWrapper: { marginTop: 16, width: '100%' },
  footerLoader: { paddingVertical: 16, minHeight: 8 },
  filterBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.background,
  },
  searchInput: {
    marginBottom: 12,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeToggle: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  typeToggleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  typeToggleTextSelected: {
    color: Colors.white,
  },
  categoryRow: {
    gap: 8,
    paddingBottom: 12,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: 14, color: Colors.text },
  chipTextSelected: { color: Colors.white, fontWeight: '600' },
  listContent: { padding: 16, paddingTop: 4 },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  thumbnail: { width: 88, height: 88 },
  thumbnailPlaceholder: { backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  thumbnailPlaceholderText: { fontSize: 11, color: Colors.textSecondary },
  cardContent: { flex: 1, padding: 12, justifyContent: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemName: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 8 },
  typeTag: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10 },
  lostTag: { backgroundColor: '#FEE2E2' },
  foundTag: { backgroundColor: '#DCFCE7' },
  typeTagText: { fontSize: 11, fontWeight: '700', color: Colors.text },
  category: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  location: { fontSize: 13, color: Colors.textSecondary },
});