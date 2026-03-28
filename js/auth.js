import { 
    getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updatePassword 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirebaseAuth } from './config.js';

const provider = new GoogleAuthProvider();

export async function signInGoogle() {
    const auth = getFirebaseAuth();
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Auth error:", error);
        throw error;
    }
}

export async function signOutAdmin() {
    const auth = getFirebaseAuth();
    return signOut(auth);
}

export function authStateObserver(callback) {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, callback);
}

export async function updateAdminPassword(newPassword) {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (user) {
        return updatePassword(user, newPassword);
    } else {
        throw new Error("No user is currently signed in.");
    }
}
