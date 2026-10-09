import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  deleteUser,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import { GameHistoryEntry, GameSettings, Language } from './types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with specific databaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Sign In with Google
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (user) {
      // Sync user profile in Firestore safely (don't block auth if offline or permission denied)
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || 'Player',
          email: user.email || '',
          photoURL: user.photoURL || '',
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr) {
        console.warn('Firestore user profile sync deferred:', dbErr);
      }
    }
    return user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    // If user merely closed the popup, don't throw an aggressive fatal error
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      return null;
    }
    throw error;
  }
};

// Sign Out
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Save Match History to Firestore
export const saveMatchToCloud = async (userId: string, match: GameHistoryEntry, settings?: GameSettings) => {
  try {
    const matchRef = doc(db, 'users', userId, 'matches', match.id);
    await setDoc(matchRef, {
      ...match,
      userId,
      difficulty: settings?.difficulty || 'easy',
      language: settings?.language || 'fa',
      roundsCount: settings?.roundsCount || 3,
      createdAt: serverTimestamp()
    });

    // Update user stats
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentCount = userDoc.exists() ? (userDoc.data()?.totalGamesPlayed || 0) : 0;
    await setDoc(userRef, {
      totalGamesPlayed: currentCount + 1,
      lastPlayedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving match to cloud:', error);
  }
};

// Fetch User's Cloud Match History
export const fetchUserMatchHistory = async (userId: string): Promise<GameHistoryEntry[]> => {
  try {
    const matchesCol = collection(db, 'users', userId, 'matches');
    const q = query(matchesCol, orderBy('createdAt', 'desc'), limit(30));
    const snapshot = await getDocs(q);
    const results: GameHistoryEntry[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      results.push({
        id: data.id || docSnap.id,
        date: data.date,
        winnerNames: data.winnerNames || [],
        winnerColor: data.winnerColor || 'BLUE',
        players: data.players || [],
        language: (data.language as Language) || 'fa'
      });
    });
    return results;
  } catch (error) {
    console.error('Error fetching cloud match history:', error);
    return [];
  }
};

// Sync Settings with Cloud
export const syncSettingsToCloud = async (userId: string, settings: GameSettings) => {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    // Only attempt write when authenticated user matches userId
    return;
  }
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { settings }, { merge: true });
  } catch (error: any) {
    // Handle offline or pending permission issues gracefully without crashing or throwing
    if (error?.code === 'permission-denied') {
      console.warn('Settings cloud sync pending authentication verification.');
    } else {
      console.warn('Settings cloud sync notice:', error?.message || error);
    }
  }
};

export const fetchSettingsFromCloud = async (userId: string): Promise<GameSettings | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists() && snapshot.data()?.settings) {
      return snapshot.data().settings as GameSettings;
    }
    return null;
  } catch (error) {
    console.error('Error fetching settings from cloud:', error);
    return null;
  }
};

// Permanently delete user account and cloud data (Google Play Policy Compliance)
export const deleteUserAccountAndData = async (userId?: string): Promise<boolean> => {
  try {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return true;

    // 1. Delete all matches in subcollection
    const matchesCol = collection(db, 'users', uid, 'matches');
    const matchesSnap = await getDocs(matchesCol);
    const deletePromises = matchesSnap.docs.map(docSnap => deleteDoc(doc(db, 'users', uid, 'matches', docSnap.id)));
    await Promise.all(deletePromises);

    // 2. Delete user profile document
    await deleteDoc(doc(db, 'users', uid));

    // 3. Clear local storage records
    try {
      localStorage.removeItem('dour_match_history');
      localStorage.removeItem('dour_personal_records');
      localStorage.removeItem('dour_game_settings');
    } catch (e) {
      console.warn('Local storage clear notice:', e);
    }

    // 4. Delete the Firebase Auth User
    if (auth.currentUser && auth.currentUser.uid === uid) {
      await deleteUser(auth.currentUser);
    }

    return true;
  } catch (error) {
    console.error('Error deleting account and data:', error);
    throw error;
  }
};
