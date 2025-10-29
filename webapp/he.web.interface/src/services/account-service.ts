import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase-config';

export interface AccountHP {
  userId: string;
  email: string;
  organization: string;
  organizationType: string;
  organizationPhone: string;
  address1: string;
  address2: string;
  city: string;
  county: string;
  state: string;
  postalCode: string;
  tenantKey?: string; // SQL database tenant key
  createdAt?: any;
  updatedAt?: any;
}

export interface TenantHP {
  userId: string;
  accountId: string;
  tenantKey?: string; // SQL database tenant key
  createdAt?: any;
}

// Check if account exists for a user
export async function checkAccountExists(userId: string): Promise<boolean> {
  try {
    const accountRef = doc(db, 'accounts_hp', userId);
    const accountSnap = await getDoc(accountRef);
    return accountSnap.exists();
  } catch (error) {
    console.error('Error checking account:', error);
    return false;
  }
}

// Get account by userId
export async function getAccount(userId: string): Promise<AccountHP | null> {
  try {
    const accountRef = doc(db, 'accounts_hp', userId);
    const accountSnap = await getDoc(accountRef);

    if (accountSnap.exists()) {
      return accountSnap.data() as AccountHP;
    }
    return null;
  } catch (error) {
    console.error('Error getting account:', error);
    return null;
  }
}

// Create a new account
export async function createAccount(accountData: Omit<AccountHP, 'createdAt' | 'updatedAt'>): Promise<void> {
  try {
    const accountRef = doc(db, 'accounts_hp', accountData.userId);

    await setDoc(accountRef, {
      ...accountData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating account:', error);
    throw new Error('Failed to create account');
  }
}

// Update an existing account
export async function updateAccount(userId: string, accountData: Partial<AccountHP>): Promise<void> {
  try {
    const accountRef = doc(db, 'accounts_hp', userId);

    await setDoc(accountRef, {
      ...accountData,
      userId, // Ensure userId is always present
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating account:', error);
    throw new Error('Failed to update account');
  }
}

// Check if tenant exists for a user
export async function checkTenantExists(userId: string): Promise<boolean> {
  try {
    const tenantsRef = collection(db, 'tenants_hp');
    const tenantRef = doc(tenantsRef, userId);
    const tenantSnap = await getDoc(tenantRef);
    return tenantSnap.exists();
  } catch (error) {
    console.error('Error checking tenant:', error);
    return false;
  }
}

// Create tenant entry (userId as document ID, accountId as the account document ID)
export async function createTenant(userId: string, accountId: string, tenantKey?: string): Promise<void> {
  try {
    const tenantRef = doc(db, 'tenants_hp', userId);

    await setDoc(tenantRef, {
      userId,
      accountId,
      tenantKey: tenantKey || accountId, // Use provided tenant key or fallback to accountId
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    throw new Error('Failed to create tenant');
  }
}

// Ensure tenant exists - creates it if missing
export async function ensureTenantExists(userId: string, accountId: string, tenantKey?: string): Promise<void> {
  try {
    const tenantExists = await checkTenantExists(userId);

    if (!tenantExists) {
      await createTenant(userId, accountId, tenantKey);
    }
  } catch (error) {
    console.error('Error ensuring tenant exists:', error);
    throw new Error('Failed to ensure tenant exists');
  }
}

// Get account by tenantKey
export async function getAccountByTenantKey(tenantKey: string): Promise<AccountHP | null> {
  try {
    const accountsRef = collection(db, 'accounts_hp');
    const q = query(accountsRef, where('tenantKey', '==', tenantKey));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as AccountHP;
    }

    // If not found by tenantKey, try to get by userId (tenantKey might be the userId)
    const accountByUserId = await getAccount(tenantKey);
    if (accountByUserId) {
      return accountByUserId;
    }

    return null;
  } catch (error) {
    console.error('Error getting account by tenant key:', error);
    return null;
  }
}

// Get organization name by tenantKey
export async function getOrganizationNameByTenantKey(tenantKey: string): Promise<string | null> {
  try {
    const account = await getAccountByTenantKey(tenantKey);
    return account?.organization || null;
  } catch (error) {
    console.error('Error getting organization name by tenant key:', error);
    return null;
  }
}
