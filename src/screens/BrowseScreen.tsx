import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import Input from '../components/Input';
import { supabase } from '../services/supabase';
import { Report, RootStackParamList } from '../types/navigation';

const CATEGORIES = ['All', 'Phone', 'Wallet', 'Keys', 'ID Card', 'Laptop', 'Other'];
const TYPE_FILTERS = ['All', 'Lost', 'Found'] as const;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function BrowseScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState<typeof TYPE_FILTERS[number]>('All');

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch reports:', error.message);
    } else {
      setReports(data || []);
    }
  };

  useEffect(() => {
    fetchReports().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch =
        searchText.trim() === '' ||
        r.item_name.toLowerCase().includes(searchText.toLowerCase()) ||
        r.description.toLowerCase().includes(searchText.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;

      const matchesType =
        selectedType === 'All' ||
        (selectedType === 'Lost' && r.type === 'lost') ||
        (selectedType === 'Found' && r.type === 'found');

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [reports, searchText, selectedCategory, selectedType]);

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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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

      {filteredReports.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No reports found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary },
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