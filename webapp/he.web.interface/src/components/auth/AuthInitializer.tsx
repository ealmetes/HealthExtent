import { useEffect, useState, type ReactNode } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { apiClient } from '@/lib/api-client';
import { updateMemberNamesFromAuthProfile } from '@/services/members-service';
import { auth } from '@/config/firebase-config';

interface AuthInitializerProps {
  children: ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const { isAuthenticated, getAccessToken, tenantKey, user } = useFirebaseAuth();
  const [apiTokenInitialized, setApiTokenInitialized] = useState(false);

  // Initialize API token from production API
  useEffect(() => {
    const initializeApiToken = async () => {
      try {
        // Use hardcoded values for production API
        const username = 'ealmetes';
        const prodTenantKey = 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';

        console.log('Fetching API token from production API...');
        const tokenResponse = await apiClient.getApiToken(username, prodTenantKey, prodTenantKey);

        console.log('Token received, expires:', tokenResponse.expires);
        apiClient.setStaticToken(tokenResponse.token);

        // Set tenant key getter to use production tenant
        apiClient.setTenantKeyGetter(() => prodTenantKey);

        setApiTokenInitialized(true);
        console.log('Production API token initialized successfully');
      } catch (error) {
        console.error('Failed to initialize API token:', error);
        // Still mark as initialized to allow app to load
        setApiTokenInitialized(true);
      }
    };

    initializeApiToken();
  }, []);

  // Optional: Set up Firebase auth if still needed for other features
  useEffect(() => {
    if (isAuthenticated && apiTokenInitialized) {
      console.log('Firebase auth active, tenant key:', tenantKey);
    }
  }, [isAuthenticated, tenantKey, apiTokenInitialized]);

  // Sync member names from Firebase Auth profile when user is authenticated
  useEffect(() => {
    const syncMemberNames = async () => {
      const currentUser = auth.currentUser;
      if (isAuthenticated && tenantKey && currentUser && user?.email) {
        try {
          await updateMemberNamesFromAuthProfile(
            user.email,
            currentUser.uid,
            tenantKey,
            currentUser.displayName || undefined
          );
        } catch (error) {
          console.error('Failed to sync member names:', error);
          // Non-critical, don't block the app
        }
      }
    };

    syncMemberNames();
  }, [isAuthenticated, tenantKey, user?.email]);

  return <>{children}</>;
}
