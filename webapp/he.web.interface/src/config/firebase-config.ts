import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, doc, getDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

export { firebaseApp, auth, db };

// Extract tenant key from tenants_hp Firestore collection
export async function getTenantKeyFromUser(user: any): Promise<string | null> {
  if (!user) return null;

  try {
    // First try to get tenant key from custom claims (for backward compatibility)
    const idTokenResult = await user.getIdTokenResult();
    const claimsTenantKey = idTokenResult.claims.tenantKey
      || idTokenResult.claims.tenant_key
      || idTokenResult.claims.tenant;

    if (claimsTenantKey) {
      return claimsTenantKey;
    }

    // If no custom claims, fetch from tenants_hp collection
    const tenantRef = doc(db, 'tenants_hp', user.uid);
    const tenantSnap = await getDoc(tenantRef);

    if (tenantSnap.exists()) {
      const tenantData = tenantSnap.data();
      // Return tenantKey field, or fallback to accountId
      return tenantData.tenantKey || tenantData.accountId || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting tenant key:', error);
    return null;
  }
}
