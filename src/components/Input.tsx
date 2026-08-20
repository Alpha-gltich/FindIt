import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors } from '../constants/colors';

interface InputProps extends TextInputProps {
  // Extend later if needed (error state, label, etc.) — keep minimal for now
}

export default function Input(props: InputProps) {
  return (
    <TextInput
      style={styles.input}
      placeholderTextColor={Colors.textSecondary}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.white,
    marginBottom: 16,
  },
});