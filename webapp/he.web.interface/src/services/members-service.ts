import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase-config';

export interface MemberHP {
  userId: string;
  memberDocId?: string; // Document ID in members_hp collection
  tenantKey: string;
  role: string;
  active: boolean;
  email?: string; // Store email for pending invites
  firstName?: string;
  lastName?: string;
  invitedAt?: any;
  activatedAt?: any;
}

// Get all members for a tenant
export async function getTenantMembers(tenantKey: string): Promise<MemberHP[]> {
  try {
    const membersRef = collection(db, 'members_hp');
    const q = query(membersRef, where('tenantKey', '==', tenantKey));
    const querySnapshot = await getDocs(q);

    const members: MemberHP[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as MemberHP;
      members.push({
        ...data,
        memberDocId: doc.id, // Store document ID for matching with AssignedToUserKey
        userId: data.userId || doc.id // Keep original userId, fallback to doc.id
      });
    });

    return members;
  } catch (error) {
    console.error('Error getting tenant members:', error);
    return [];
  }
}

// Get current user's member record for a specific tenant
export async function getCurrentUserMember(userId: string, tenantKey: string): Promise<MemberHP | null> {
  try {
    const membersRef = collection(db, 'members_hp');
    const q = query(
      membersRef,
      where('userId', '==', userId),
      where('tenantKey', '==', tenantKey),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as MemberHP;
    }

    return null;
  } catch (error) {
    console.error('Error getting current user member:', error);
    return null;
  }
}

