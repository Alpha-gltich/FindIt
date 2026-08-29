import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import Button from '../components/Button';
import { supabase } from '../services/supabase';
import { RootStackParamList } from '../types/navigation';

type DetailRouteProp = RouteProp<RootStackParamList, 'Detail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ItemDetailScreen() {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { report } = route.params;

  const [status, setStatus] = useState(report.status);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        if (user.id === report.user_id) {
          setIsOwner(true);
        }
      }
    };
    checkAuth();
  }, [report.user_id]);

  const handleToggleStatus = async () => {
    const newStatus = status === 'active' ? 'recovered' : 'active';
    setUpdating(true);

    const { error } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', report.id);

    setUpdating(false);

    if (error) {
      Alert.alert('Update failed', error.message);
      return;
    }

    setStatus(newStatus);
    Alert.alert(
      'Status updated',
      newStatus === 'recovered' ? 'Marked as recovered.' : 'Marked as active again.'
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete this report?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);

            const { error } = await supabase
              .from('reports')
              .delete()
              .eq('id', report.id);

            setDeleting(false);

            if (error) {
              Alert.alert('Delete failed', error.message);
              return;
            }

            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderContactSection = () => {
    if (!isLoggedIn) {
      return (
        <>
          <Text style={styles.label}>Contact</Text>
          <Text style={styles.valueMuted}>Log in to view contact information</Text>
        </>
      );
    }

    if (!report.contact_info) {
      return (
        <>
          <Text style={styles.label}>Contact</Text>
          <Text style={styles.valueMuted}>No contact info provided</Text>
        </>
      );
    }

    return (
      <>
        <Text style={styles.label}>Contact</Text>
        <Text style={styles.value}>{report.contact_info}</Text>
      </>
    );
  };

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

      {status === 'recovered' && (
        <View style={styles.recoveredBanner}>
          <Text style={styles.recoveredBannerText}>✓ This item has been marked as recovered</Text>
        </View>
      )}

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
        {renderContactSection()}
      </View>

      {isOwner && (
        <View style={styles.ownerActions}>
          <Button
            title={status === 'active' ? 'Mark as Recovered' : 'Mark as Active'}
            onPress={handleToggleStatus}
            variant={status === 'active' ? 'secondary' : 'outline'}
            loading={updating}
          />
          <Button
            title="Edit Report"
            onPress={() => navigation.navigate('EditReport', { report })}
            variant="outline"
          />
          <Button
            title="Delete Report"
            onPress={handleDelete}
            variant="outline"
            loading={deleting}
            style={styles.deleteButton}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24 },
  photo: { width: '100%', height: 240, borderRadius: 12, marginBottom: 20 },
  photoPlaceholder: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  photoPlaceholderText: { color: Colors.textSecondary, fontSize: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  itemName: { fontSize: 24, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 12 },
  typeTag: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12 },
  lostTag: { backgroundColor: '#FEE2E2' },
  foundTag: { backgroundColor: '#DCFCE7' },
  typeTagText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  recoveredBanner: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  recoveredBannerText: { color: '#166534', fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, textTransform: 'uppercase' },
  value: { fontSize: 16, color: Colors.text, lineHeight: 22 },
  valueMuted: { fontSize: 16, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 22 },
  ownerActions: { gap: 12 },
  deleteButton: { borderColor: '#EF4444' },
});