import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
}

export default function Button({ title, onPress, variant = 'primary', style }: ButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      default:
        return styles.buttonText;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.base, getButtonStyle(), style]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.success,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  outlineText: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
});