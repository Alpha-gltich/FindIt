import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../constants/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../services/supabase';

const CATEGORIES = ['Phone', 'Wallet', 'Keys', 'ID Card', 'Laptop', 'Other'];

export default function ReportLostScreen() {
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!itemName.trim() || !description.trim() || !category || !location.trim()) {
      Alert.alert('Missing info', 'Please fill in all fields, including a category.');
      return;
    }

    setLoading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      Alert.alert('Not logged in', 'Please log in before reporting an item.');
      return;
    }

    const { error } = await supabase.from('reports').insert({
      user_id: user.id,
      type: 'lost',
      item_name: itemName.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
    });

    setLoading(false);

    if (error) {
      Alert.alert('Submission failed', error.message);
      return;
    }

    Alert.alert('Report submitted', 'Your lost item report has been posted.');
    setItemName('');
    setDescription('');
    setCategory('');
    setLocation('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Report Lost Item</Text>
      <Text style={styles.subtitle}>Fill in the details of what you lost</Text>

      <Input
        placeholder="Item name (e.g. Blue backpack)"
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
        placeholder="Where did you lose it? (e.g. Library 2nd floor)"
        value={location}
        onChangeText={setLocation}
        editable={!loading}
      />

      <Button title="Submit Report" onPress={handleSubmit} variant="primary" loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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
  chipText: {
    fontSize: 14,
    color: Colors.text,
  },
  chipTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
});