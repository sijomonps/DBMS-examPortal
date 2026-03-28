import { 
    signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from './config.js';

export async function signInEmail(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        console.error("Auth error:", error);
        throw error;
    }
}

export async function signOutAdmin() {
    return signOut(auth);
}

export function authStateObserver(callback) {
    return onAuthStateChanged(auth, callback);
}

export async function updateAdminPassword(newPassword) {
    const user = auth.currentUser;
    if (user) {
        return updatePassword(user, newPassword);
    } else {
        throw new Error("No user is currently signed in.");
    }
}
