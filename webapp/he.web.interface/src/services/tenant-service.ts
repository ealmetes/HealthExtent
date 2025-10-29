import { getUserTenants, activateMember, getPendingInvitations } from './members-service';
import type { MemberHP } from './members-service';

export interface TenantOption {
  tenantKey: string;
  role: string;
  organizationName?: string;
}

// Get all tenants a user has access to
export async function getUserTenantOptions(email: string): Promise<TenantOption[]> {
  try {
    const memberships = await getUserTenants(email);

    const tenants: TenantOption[] = memberships
      .filter((m) => m.active || !m.userId) // Include active and pending
      .map((m) => ({
        tenantKey: m.tenantKey,
        role: m.role,
        organizationName: m.tenantKey, // TODO: Fetch actual org name from accounts_hp
      }));

    return tenants;
  } catch (error) {
    console.error('Error getting user tenant options:', error);
    return [];
  }
}

// Activate all pending invitations for a user after signup
export async function activatePendingInvitations(
  email: string,
  userId: string,
  firstName?: string,
  lastName?: string
): Promise<string[]> {
  try {
    const pendingInvitations = await getPendingInvitations(email);
    const activatedTenants: string[] = [];

    for (const invitation of pendingInvitations) {
      try {
        await activateMember(email, userId, invitation.tenantKey, firstName, lastName);
        activatedTenants.push(invitation.tenantKey);
      } catch (err) {
        console.error(`Failed to activate invitation for tenant ${invitation.tenantKey}:`, err);
      }
    }

    return activatedTenants;
  } catch (error) {
    console.error('Error activating pending invitations:', error);
    return [];
  }
}

// Check if user has multiple tenants
export async function hasMultipleTenants(email: string): Promise<boolean> {
  try {
    const tenants = await getUserTenantOptions(email);
    return tenants.length > 1;
  } catch (error) {
    console.error('Error checking multiple tenants:', error);
    return false;
  }
}
