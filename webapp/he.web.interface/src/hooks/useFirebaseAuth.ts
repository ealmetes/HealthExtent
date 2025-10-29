import { useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, getTenantKeyFromUser } from '@/config/firebase-config';
import { checkAccountExists, ensureTenantExists } from '@/services/account-service';
import { getUserActiveTenants } from '@/services/members-service';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  tenantKey: string | null;
  hasAccount?: boolean;
  hasMembership?: boolean;
}

export function useFirebaseAuth() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [tenantKey, setTenantKey] = useState<string | null>(null);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [hasMembership, setHasMembership] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Check for selected tenant in localStorage first (for multi-tenant support)
        const selectedTenantKey = localStorage.getItem('selectedTenantKey');

        // Check if user has active memberships in members_hp (check by both userId and email)
        const activeMemberships = await getUserActiveTenants(fbUser.uid, fbUser.email || undefined);
        const hasActiveMembership = activeMemberships.length > 0;
        setHasMembership(hasActiveMembership);

        // Use tenant from membership if available and no selected tenant
        let userTenantKey = selectedTenantKey;
        if (!userTenantKey && hasActiveMembership) {
          userTenantKey = activeMemberships[0].tenantKey;
        }

        // Extract tenant key from custom claims as fallback
        if (!userTenantKey) {
          userTenantKey = await getTenantKeyFromUser(fbUser);
        }
        setTenantKey(userTenantKey);

        // Check if account exists
        const accountExists = await checkAccountExists(fbUser.uid);
        setHasAccount(accountExists);

        // If account exists, ensure tenant exists (for legacy accounts)
        if (accountExists) {
          try {
            await ensureTenantExists(fbUser.uid, fbUser.uid);
          } catch (error) {
            console.error('Error ensuring tenant exists:', error);
          }
        }

        const authenticatedUser: AuthenticatedUser = {
          id: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || fbUser.email || 'User',
          tenantKey: userTenantKey,
          hasAccount: accountExists,
          hasMembership: hasActiveMembership,
        };

        setUser(authenticatedUser);
      } else {
        setUser(null);
        setTenantKey(null);
        setHasAccount(null);
        setHasMembership(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Signup function
  const signup = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name if provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }

      return userCredential.user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(new Error(errorMessage));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(new Error(errorMessage));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setError(null);
      // Clear selected tenant from localStorage
      localStorage.removeItem('selectedTenantKey');
      await signOut(auth);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(new Error(errorMessage));
      console.error('Logout error:', err);
    }
  };

  // Get access token (Firebase ID token)
  const getAccessToken = async (): Promise<string | null> => {
    if (!firebaseUser) {
      return null;
    }

    try {
      // Get fresh ID token (automatically refreshes if needed)
      const token = await firebaseUser.getIdToken(true);
      return token;
    } catch (err) {
      console.error('Token acquisition error:', err);
      setError(err instanceof Error ? err : new Error('Token acquisition failed'));
      return null;
    }
  };

  return {
    user,
    firebaseUser,
    isAuthenticated: !!firebaseUser,
    hasAccount,
    hasMembership,
    isLoading,
    error,
    signup,
    login,
    logout,
    getAccessToken,
    tenantKey,
  };
}
