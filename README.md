# Temple Digital Platform

A digital platform for a temple/devastanam organization, providing mobile booking, content management, and public information access.

## Architecture

```
Admin Dashboard (Phase 2)
        │
        ▼
  Firebase Backend
   ┌────┴────┐
   │ Firestore │  Firebase Auth  │  Firebase Storage  │  FCM
   └────┬────┘
        │
   ┌────┴─────────────┐
   │                   │
Android App         Website
(Phase 3)          (Phase 6)
```

All clients share the same Firebase project and Firestore database.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Firebase (Spark/free plan) |
| Database | Cloud Firestore |
| Authentication | Firebase Auth (Email/Password) |
| File Storage | Firebase Storage |
| Push Notifications | Firebase Cloud Messaging |
| Android | Kotlin + Jetpack Compose (Phase 3) |
| Admin Dashboard | Web app (Phase 2) |
| Website | TBD (Phase 6) |

## Project Structure

```
Temple/
├── firebase.json              # Firebase project config
├── .firebaserc                # Firebase project alias
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Composite indexes
├── storage.rules              # Storage security rules
├── .gitignore                 # Git ignore patterns
├── .env.example               # Environment variable template
├── README.md                  # This file
├── docs/
│   └── phase1-technical-doc.md    # Phase 1 technical documentation
├── firebase/
│   └── seed/
│       └── seed-data.js       # Development seed data script
└── firestore-schema/
    └── schema.md              # Firestore collection schema reference
```

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)
- A Firebase project on the **Spark (free) plan**

### Firebase Project Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
2. Select the **Spark (no-cost)** plan
3. Enable **Authentication** → Email/Password provider
4. Enable **Cloud Firestore** (start in production mode)
5. Enable **Firebase Storage**
6. Update `.firebaserc` with your project ID

### Local Development

```bash
# Login to Firebase CLI
firebase login

# Set active project
firebase use YOUR_PROJECT_ID

# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only storage

# Deploy indexes
firebase deploy --only firestore:indexes
```

### Seed Data (Development Only)

```bash
cd firebase/seed
npm install firebase-admin
GOOGLE_APPLICATION_CREDENTIALS=./path-to-service-key.json node seed-data.js
```

> ⚠ Never commit service account key files. See `.gitignore`.

### Admin Provisioning

Admin accounts must be created manually (security requirement):

1. Create a Firebase Auth account (email/password) via Firebase Console
2. Copy the Auth UID
3. In Firestore, create a document at `admins/{AUTH_UID}` with fields:
   - `name`: Admin's name
   - `email`: Admin's email
   - `role`: `"admin"`
   - `createdAt`: current timestamp
   - `updatedAt`: current timestamp

## Documentation

- [Firestore Schema](firestore-schema/schema.md) — Collections, fields, types, relationships
- [Phase 1 Technical Doc](docs/phase1-technical-doc.md) — Architecture, security, billing analysis

## Development Phases

| Phase | Scope | Status |
|---|---|---|
| 1 | Firebase + Database + Foundation | ✅ Complete |
| 2 | Admin Dashboard | ⏳ Next |
| 3 | Android Application | Planned |
| 4 | Integration + Testing | Planned |
| 5 | Google Play Submission | Planned |
| 6 | Website | Planned |

## License

Private — Client project. All rights reserved.
