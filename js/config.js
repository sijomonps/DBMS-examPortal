import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    enableIndexedDbPersistence,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// TODO: Replace with your actual Firebase config
c// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA2q10kQBDZsXUXWs_75OILsk8fQRtNbd8",
    authDomain: "sqlab-e9a64.firebaseapp.com",
    projectId: "sqlab-e9a64",
    storageBucket: "sqlab-e9a64.firebasestorage.app",
    messagingSenderId: "740243812321",
    appId: "1:740243812321:web:bf6636829f0e7e0d682ca0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let app, db, auth;
let isInitialized = false;

export const initFirebase = async () => {
    if (isInitialized) return { app, db, auth };

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Modern offline persistence initialization
    db = initializeFirestore(app, {
        localCache: persistentLocalCache(/*settings*/{ tabManager: persistentMultipleTabManager() })
    });

    // Older equivalent was enableIndexedDbPersistence(db), new method above handles it cleanly

    isInitialized = true;
    console.log("Firebase initialized with offline persistence");
    return { app, db, auth };
};

export const getDb = () => db;
export const getFirebaseAuth = () => auth;
