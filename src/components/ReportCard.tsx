import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Radii, Spacing } from '../constants/colors';
import { Report } from '../types/navigation';

interface ReportCardProps {
  report: Report;
  onPress: () => void;
  grid?: boolean;
  showStatus?: boolean;
}

export default function ReportCard({ report, onPress, grid = false, showStatus = false }: ReportCardProps) {
  const isLost = report.type === 'lost';

  return (
    <TouchableOpacity
      style={[styles.card, grid && styles.cardGrid]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      {report.photo_url ? (
        <Image source={{ uri: report.photo_url }} style={[styles.thumbnail, grid && styles.thumbnailGrid]} />
      ) : (
        <View style={[styles.thumbnail, styles.placeholder, grid && styles.thumbnailGrid]}>
          <Text style={styles.placeholderText}>No Photo</Text>
        </View>
      )}

      <View style={[styles.content, grid && styles.contentGrid]}>
        <View style={styles.headerRow}>
          <Text style={styles.itemName} numberOfLines={1}>
            {report.item_name}
          </Text>
          <View style={[styles.typeTag, isLost ? styles.lostTag : styles.foundTag]}>
            <Text style={[styles.typeTagText, isLost ? styles.lostText : styles.foundText]}>
              {isLost ? 'Lost' : 'Found'}
            </Text>
          </View>
        </View>

        <Text style={styles.category}>{report.category}</Text>
        <Text style={styles.location} numberOfLines={1}>📍 {report.location}</Text>

        {showStatus ? (
          <View style={[styles.statusTag, report.status === 'recovered' ? styles.recoveredTag : styles.activeTag]}>
            <Text style={styles.statusText}>
              {report.status === 'active' ? 'Active' : 'Recovered'}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  cardGrid: {
    flexDirection: 'column',
    marginBottom: Spacing.lg,
  },
  thumbnail: {
    width: 96,
    height: 96,
  },
  thumbnailGrid: {
    width: '100%',
    height: 150,
  },
  placeholder: {
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  contentGrid: {
    padding: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  itemName: {
    flex: 1,
    marginRight: Spacing.sm,
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  typeTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
  },
  lostTag: {
    backgroundColor: Colors.dangerSoft,
  },
  foundTag: {
    backgroundColor: Colors.successSoft,
  },
  typeTagText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  lostText: {
    color: Colors.lost,
  },
  foundText: {
    color: Colors.found,
  },
  category: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  location: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  statusTag: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
  },
  activeTag: {
    backgroundColor: Colors.primarySoft,
  },
  recoveredTag: {
    backgroundColor: Colors.successSoft,
  },
  statusText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
});
