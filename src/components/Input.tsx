import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Colors, Fonts, Radii, Spacing } from '../constants/colors';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helper?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<TextStyle>;
}

export default function Input({
  label,
  helper,
  error,
  containerStyle,
  style,
  secureTextEntry,
  ...rest
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <TextInput
          style={[styles.input, isPassword ? styles.passwordInput : null, style]}
          placeholderTextColor={Colors.textSecondary}
          secureTextEntry={isPassword && !showPassword}
          {...rest}
        />
        {isPassword ? (
          <TouchableOpacity
            style={styles.toggle}
            onPress={() => setShowPassword((current) => !current)}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  inputRowError: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  passwordInput: {
    paddingRight: 72,
  },
  toggle: {
    position: 'absolute',
    right: Spacing.md,
    minHeight: 44,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  helperText: {
    marginTop: Spacing.sm,
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  errorText: {
    marginTop: Spacing.sm,
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.danger,
  },
});
