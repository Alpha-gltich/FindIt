import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '../constants/colors';
import { supabase } from '../services/supabase';

interface Report {
  id: string;
  type: 'lost' | 'found';
  item_name: string;
  description: string;
  category: string;
  location: string;
  photo_url: string | null;
  status: string;
  created_at: string;
}

export default function BrowseScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const renderItem = ({ item }: { item: Report }) => (
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
      {reports.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No reports yet</Text>
          <Text style={styles.emptySubtext}>Reported items will show up here</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 88,
    height: 88,
  },
  thumbnailPlaceholder: {
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholderText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  typeTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  lostTag: {
    backgroundColor: '#FEE2E2',
  },
  foundTag: {
    backgroundColor: '#DCFCE7',
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  category: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  location: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});