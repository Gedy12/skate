# Skate House Management System - Setup & Instructions

## Firebase Setup
1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore** in Test mode initially, then apply the Security Rules below.
3. Enable **Authentication** (Email/Password provider).
4. Go to Project Settings -> General -> Web Apps -> Add App.
5. Copy the configuration and create a `.env.local` file at the root of this project:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

## Firestore Security Rules
Go to the Firestore Database -> Rules tab and paste the following rules to secure the database:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || getUserRole() == 'super_admin');
      allow write: if isAuthenticated() && getUserRole() == 'super_admin';
    }

    match /skates/{skateId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (getUserRole() == 'trainer' || getUserRole() == 'super_admin');
    }

    match /sessions/{sessionId} {
      allow read: if isAuthenticated();
      // Trainers can create and update sessions (to finish them), but not delete
      allow create, update: if isAuthenticated() && (getUserRole() == 'trainer' || getUserRole() == 'super_admin');
      allow delete: if isAuthenticated() && getUserRole() == 'super_admin';
    }

    match /settings/{docId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && getUserRole() == 'super_admin';
    }
  }
}
```

## Creating the Initial Users
1. Go to Firebase Authentication and create two users:
   - `admin@skatehouse.com`
   - `trainer@skatehouse.com`
2. Go to Firestore Database and create a collection called `users`.
3. Add two documents where the Document ID matches the UID of the users you just created in Auth:
   - Document ID: `[admin UID]`
     - `email`: `admin@skatehouse.com`
     - `role`: `super_admin`
   - Document ID: `[trainer UID]`
     - `email`: `trainer@skatehouse.com`
     - `role`: `trainer`

## Initializing the 16 Skates
The Trainer application automatically initializes 16 skates in the local IndexedDB if they are missing. When the app comes online, these skates will be synced up to Firestore. Alternatively, the Super Admin can manually create 16 documents in the `skates` collection.

## IndexedDB Implementation Overview
IndexedDB is implemented using the `idb` library. The `src/lib/indexeddb.ts` file exports functions to initialize the `skatehouse_db` database with 3 stores:
- `skates`: For keeping the 16 skates available locally.
- `sessions`: For keeping track of active and completed local sessions.
- `sync_queue`: For pushing operations (CREATE_SESSION, UPDATE_SKATE, etc.) offline to be processed later.

The `src/lib/sync.ts` service polls this queue and idempotently pushes to Firebase using the local UUIDs.

## How to Run Locally
```bash
npm install
npm run dev
```

## How to Deploy
1. The app can be deployed to Vercel (recommended for Next.js).
2. Connect your GitHub repository to Vercel.
3. Add the `NEXT_PUBLIC_FIREBASE_*` environment variables in the Vercel dashboard.
4. Deploy. The application will generate a Service Worker during the build for offline PWA support.
