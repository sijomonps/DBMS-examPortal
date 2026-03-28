# SQLab — Online SQL Exam Platform

A complete offline-first SQL exam web application, designed specifically for static hosting (GitHub Pages) with Firebase backend on the Spark plan (free tier).

## Features
- **Offline First**: Works fully without internet after the initial load. Exam answers save to `localStorage` and auto-sync to Firebase.
- **In-Browser SQL Execution**: Powered by `sql.js` (SQLite compiled to WebAssembly), queries are genuinely run locally.
- **Rich Editor**: Uses CodeMirror 6 for real-time SQL syntax highlighting.
- **Examiner Dashboard**: View students' queries, run them, grade answers — fully authorized with Google Auth.
- **100% Client Side**: Absolute zero backend hosting needed beside Firebase Firestore.

## Setup Instructions

### 1. Firebase Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Under "Build", click "Firestore Database" and create a database (Start in Test Mode or update rules below).
3. Under "Build", click "Authentication" and enable "Google" sign-in.
4. Go to Project Settings -> General -> "Your apps" -> Add a Web App.
5. Copy the `firebaseConfig` block.
6. Open `js/config.js` and paste your `firebaseConfig` object, replacing the placeholder.

### 2. Firestore Security Rules
To make the platform secure, deploy these Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Anyone can read exam basic details (specifically passwords to login)
    match /exams/{examId} {
      allow read: if true;
      allow write: if request.auth != null; // Only Examiner can create/modify
    }
    
    // Only Examiners can read submissions
    // Anyone (including unauthenticated students) can ADD their answers
    match /submissions/{examId}/{document=**} {
      allow read: if request.auth != null;
      allow write: if true; // In a production env you might want tighter write constraints here
    }
  }
}
```

### 3. Deploy to GitHub Pages
1. Push this entire repository to GitHub.
2. Navigate to your repository's Settings > Pages.
3. Select "Deploy from a branch", and choose your `main` branch (and `/root` folder).
4. Save, and your app will be live dynamically!

## Connecting

- **Student Login**: `index.html` — requires the exam password setup by the Examiner.
- **Examiner Dashboard**: `admin.html` — requires Google Auth. Only the accounts listed in Firebase Authentication can log in.

## Technologies Used
- HTML, CSS, Vanilla JS
- [Firebase v10 (Firestore & Auth)](https://firebase.google.com/)
- [sql.js WebAssembly](https://sql.js.org/)
- [CodeMirror 6](https://codemirror.net/)
- Registered Service Workers & localStorage for offline persistance.
