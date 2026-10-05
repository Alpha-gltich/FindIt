# FindIt

A mobile lost-and-found app built for a university/campus community. Report items you've lost or found, browse and search reports from others, and connect through optional contact info once you find a match.

## Features

- **Account system**: sign up and log in with email/password (Supabase Auth), with email confirmation and persistent sessions across app restarts
- **Report Lost or Found items**: item name, description, category, location, optional photo, and optional contact info
- **Browse reports**: search by keyword, filter by category, and toggle between Lost/Found
- **Item detail view**: full report details; contact info is shown in the app only to logged-in users
- **My Reports**: view, edit, mark as recovered, or delete your own submitted reports
- **Photo upload**: attach a photo to any report, stored via Supabase Storage
- **Error handling**: validation on all forms, retry-able error states on network failures

## Tech Stack

- **Frontend:** React Native (Expo SDK 54), TypeScript, React Navigation
- **Backend:** Supabase (Auth, PostgreSQL, Storage)
- **State/Auth:** React Context (`AuthContext`) for session persistence via AsyncStorage

## Project Structure

```
FindIt/
├── src/
│   ├── components/   # Button, Input
│   ├── constants/    # colors.ts (design system)
│   ├── contexts/     # AuthContext (session state)
│   ├── navigation/   # AppNavigator (React Navigation stack)
│   ├── screens/      # Home, Login, Register, ReportLost, ReportFound,
│   │                 # Browse, ItemDetail, MyReports, EditReport
│   ├── services/     # supabase.ts (client config)
│   └── types/        # navigation.ts (Report type, RootStackParamList)
├── App.tsx
├── app.json
└── package.json
```

## Database Schema

**`reports` table** (Supabase PostgreSQL, Row Level Security enabled)

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | References `auth.users` |
| type | text | `'lost'` or `'found'` |
| item_name | text | |
| description | text | |
| category | text | |
| location | text | |
| photo_url | text | Nullable |
| status | text | `'active'` or `'recovered'` |
| contact_info | text | Nullable, optional at submission |
| created_at | timestamptz | |

RLS policies: public read access; insert, update and delete are limited to the report's owner (`auth.uid() = user_id`).

## Getting Started

### Prerequisites

- Node.js and npm
- Expo Go (iOS/Android) on a version that supports Expo SDK 54, or an emulator/simulator
- A Supabase project with Auth, a `reports` table (schema above) and a Storage bucket for photos

### Installation

```bash
git clone https://github.com/Alpha-gltich/FindIt.git
cd FindIt
npm install
```

### Configuration

The Supabase URL and anon (public) key are set in `src/services/supabase.ts`. To run the app against your own Supabase project, replace both values there.

### Running

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` for an Android emulator or `w` for web.

## Screenshots

_[Add screenshots here: Home, Browse, Report form, Item Detail, My Reports]_

## Known Limitations

- Email confirmation links redirect to a default Supabase localhost page (cosmetic only; confirmation still succeeds server-side). A custom deep-link redirect requires a standalone Expo build.
- Contact info is hidden from logged-out users in the app's interface only. Because the database's public read policy covers every column, contact details can still be retrieved by calling the Supabase API directly with the public key. Restricting that column at the database level is planned future work.
- In-app messaging between users is out of scope for this version.

## Author

Theophilus Godwin ([github.com/Alpha-gltich](https://github.com/Alpha-gltich))