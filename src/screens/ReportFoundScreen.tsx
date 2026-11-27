import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, Radii, Spacing } from '../constants/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import FadeIn from '../components/FadeIn';
import PhotoPicker from '../components/PhotoPicker';
import { showAlert } from '../utils/alert';
import { supabase } from '../services/supabase';
import { compressPickedPhoto } from '../services/photoCompression';
import { uploadPickedPhoto } from '../services/photoUpload';

const CATEGORIES = ['Phone', 'Wallet', 'Keys', 'ID Card', 'Laptop', 'Other'];

export default function ReportFoundScreen() {
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
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

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      showAlert('Photo could not be read', 'Please choose that photo again.');
      return;
    }

    try {
      const compressed = await compressPickedPhoto(asset.uri, asset.base64);
      setPhotoUri(asset.uri);
      setPhotoBase64(compressed);
    } catch (error: any) {
      showAlert('Photo could not be prepared', error?.message || 'Please choose that photo again.');
    }
  };

  const handleSubmit = async () => {
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
      showAlert('Not logged in', 'Please log in before reporting an item.');
      return;
    }

    let photoUrl: string | null = null;

    if (photoBase64) {
      try {
        photoUrl = await uploadPickedPhoto(photoBase64, user.id);
      } catch (uploadErr: any) {
        setLoading(false);
        showAlert('Photo upload failed', uploadErr.message || 'Please try again.');
        return;
      }
    }

    const { error } = await supabase.from('reports').insert({
      user_id: user.id,
      type: 'found',
      item_name: itemName.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      photo_url: photoUrl,
      contact_info: contactInfo.trim() || null,
    });

    setLoading(false);

    if (error) {
      showAlert('Submission failed', error.message);
      return;
    }

    showAlert('Report submitted', 'Your found item report has been posted.');
    setItemName('');
    setDescription('');
    setCategory('');
    setLocation('');
    setContactInfo('');
    setPhotoUri(null);
    setPhotoBase64(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FadeIn>
        <View style={styles.heading}>
          <Text style={styles.kicker}>Found item</Text>
          <Text style={styles.title}>Report Found Item</Text>
          <Text style={styles.subtitle}>Help someone get their property back.</Text>
        </View>

        <PhotoPicker uri={photoUri} onPress={handlePickImage} disabled={loading} />

        <Input
          label="Item Name"
          placeholder="e.g. Blue Backpack"
          value={itemName}
          onChangeText={setItemName}
          editable={!loading}
        />
        <Input
          label="Description"
          placeholder="Colour, brand, distinguishing marks..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.textArea}
          helper="A few specific details help the owner recognise it."
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
          placeholder="e.g. Library, 2nd floor"
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

        <Button title="Submit Report" onPress={handleSubmit} variant="primary" loading={loading} />
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
    color: Colors.successDark,
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