// Get all tenants for a user (by email or userId)
export async function getUserTenants(email: string): Promise<MemberHP[]> {
  try {
    const membersRef = collection(db, 'members_hp');
    const q = query(membersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    const tenants: MemberHP[] = [];
    querySnapshot.forEach((doc) => {
      tenants.push({ ...doc.data() as MemberHP, userId: doc.id });
    });

    return tenants;
  } catch (error) {
    console.error('Error getting user tenants:', error);
    return [];
  }
}

// Get all active tenants for a user (by userId and email)
export async function getUserActiveTenants(userId: string, email?: string): Promise<MemberHP[]> {
  try {
    const membersRef = collection(db, 'members_hp');

    // First try to find by userId
    const qUserId = query(
      membersRef,
      where('userId', '==', userId),
      where('active', '==', true)
    );
    const userIdSnapshot = await getDocs(qUserId);

    const tenants: MemberHP[] = [];
    userIdSnapshot.forEach((doc) => {
      tenants.push({ ...doc.data() as MemberHP, userId: doc.id });
    });

    // If no results and email provided, also check by email (for newly activated accounts)
    if (tenants.length === 0 && email) {
      const qEmail = query(
        membersRef,
        where('email', '==', email),
        where('active', '==', true)
      );
      const emailSnapshot = await getDocs(qEmail);

      emailSnapshot.forEach((doc) => {
        tenants.push({ ...doc.data() as MemberHP, userId: doc.id });
      });
    }

    return tenants;
  } catch (error) {
    console.error('Error getting user active tenants:', error);
    return [];
  }
}

// Check if user is a member of a tenant
export async function isMemberOfTenant(email: string, tenantKey: string): Promise<boolean> {
  try {
    const membersRef = collection(db, 'members_hp');
    const q = query(
      membersRef,
      where('email', '==', email),
      where('tenantKey', '==', tenantKey)
    );
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking tenant membership:', error);
    return false;
  }
}

// Invite a member (creates pending member record)
export async function inviteMember(
  email: string,
  tenantKey: string,
  role: string,
  firstName?: string,
  lastName?: string
): Promise<void> {
  try {
    // Check if already invited
    const existing = await isMemberOfTenant(email, tenantKey);
    if (existing) {
      throw new Error('User is already a member or has been invited');
    }

    // Create a unique ID for the member (combine email and tenantKey)
    const memberId = `${email}_${tenantKey}`.replace(/[^a-zA-Z0-9]/g, '_');
    const memberRef = doc(db, 'members_hp', memberId);

    await setDoc(memberRef, {
      userId: '', // Will be filled when user signs up
      email,
      tenantKey,
      role,
      active: false,
      firstName: firstName || '',
      lastName: lastName || '',
      invitedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error inviting member:', error);
    throw error;
  }
}

// Activate member when they create an account or if they already have one
export async function activateMember(
  email: string,
  userId: string,
  tenantKey: string,
  firstName?: string,
  lastName?: string
): Promise<void> {
  try {
    // Match the ID format used in inviteMember
    const memberId = `${email}_${tenantKey}`.replace(/[^a-zA-Z0-9]/g, '_');
    const memberRef = doc(db, 'members_hp', memberId);

    const memberDoc = await getDoc(memberRef);
    if (!memberDoc.exists()) {
      throw new Error('Member invitation not found');
    }

    const updateData: any = {
      userId,
      active: true,
      activatedAt: serverTimestamp(),
    };

    // Update firstName and lastName if provided (ensure we set them even if empty strings to avoid undefined)
    if (firstName !== undefined) {
      updateData.firstName = firstName || '';
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName || '';
    }

    await updateDoc(memberRef, updateData);
  } catch (error) {
    console.error('Error activating member:', error);
    throw error;
  }
}

// Get pending invitations for an email
export async function getPendingInvitations(email: string): Promise<MemberHP[]> {
  try {
    const membersRef = collection(db, 'members_hp');
    const q = query(
      membersRef,
      where('email', '==', email),
      where('active', '==', false)
    );
    const querySnapshot = await getDocs(q);

    const invitations: MemberHP[] = [];
    querySnapshot.forEach((doc) => {
      invitations.push({ ...doc.data() as MemberHP, userId: doc.id });
    });

    return invitations;
  } catch (error) {
    console.error('Error getting pending invitations:', error);
    return [];
  }
}

// Add a member directly (when user already has account)
export async function addExistingUserAsMember(
  email: string,
  userId: string,
  tenantKey: string,
  role: string,
  firstName?: string,
  lastName?: string
): Promise<void> {
  try {
    // Check if already a member
    const existing = await isMemberOfTenant(email, tenantKey);
    if (existing) {
      throw new Error('User is already a member');
    }
    //.replace(/[^a-zA-Z0-9]/g, '_')
    const memberId = `${tenantKey}`;
    const memberRef = doc(db, 'members_hp', memberId);

    await setDoc(memberRef, {
      userId,
      email,
      tenantKey,
      role,
      active: true,
      firstName: firstName || '',
      lastName: lastName || '',
      invitedAt: serverTimestamp(),
      activatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding existing user as member:', error);
    throw error;
  }
}

// Update member names from Firebase Auth user profile
export async function updateMemberNamesFromAuthProfile(
  email: string,
  userId: string,
  tenantKey: string,
  displayName?: string
): Promise<void> {
  try {
    // Find the member document
    const memberId = `${email}_${tenantKey}`.replace(/[^a-zA-Z0-9]/g, '_');
    const memberRef = doc(db, 'members_hp', memberId);

    const memberDoc = await getDoc(memberRef);
    if (!memberDoc.exists()) {
      console.log('Member document not found, skipping name update');
      return;
    }

    const memberData = memberDoc.data() as MemberHP;

    // Only update if names are missing and displayName is available
    const hasFirstName = memberData.firstName && memberData.firstName.trim();
    const hasLastName = memberData.lastName && memberData.lastName.trim();

    if ((!hasFirstName || !hasLastName) && displayName) {
      const nameParts = displayName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const updateData: any = {};
      if (!hasFirstName && firstName) {
        updateData.firstName = firstName;
      }
      if (!hasLastName && lastName) {
        updateData.lastName = lastName;
      }

      if (Object.keys(updateData).length > 0) {
        await updateDoc(memberRef, updateData);
        console.log('Updated member names from auth profile:', updateData);
      }
    }
  } catch (error) {
    console.error('Error updating member names from auth profile:', error);
    // Don't throw - this is a non-critical operation
  }
}
