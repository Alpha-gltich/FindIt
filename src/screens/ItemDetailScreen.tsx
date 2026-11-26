import React, { useState, useEffect } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Fonts, Radii, Spacing } from '../constants/colors';
import { WHATSAPP_GROUP_URL } from '../constants/legal';
import { showAlert, showConfirm } from '../utils/alert';
import Button from '../components/Button';
import FadeIn from '../components/FadeIn';
import { supabase } from '../services/supabase';
import { RootStackParamList } from '../types/navigation';

type DetailRouteProp = RouteProp<RootStackParamList, 'Detail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ItemDetailScreen() {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { report } = route.params;

  const [status, setStatus] = useState(report.status);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [contactInfo, setContactInfo] = useState<string | null>(null);
  const [contactLoaded, setContactLoaded] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadUserAndContact = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setIsLoggedIn(true);
      if (user.id === report.user_id) setIsOwner(true);

      const { data, error } = await supabase
        .from('reports')
        .select('contact_info')
        .eq('id', report.id)
        .single();

      if (error || !data) {
        setContactError(true);
      } else {
        setContactInfo(data.contact_info ?? null);
        setContactError(false);
      }
      setContactLoaded(true);
    };
    loadUserAndContact();
  }, [report.id, report.user_id]);

  const handleToggleStatus = async () => {
    const newStatus = status === 'active' ? 'recovered' : 'active';
    setUpdating(true);

    const { error } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', report.id);

    setUpdating(false);

    if (error) {
      showAlert('Update failed', error.message);
      return;
    }

    setStatus(newStatus);
    showAlert(
      'Status updated',
      newStatus === 'recovered' ? 'Marked as recovered.' : 'Marked as active again.'
    );
  };

  const handleEdit = () => {
    if (!contactLoaded) {
      showAlert('Please wait', 'Loading report details. Try again in a moment.');
      return;
    }
    if (contactError) {
      showAlert('Could not load details', 'Check your connection, reopen this report and try again.');
      return;
    }
    navigation.navigate('EditReport', {
      report: { ...report, status, contact_info: contactInfo },
    });
  };

  const handleDelete = () => {
    showConfirm(
      'Delete this report?',
      'This cannot be undone.',
      async () => {
        setDeleting(true);
        const { error } = await supabase.from('reports').delete().eq('id', report.id);
        setDeleting(false);

        if (error) {
          showAlert('Delete failed', error.message);
          return;
        }
        navigation.goBack();
      },
      { confirmLabel: 'Delete', destructive: true }
    );
  };

  const handleOpenWhatsApp = () => {
    const url = WHATSAPP_GROUP_URL.trim();

    if (!url) {
      showAlert(
        'WhatsApp group',
        'The WhatsApp group link will be added before launch.'
      );
      return;
    }

    Linking.openURL(url).catch(() => {
      showAlert('Could not open WhatsApp', 'Please try again in a moment.');
    });
  };

  const renderContactSection = () => {
    if (!isLoggedIn) {
      return <Text style={styles.valueMuted}>Log in to view contact information</Text>;
    }
    if (contactError) {
      return <Text style={styles.valueMuted}>Could not load contact info</Text>;
    }
    if (!contactLoaded) {
      return <Text style={styles.valueMuted}>Loading...</Text>;
    }
    if (!contactInfo) {
      return <Text style={styles.valueMuted}>No contact info provided</Text>;
    }
    return <Text style={styles.value}>{contactInfo}</Text>;
  };

  const isLost = report.type === 'lost';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FadeIn>
        <View style={styles.photoCard}>
        {report.photo_url ? (
          <Image source={{ uri: report.photo_url }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>No Photo</Text>
          </View>
        )}
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.itemName}>{report.item_name}</Text>
        <View style={[styles.typeTag, isLost ? styles.lostTag : styles.foundTag]}>
          <Text style={[styles.typeTagText, isLost ? styles.lostText : styles.foundText]}>
            {isLost ? 'Lost' : 'Found'}
          </Text>
        </View>
      </View>

      {status === 'recovered' ? (
        <View style={styles.recoveredBanner}>
          <Text style={styles.recoveredBannerText}>✓ This item has been marked as recovered</Text>
        </View>
      ) : null}

      <View style={styles.detailsCard}>
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{report.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <Text style={styles.value}>{report.category}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>📍 {report.location}</Text>
        </View>

        <View style={styles.sectionLast}>
          <Text style={styles.label}>Contact</Text>
          {renderContactSection()}
        </View>
      </View>

      <View style={styles.communityAction}>
        <Button
          title={WHATSAPP_GROUP_URL ? 'Open WhatsApp Group' : 'WhatsApp Group (coming soon)'}
          onPress={handleOpenWhatsApp}
          variant="secondary"
        />
      </View>

      {isOwner ? (
        <View style={styles.ownerActions}>
          <Button
            title={status === 'active' ? 'Mark as Recovered' : 'Mark as Active'}
            onPress={handleToggleStatus}
            variant={status === 'active' ? 'secondary' : 'outline'}
            loading={updating}
          />
          <Button title="Edit Report" onPress={handleEdit} variant="outline" />
          <Button
            title="Delete Report"
            onPress={handleDelete}
            variant="danger"
            loading={deleting}
          />
        </View>
      ) : null}
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
  photoCard: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  photo: {
    width: '100%',
    height: 260,
  },
  photoPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  photoPlaceholderText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  itemName: {
    flex: 1,
    marginRight: Spacing.md,
    fontSize: 24,
    fontFamily: Fonts.extraBold,
    color: Colors.text,
  },
  typeTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
  },
  lostTag: {
    backgroundColor: Colors.dangerSoft,
  },
  foundTag: {
    backgroundColor: Colors.successSoft,
  },
  typeTagText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  lostText: {
    color: Colors.lost,
  },
  foundText: {
    color: Colors.found,
  },
  recoveredBanner: {
    backgroundColor: Colors.successSoft,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  recoveredBannerText: {
    color: Colors.successDark,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  detailsCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLast: {
    marginBottom: 0,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
    lineHeight: 23,
  },
  valueMuted: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  communityAction: {
    marginBottom: Spacing.lg,
  },
  ownerActions: {
    gap: Spacing.md,
  },
});
