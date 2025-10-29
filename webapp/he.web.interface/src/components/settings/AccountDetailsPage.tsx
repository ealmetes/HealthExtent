import { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { getAccountByTenantKey } from '@/services/account-service';
import { getTenantMembers } from '@/services/members-service';
import type { AccountHP } from '@/services/account-service';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorAlert } from '@/components/shared/ErrorAlert';

export function AccountDetailsPage() {
  const { tenantKey } = useFirebaseAuth();
  const [account, setAccount] = useState<AccountHP | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!tenantKey) return;

      try {
        setLoading(true);

        // Fetch account data and member count in parallel
        const [accountData, members] = await Promise.all([
          getAccountByTenantKey(tenantKey),
          getTenantMembers(tenantKey)
        ]);

        if (accountData) {
          setAccount(accountData);
        }

        setMemberCount(members.length);
      } catch (err) {
        setError('Failed to load account information');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [tenantKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="space-y-6">
        <ErrorAlert
          message="Account information not found"
          onClose={() => setError(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className='flex justify-between'>
          <div>
        <h2 className="text-2xl font-semibold text-white">General</h2>
        <p className="text-sm text-[#888888] mt-1">
          Overview of your account details and team
        </p>
      </div>
         <div>
                {/* <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Tenant Key</div> */}
                <div className="text-sm font-mono font-medium text-[#E0E0E0] bg-[#121212] px-3 py-2 rounded-lg border border-[#2A2A2A]">
                  {tenantKey}
                </div>
              </div>
      </div>
    

      {/* Error Alert */}
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      {/* Account Overview Card */}
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Account Overview</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-[#888888] mb-1">
              Organization
            </label>
            <p className="text-base text-[#E0E0E0] font-medium">
              {account.organization}
            </p>
          </div>

          {/* Organization Type */}
          <div>
            <label className="block text-sm font-medium text-[#888888] mb-1">
              Type
            </label>
            <p className="text-base text-[#E0E0E0]">
              {account.organizationType || 'Not specified'}
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#888888] mb-1">
              Email
            </label>
            <p className="text-base text-[#E0E0E0]">
              {account.email}
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-[#888888] mb-1">
              Phone
            </label>
            <p className="text-base text-[#E0E0E0]">
              {account.organizationPhone || 'Not specified'}
            </p>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#888888] mb-1">
              Address
            </label>
            <p className="text-base text-[#E0E0E0]">
              {account.address1}
              {account.address2 && <>, {account.address2}</>}
              <br />
              {account.city}, {account.state} {account.postalCode}
              {account.county && (
                <>
                  <br />
                  {account.county} County
                </>
              )}
            </p>
          </div>

          {/* Tenant Key */}
          {account.tenantKey && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#888888] mb-1">
                Tenant Key
              </label>
              <p className="text-sm text-[#888888] font-mono bg-[#242832] px-3 py-2 rounded border border-[#2A2A2A] inline-block">
                {account.tenantKey}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Team Statistics Card */}
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Team</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Members */}
          <div className="bg-[#242832] border border-[#2A2A2A] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00E676]/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#00E676]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[#888888]">Total Members</p>
                <p className="text-2xl font-semibold text-white">{memberCount}</p>
              </div>
            </div>
          </div>

          {/* Created Date */}
          {account.createdAt && (
            <div className="bg-[#242832] border border-[#2A2A2A] rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3D5AFE]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#3D5AFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[#888888]">Created</p>
                  <p className="text-base font-medium text-white">
                    {new Date(account.createdAt.seconds * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Updated Date */}
          {account.updatedAt && (
            <div className="bg-[#242832] border border-[#2A2A2A] rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#6200EA]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#6200EA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[#888888]">Last Updated</p>
                  <p className="text-base font-medium text-white">
                    {new Date(account.updatedAt.seconds * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
