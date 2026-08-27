import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types/navigation';

type DetailRouteProp = RouteProp<RootStackParamList, 'Detail'>;

export default function ItemDetailScreen() {
  const route = useRoute<DetailRouteProp>();
  const { report } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {report.photo_url ? (
        <Image source={{ uri: report.photo_url }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.photoPlaceholderText}>No Photo</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.itemName}>{report.item_name}</Text>
        <View style={[styles.typeTag, report.type === 'lost' ? styles.lostTag : styles.foundTag]}>
          <Text style={styles.typeTagText}>{report.type === 'lost' ? 'Lost' : 'Found'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <Text style={styles.value}>{report.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Category</Text>
        <Text style={styles.value}>{report.category}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{report.location}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Posted by</Text>
        <Text style={styles.value}>Contact feature coming soon</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24 },
  photo: { width: '100%', height: 240, borderRadius: 12, marginBottom: 20 },
  photoPlaceholder: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  photoPlaceholderText: { color: Colors.textSecondary, fontSize: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  itemName: { fontSize: 24, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 12 },
  typeTag: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12 },
  lostTag: { backgroundColor: '#FEE2E2' },
  foundTag: { backgroundColor: '#DCFCE7' },
  typeTagText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  section: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, textTransform: 'uppercase' },
  value: { fontSize: 16, color: Colors.text, lineHeight: 22 },
});