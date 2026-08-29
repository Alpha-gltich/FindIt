import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../services/supabase';
import { RootStackParamList } from '../types/navigation';

const CATEGORIES = ['Phone', 'Wallet', 'Keys', 'ID Card', 'Laptop', 'Other'];

type EditRouteProp = RouteProp<RootStackParamList, 'EditReport'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function EditReportScreen() {
  const route = useRoute<EditRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { report } = route.params;

  const [itemName, setItemName] = useState(report.item_name);
  const [description, setDescription] = useState(report.description);
  const [category, setCategory] = useState(report.category);
  const [location, setLocation] = useState(report.location);
  const [contactInfo, setContactInfo] = useState(report.contact_info || '');
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(report.photo_url);
  const [photoChanged, setPhotoChanged] = useState(false);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to attach a picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
      setPhotoChanged(true);
    }
  };

  const uploadPhoto = async (uri: string, userId: string): Promise<string> => {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('report-photos')
      .upload(fileName, arrayBuffer, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('report-photos').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!itemName.trim() || !description.trim() || !category || !location.trim()) {
      Alert.alert('Missing info', 'Please fill in all fields, including a category.');
      return;
    }

    setLoading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      Alert.alert('Not logged in', 'Please log in to edit this report.');
      return;
    }

    let photoUrl = report.photo_url;

    if (photoChanged && photoUri) {
      try {
        photoUrl = await uploadPhoto(photoUri, user.id);
      } catch (uploadErr: any) {
        setLoading(false);
        Alert.alert('Photo upload failed', uploadErr.message || 'Please try again.');
        return;
      }
    }

    const { error } = await supabase
      .from('reports')
      .update({
        item_name: itemName.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        contact_info: contactInfo.trim() || null,
        photo_url: photoUrl,
      })
      .eq('id', report.id);

    setLoading(false);

    if (error) {
      Alert.alert('Update failed', error.message);
      return;
    }

    Alert.alert('Report updated', 'Your changes have been saved.');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Edit Report</Text>
      <Text style={styles.subtitle}>Update the details of your {report.type} item</Text>

      <Text style={styles.label}>Photo</Text>
      {photoUri ? (
        <TouchableOpacity onPress={handlePickImage} disabled={loading}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.photoPicker} onPress={handlePickImage} disabled={loading}>
          <Text style={styles.photoPickerText}>+ Add Photo</Text>
        </TouchableOpacity>
      )}

      <Input
        placeholder="Item name"
        value={itemName}
        onChangeText={setItemName}
        editable={!loading}
      />
      <Input
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={styles.textArea}
        editable={!loading}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipSelected]}
            onPress={() => setCategory(cat)}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
        editable={!loading}
      />

      <Input
        placeholder="Phone or email (optional, shown to other users)"
        value={contactInfo}
        onChangeText={setContactInfo}
        editable={!loading}
      />

      <Button title="Save Changes" onPress={handleSave} variant="primary" loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  photoPicker: {
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoPickerText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
  photoPreview: { width: '100%', height: 180, borderRadius: 12, marginBottom: 4 },
  changePhotoText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 14, color: Colors.text },
  chipTextSelected: { color: Colors.white, fontWeight: '600' },
});