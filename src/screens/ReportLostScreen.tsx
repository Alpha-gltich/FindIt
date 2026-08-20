import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import Input from '../components/Input';
import Button from '../components/Button';

const CATEGORIES = ['Phone', 'Wallet', 'Keys', 'ID Card', 'Laptop', 'Other'];

export default function ReportLostScreen() {
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = () => {
    // Validation + Supabase submission comes in Day 13
    console.log({ itemName, description, category, location });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Report Lost Item</Text>
      <Text style={styles.subtitle}>Fill in the details of what you lost</Text>

      <Input
        placeholder="Item name (e.g. Blue backpack)"
        value={itemName}
        onChangeText={setItemName}
      />
      <Input
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipSelected]}
            onPress={() => setCategory(cat)}
            activeOpacity={0.8}
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
      />

      <Button title="Submit Report" onPress={handleSubmit} variant="primary" />
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