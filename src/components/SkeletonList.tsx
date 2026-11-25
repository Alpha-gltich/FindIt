import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Colors, Radii, Spacing } from '../constants/colors';

export default function SkeletonList() {
  const { width } = useWindowDimensions();
  const columns = width >= 1024 ? 3 : width >= 640 ? 2 : 1;

  return (
    <View style={styles.container}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={[styles.card, columns > 1 && styles.cardGrid]}>
          <View style={[styles.thumb, columns > 1 && styles.thumbGrid]} />
          <View style={styles.lines}>
            <View style={[styles.line, styles.lineTitle]} />
            <View style={[styles.line, styles.lineMedium]} />
            <View style={[styles.line, styles.lineShort]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardGrid: {
    flexDirection: 'column',
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: Radii.md,
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  thumbGrid: {
    width: '100%',
    height: 140,
  },
  lines: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  line: {
    height: 12,
    borderRadius: Radii.pill,
    backgroundColor: Colors.border,
    opacity: 0.55,
    marginBottom: Spacing.sm,
  },
  lineTitle: {
    width: '60%',
  },
  lineMedium: {
    width: '85%',
  },
  lineShort: {
    width: '40%',
    marginBottom: 0,
  },
});
