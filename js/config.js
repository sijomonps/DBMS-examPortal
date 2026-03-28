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
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:1234:web:abcd"
};

let app, db, auth;
let isInitialized = false;

export const initFirebase = async () => {
    if (isInitialized) return { app, db, auth };
    
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Modern offline persistence initialization
    db = initializeFirestore(app, {
        localCache: persistentLocalCache(/*settings*/{tabManager: persistentMultipleTabManager()})
    });
    
    // Older equivalent was enableIndexedDbPersistence(db), new method above handles it cleanly

    isInitialized = true;
    console.log("Firebase initialized with offline persistence");
    return { app, db, auth };
};

export const getDb = () => db;
export const getFirebaseAuth = () => auth;
