import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Radii, Spacing } from '../constants/colors';

interface PhotoPickerProps {
  uri: string | null;
  onPress: () => void;
  disabled?: boolean;
  label?: string;
}

export default function PhotoPicker({ uri, onPress, disabled = false, label = 'Photo (optional)' }: PhotoPickerProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropZone}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        {uri ? (
          <Image source={{ uri }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.icon}>⌕</Text>
            <Text style={styles.primaryText}>+ Add Photo</Text>
            <Text style={styles.helperText}>Tap to choose from your gallery</Text>
          </View>
        )}
      </TouchableOpacity>
      {uri ? <Text style={styles.changeText}>Tap the photo to choose a different one</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  dropZone: {
    height: 164,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    borderStyle: 'dashed',
    backgroundColor: Colors.white,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: Colors.cyan,
    marginBottom: Spacing.sm,
  },
  primaryText: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  helperText: {
    marginTop: Spacing.xs,
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  changeText: {
    marginTop: Spacing.sm,
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
