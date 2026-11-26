import React from 'react';
import LegalDocument, { LegalSection } from '../components/LegalDocument';
import { LEGAL_EFFECTIVE_DATE, SUPPORT_CONTACT } from '../constants/legal';

const sections: LegalSection[] = [
  {
    heading: '1. Using FindIt',
    body: [
      'FindIt helps people report lost and found items. By creating an account or publishing a report, you agree to use the service lawfully and only for its intended purpose.',
      'You must provide accurate information and are responsible for activity that happens under your account.',
    ],
  },
  {
    heading: '2. Accounts',
    body: [
      'You are responsible for keeping your login details confidential. Notify support if you believe your account has been used without your permission.',
      'FindIt may suspend or remove accounts that abuse the service, impersonate others, or submit harmful content.',
    ],
  },
  {
    heading: '3. Reports and content',
    body: [
      'You may submit reports only for items you genuinely lost or found. Do not publish another person’s private information, fraudulent claims, unsafe instructions, or content you do not have the right to share.',
      'You keep ownership of the text and photos you submit. By submitting them, you allow FindIt to display them to other users so reports can be matched and resolved.',
      'Contact information is visible only to signed-in users. You choose whether to include it.',
    ],
  },
  {
    heading: '4. Prohibited use',
    body: [
      'Do not use FindIt for harassment, scams, spam, illegal activity, scraping, automated bulk access, or attempts to breach security controls.',
      'Do not upload files that contain malware or content that violates applicable law.',
    ],
  },
  {
    heading: '5. Availability and changes',
    body: [
      'FindIt is provided as-is. We aim to keep it available, but we do not promise uninterrupted or error-free operation and may change or discontinue features.',
      'We may update these Terms. The effective date above shows when the current version took effect.',
    ],
  },
  {
    heading: '6. Liability',
    body: [
      'FindIt is a matching tool. It does not guarantee that a lost item will be recovered, that any contact information is accurate, or that users will meet safely.',
      'To the extent allowed by law, FindIt and its operators are not liable for indirect or consequential losses arising from use of the service.',
    ],
  },
  {
    heading: '7. Safety',
    body: [
      'Arrange meetings in public places and take reasonable precautions when contacting someone about an item. Never share information you are not comfortable sharing.',
    ],
  },
  {
    heading: '8. Contact',
    body: [SUPPORT_CONTACT],
  },
];

export default function TermsScreen() {
  return (
    <LegalDocument
      title="Terms and Conditions"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      intro="These Terms govern your use of FindIt. Please read them before posting a report."
      sections={sections}
    />
  );
}
