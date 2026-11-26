import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Radii, Spacing } from '../constants/colors';
import Button from '../components/Button';
import FadeIn from '../components/FadeIn';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { showAlert, showConfirm } from '../utils/alert';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ExistingRequest = { status: string; created_at: string };

export default function DeleteAccountScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { session } = useAuth();
  const [reason, setReason] = useState('');
  const [existing, setExisting] = useState<ExistingRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(Boolean(session));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session) {
      setLoadingRequest(false);
      return;
    }

    let active = true;

    const loadRequest = async () => {
      const { data, error } = await supabase
        .from('account_deletion_requests')
        .select('status, created_at')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!active) return;

      if (!error && data) {
        setExisting(data as ExistingRequest);
      }
      setLoadingRequest(false);
    };

    loadRequest();
    return () => {
      active = false;
    };
  }, [session]);

  const handleSubmit = () => {
    if (!session) return;

    showConfirm(
      'Request account deletion?',
      'This sends a request for review. Your account is not deleted immediately. You should delete individual reports and photos first if you want them removed right away.',
      async () => {
        setSubmitting(true);

        const { error } = await supabase.from('account_deletion_requests').insert({
          user_id: session.user.id,
          email: session.user.email ?? '',
          reason: reason.trim() || null,
        });

        setSubmitting(false);

        if (error) {
          if (error.code === '23505') {
            showAlert(
              'Request already submitted',
              'Your deletion request is already pending. There is no need to send another.'
            );
            return;
          }
          showAlert('Could not submit request', error.message);
          return;
        }

        setExisting({
          status: 'pending',
          created_at: new Date().toISOString(),
        });
        showAlert(
          'Request submitted',
          'FindIt received your request. No further action is needed from you at this time.'
        );
      },
      { confirmLabel: 'Submit request', destructive: true }
    );
  };

  if (!session) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centeredContent}>
        <FadeIn>
          <View style={styles.card}>
            <Text style={styles.title}>Delete Account</Text>
            <Text style={styles.paragraph}>
              Log in to submit an account deletion request.
            </Text>
            <Button title="Log In" onPress={() => navigation.navigate('Login')} />
          </View>
        </FadeIn>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FadeIn>
        <View style={styles.card}>
          <Text style={styles.title}>Delete Account</Text>
          <Text style={styles.lead}>
            If you no longer want to use FindIt, you can submit a deletion request.
          </Text>

          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>What this does</Text>
            <Text style={styles.noticeText}>
              Sends your request to the FindIt administrator for review. Your account remains active until the request is processed.
            </Text>
          </View>

          <View style={styles.noticeDanger}>
            <Text style={styles.noticeTitle}>Before you continue</Text>
            <Text style={styles.noticeText}>
              Delete your reports and uploaded photos first if you want them removed immediately. Deleting your account may permanently remove access to your reports.
            </Text>
          </View>

          {loadingRequest ? (
            <Text style={styles.muted}>Checking for an existing request...</Text>
          ) : existing ? (
            <View style={styles.existingRequest}>
              <Text style={styles.existingTitle}>Request status: {existing.status}</Text>
              <Text style={styles.muted}>
                Submitted {new Date(existing.created_at).toLocaleDateString()}
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>Reason (optional)</Text>
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="Tell us why you want to delete your account"
            placeholderTextColor={Colors.textSecondary}
            multiline
            maxLength={500}
            editable={!existing}
          />
          <Text style={styles.counter}>{reason.length}/500</Text>

          <Button
            title={submitting ? 'Submitting...' : 'Submit Deletion Request'}
            onPress={handleSubmit}
            variant="danger"
            loading={submitting}
            disabled={Boolean(existing)}
          />

          {existing ? (
            <Text style={styles.mutedCentered}>
              You already have a deletion request. No further action is needed.
            </Text>
          ) : null}
        </View>
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
    maxWidth: 640,
    alignSelf: 'center',
  },
  centeredContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontFamily: Fonts.extraBold,
    marginBottom: Spacing.sm,
  },
  lead: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: Fonts.regular,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  notice: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  noticeDanger: {
    backgroundColor: Colors.dangerSoft,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  noticeTitle: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
  },
  noticeText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 21,
  },
  existingRequest: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  existingTitle: {
    color: Colors.primary,
    fontSize: 15,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
    textTransform: 'capitalize',
  },
  label: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.sm,
  },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radii.md,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.regular,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginVertical: Spacing.sm,
  },
  muted: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  mutedCentered: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  paragraph: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: Fonts.regular,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
});
