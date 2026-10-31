import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
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
import { isAdminUser } from './constants';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with specific databaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Mobile and Environment Detection Helpers
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|SamsungBrowser|Mobile/i.test(ua);
  const isTouchScreen = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const isNarrow = window.innerWidth <= 768;
  return isMobileUA || (isTouchScreen && isNarrow);
};

export const isSamsungBrowser = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /SamsungBrowser/i.test(navigator.userAgent || '');
};

export const isStandalonePWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    Boolean((navigator as any)?.standalone);
};

export const isAndroidAppOrWebView = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isAndroidUA = /Android/i.test(ua);
  const hasWv = /; wv|Version\/[0-9.]+/i.test(ua);
  const isFileProto = window.location.protocol === 'file:';
  return isAndroidUA && (hasWv || isFileProto);
};

export const isInAppBrowser = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = (navigator.userAgent || '').toLowerCase();
  return /fban|fbav|instagram|telegram|whatsapp|line|twitter|micromessenger|snapchat|kakaotalk|eitaa|rubika|bale|wv/.test(ua);
};

export const isInIframe = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

// Friendly Persian / English Auth Error Resolver
export const getFriendlyAuthErrorMessage = (error: any, isRTL: boolean = true): string => {
  const code = error?.code || '';
  if (code === 'auth/network-request-failed') {
    return isRTL
      ? 'ارتباط با سرورهای احراز هویت گوگل برقرار نشد. اگر در ایران هستید، سرورهای احراز هویت گوگل ممکن است فیلتر باشند یا نیاز به فیلترشکن/اینترنت آزاد داشته باشند. همچنین می‌توانید بدون نیاز به لاگین، به عنوان مهمان به تمام امکانات بازی و لایتنر دسترسی داشته باشید.'
      : 'Could not connect to Google Auth servers. Please check your internet connection or VPN. You can also continue playing as a Guest with full local features.';
  }
  if (code === 'auth/popup-blocked') {
    return isRTL
      ? 'پنجره ورود توسط مرورگر مسدود شد. لطفاً از دکمه «ورود مستقیم بدون پاپ‌آپ» استفاده کنید یا تنظیمات مرورگر را بررسی فرمایید.'
      : 'Popup blocked by browser. Please use the Direct Mobile Login button.';
  }
  if (code === 'auth/unauthorized-domain') {
    return isRTL
      ? 'دامنه یا آدرس این برنامه در لیست دامنه‌های مجاز فایربیس گوگل ثبت نشده است.'
      : 'Current domain is not authorized in Firebase Auth settings.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return isRTL ? 'فرآیند ورود لغو شد.' : 'Sign-in was cancelled.';
  }
  return isRTL
    ? (error?.message || 'خطا در فرآیند ورود. لطفاً از روش ورود مستقیم استفاده کنید یا در حالت مهمان بازی کنید.')
    : (error?.message || 'Authentication error. Please try again or continue as Guest.');
};

// Safe Firestore profile sync
export const syncUserProfileToCloud = async (user: User): Promise<void> => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const isAdmin = isAdminUser(user.email);
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || 'Player',
      email: user.email || '',
      photoURL: user.photoURL || '',
      role: isAdmin ? 'admin' : 'user',
      isAdmin: isAdmin,
      lastLoginAt: new Date().toISOString()
    }, { merge: true });
  } catch (dbErr) {
    console.warn('Firestore user profile sync deferred:', dbErr);
  }
};

// Handle returning from signInWithRedirect
export const initAuthRedirectHandler = async (): Promise<User | null> => {
  if (typeof window === 'undefined') return null;
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      await syncUserProfileToCloud(result.user);
      try {
        sessionStorage.removeItem('dour_auth_redirect_pending');
      } catch {}
      return result.user;
    }
  } catch (err: any) {
    console.warn('Redirect sign-in resolution notice:', err?.code, err?.message);
  } finally {
    try {
      sessionStorage.removeItem('dour_auth_redirect_pending');
    } catch {}
  }
  return null;
};

export interface SignInOptions {
  mode?: 'auto' | 'popup' | 'redirect';
}

// Sign In with Google - Supports Desktop Popup, Mobile/Samsung Redirect Flow & Android WebView
export const signInWithGoogle = async (options: SignInOptions = {}): Promise<User | null> => {
  const mode = options.mode || 'auto';
  const inIframe = isInIframe();
  const mobile = isMobileDevice();
  const samsung = isSamsungBrowser();
  const standalone = isStandalonePWA();
  const isWebView = isAndroidAppOrWebView();

  // If in an Android WebView loaded from file:/// or local assets, signInWithRedirect navigates out of the local scheme
  // and cannot safely redirect back to file:///. So in Android WebView, prefer popup first.
  const preferRedirect = (mode === 'redirect') || 
    (mode === 'auto' && !isWebView && (standalone || (samsung && !inIframe) || (mobile && !inIframe)));

  if (preferRedirect && !inIframe) {
    try {
      sessionStorage.setItem('dour_auth_redirect_pending', '1');
    } catch {}
    await signInWithRedirect(auth, googleProvider);
    return null; // Browser will navigate to accounts.google.com
  }

  // Attempt popup flow
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (user) {
      await syncUserProfileToCloud(user);
    }
    return user;
  } catch (error: any) {
    console.warn('signInWithPopup error:', error?.code, error?.message);

    // If popup was blocked on mobile (and not in iframe), attempt fallback to redirect
    const isPopupIssue = error?.code === 'auth/popup-blocked' || 
                         error?.code === 'auth/cancelled-popup-request';

    if (isPopupIssue && !inIframe) {
      console.info('Falling back to signInWithRedirect for mobile device...');
      try {
        sessionStorage.setItem('dour_auth_redirect_pending', '1');
      } catch {}
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      return null;
    }

    throw error;
  }
};

// Local Player Profile for 100% device compatibility (without Google dependency)
export interface LocalPlayerProfile {
  name: string;
  avatarId: string;
}

export const getLocalPlayerProfile = (): LocalPlayerProfile => {
  if (typeof localStorage === 'undefined') {
    return { name: 'بازیکن ۱', avatarId: 'cat_cyber' };
  }
  try {
    const saved = localStorage.getItem('dour_local_profile');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return { name: 'بازیکن ۱', avatarId: 'cat_cyber' };
};

export const saveLocalPlayerProfile = (profile: LocalPlayerProfile): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem('dour_local_profile', JSON.stringify(profile));
  } catch {}
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
