import React from 'react';
import LegalDocument, { LegalSection } from '../components/LegalDocument';
import { LEGAL_EFFECTIVE_DATE, SUPPORT_CONTACT } from '../constants/legal';

const sections: LegalSection[] = [
  {
    heading: '1. Information we collect',
    body: [
      'Account details: your email address and any name you choose to add to your profile.',
      'Report details: item name, description, category, location, status, photos you upload, and contact information you choose to provide.',
      'Technical data: basic authentication and service logs needed to keep accounts secure and diagnose errors.',
      'Deletion requests: your user ID, email address, optional reason, and the status of your request.',
    ],
  },
  {
    heading: '2. How we use your information',
    body: [
      'We use your information to create and maintain your account, publish and manage your reports, allow other users to contact you about a matched item, respond to deletion requests, and protect the service from misuse.',
      'We do not sell your personal information. We do not use your report content for advertising.',
    ],
  },
  {
    heading: '3. Who can see your information',
    body: [
      'Public report details such as item name, description, category, location, photo, and status can be viewed by visitors, including people who are not logged in.',
      'Public report lists do not request contact information. A read-only anonymous check on 26 November 2026 confirmed that Supabase denies anonymous requests for the contact_info column.',
      'Contact details are visible to any signed-in user on a report detail screen so they can follow up about a matched item. Do not include contact details you are unwilling to share with other signed-in users.',
      'Your photos are stored in a public storage bucket so report images can be displayed. File paths are restricted so only the signed-in uploader can add or delete files in their own folder.',
      'FindIt uses Supabase for authentication, database, and storage, and Vercel for web hosting. These providers process data only to deliver those services.',
    ],
  },
  {
    heading: '4. Retention and deletion',
    body: [
      'Reports remain available until you edit, mark as recovered, or delete them. Deleting a report removes its record; stored photos should also be removed by the report owner where available.',
      'You can request account deletion from the Delete Account screen. A request does not delete data immediately. Once reviewed, your account and associated data will be removed where technically possible.',
      'Some technical logs or backups may remain for a limited period for security and recovery purposes.',
    ],
  },
  {
    heading: '5. Security',
    body: [
      'Access to data is controlled by Row Level Security policies and column permissions. The public anon key is included in the app by design; it does not grant access to contact_info because that column is restricted in the database, not merely hidden in the interface. FindIt does not place private service keys in the app. Passwords are handled by Supabase Auth.',
      'No online service can guarantee perfect security. Use a unique password and protect your device.',
    ],
  },
  {
    heading: '6. Your choices',
    body: [
      'You can review and edit your reports at any time. You can change your contact information by editing a report. You can request account deletion from inside the app.',
      'If you do not want contact information published, leave that field empty when creating or editing a report.',
    ],
  },
  {
    heading: '7. Children',
    body: [
      'FindIt is not intended for children under 13. If you believe a child has provided personal information, use the support contact below so it can be reviewed.',
    ],
  },
  {
    heading: '8. Changes to this policy',
    body: [
      'This policy may be updated as FindIt changes. The effective date above shows when the current version took effect.',
    ],
  },
  {
    heading: '9. Contact',
    body: [SUPPORT_CONTACT],
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocument
      title="Privacy Policy"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      intro="This policy explains what FindIt collects, why it is used, and who can see it."
      sections={sections}
    />
  );
}
