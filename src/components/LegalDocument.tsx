import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radii, Spacing } from '../constants/colors';
import FadeIn from './FadeIn';

export interface LegalSection {
  heading: string;
  body: string[];
}

interface LegalDocumentProps {
  title: string;
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
}

export default function LegalDocument({
  title,
  effectiveDate,
  intro,
  sections,
}: LegalDocumentProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FadeIn>
        <View style={styles.headerCard}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.effective}>Effective date: {effectiveDate}</Text>
          <Text style={styles.intro}>{intro}</Text>
        </View>

        {sections.map((section) => (
          <View key={section.heading} style={styles.sectionCard}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.body.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
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
    maxWidth: 760,
    alignSelf: 'center',
  },
  headerCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.white,
    fontSize: 24,
    fontFamily: Fonts.extraBold,
    marginBottom: Spacing.xs,
  },
  effective: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontFamily: Fonts.medium,
    marginBottom: Spacing.md,
  },
  intro: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: Fonts.regular,
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  heading: {
    color: Colors.text,
    fontSize: 17,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.md,
  },
  paragraph: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: Fonts.regular,
    lineHeight: 23,
    marginBottom: Spacing.md,
  },
});
