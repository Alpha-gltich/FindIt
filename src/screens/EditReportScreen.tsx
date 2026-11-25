import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Fonts, Radii, Spacing } from '../constants/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import FadeIn from '../components/FadeIn';
import PhotoPicker from '../components/PhotoPicker';
import { showAlert } from '../utils/alert';
import { supabase } from '../services/supabase';
import { uploadPickedPhoto } from '../services/photoUpload';
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
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [categoryError, setCategoryError] = useState(false);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Permission needed', 'Please allow photo access to attach a picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      if (!asset.base64) {
        showAlert('Photo could not be read', 'Please choose that photo again.');
        return;
      }
      setPhotoUri(asset.uri);
      setPhotoBase64(asset.base64);
      setPhotoChanged(true);
    }
  };

  const handleSave = async () => {
    if (!itemName.trim() || !description.trim() || !category || !location.trim()) {
      setCategoryError(!category);
      showAlert('Missing info', 'Please fill in all fields, including a category.');
      return;
    }
    setCategoryError(false);
    setLoading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      showAlert('Not logged in', 'Please log in to edit this report.');
      return;
    }

    let photoUrl = report.photo_url;

    if (photoChanged && photoBase64) {
      try {
        photoUrl = await uploadPickedPhoto(photoBase64, user.id);
      } catch (uploadErr: any) {
        setLoading(false);
        showAlert('Photo upload failed', uploadErr.message || 'Please try again.');
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
      showAlert('Update failed', error.message);
      return;
    }

    showAlert('Report updated', 'Your changes have been saved.');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FadeIn>
        <View style={styles.heading}>
        <Text style={styles.kicker}>Edit report</Text>
        <Text style={styles.title}>Edit Report</Text>
        <Text style={styles.subtitle}>Update the details of your {report.type} item.</Text>
      </View>

      <PhotoPicker uri={photoUri} onPress={handlePickImage} disabled={loading} label="Photo" />

      <Input
        label="Item Name"
        placeholder="Item name"
        value={itemName}
        onChangeText={setItemName}
        editable={!loading}
      />
      <Input
        label="Description"
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={styles.textArea}
        editable={!loading}
      />

      <Text style={[styles.label, categoryError && styles.labelError]}>Category</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipSelected]}
            onPress={() => {
              setCategory(cat);
              setCategoryError(false);
            }}
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
        label="Campus Location"
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
        editable={!loading}
      />
      <Input
        label="Contact Info"
        placeholder="Phone or email"
        value={contactInfo}
        onChangeText={setContactInfo}
        helper="Optional. Visible to logged-in users only."
        editable={!loading}
      />

      <Button title="Save Changes" onPress={handleSave} variant="primary" loading={loading} />
      </FadeIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  heading: {
    marginBottom: Spacing.xl,
  },
  kicker: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.extraBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  labelError: {
    color: Colors.danger,
  },
  textArea: {
    height: 110,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
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
});
