import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyA2q10kQBDZsXUXWs_75OILsk8fQRtNbd8",
    authDomain: "sqlab-e9a64.firebaseapp.com",
    projectId: "sqlab-e9a64",
    storageBucket: "sqlab-e9a64.firebasestorage.app",
    messagingSenderId: "740243812321",
    appId: "1:740243812321:web:bf6636829f0e7e0d682ca0"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

console.log("Firebase initialized");
