import { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { getAccountByTenantKey, updateAccount } from '@/services/account-service';
import type { AccountHP } from '@/services/account-service';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorAlert } from '@/components/shared/ErrorAlert';

export function AccountSettings() {
  const { user, tenantKey } = useFirebaseAuth();
  const [account, setAccount] = useState<AccountHP | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    organization: '',
    organizationType: '',
    organizationPhone: '',
    address1: '',
    address2: '',
    city: '',
    county: '',
    state: '',
    postalCode: '',
  });

  useEffect(() => {
    async function fetchAccount() {
      if (!tenantKey) return;

      try {
        setLoading(true);
        const accountData = await getAccountByTenantKey(tenantKey);

        if (accountData) {
          setAccount(accountData);
          setFormData({
            organization: accountData.organization || '',
            organizationType: accountData.organizationType || '',
            organizationPhone: accountData.organizationPhone || '',
            address1: accountData.address1 || '',
            address2: accountData.address2 || '',
            city: accountData.city || '',
            county: accountData.county || '',
            state: accountData.state || '',
            postalCode: accountData.postalCode || '',
          });
        }
      } catch (err) {
        setError('Failed to load account information');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAccount();
  }, [tenantKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account?.userId) {
      setError('Account data not available');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Update using the account owner's userId, not the current user's id
      await updateAccount(account.userId, {
        ...formData,
        email: account.email,
        userId: account.userId,
      });

      setSuccessMessage('Account settings saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to save account settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">Account Settings</h2>
        <p className="text-sm text-[#888888] mt-1">
          Manage your organization information and account details
        </p>
      </div>

      {/* Error Alert */}
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-green-400">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization Information */}
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Organization Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="organization" className="block text-sm font-medium text-[#E0E0E0] mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                required
                className="w-full bg-[#242832] border border-[#2A2A2A] rounded-lg px-4 py-2 text-[#E0E0E0] focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="organizationType" className="block text-sm font-medium text-[#E0E0E0] mb-2">
                Organization Type *
              </label>
              <select
                id="organizationType"
                name="organizationType"
                value={formData.organizationType}
                onChange={handleChange}
                required
                className="w-full bg-[#242832] border border-[#2A2A2A] rounded-lg px-4 py-2 text-[#E0E0E0] focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-colors"
              >
                <option value="">Select type...</option>
                <option value="Hospital">Hospital</option>
                <option value="Clinic">Clinic</option>
                <option value="Practice">Practice</option>
                <option value="Healthcare Network">Healthcare Network</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="organizationPhone" className="block text-sm font-medium text-[#E0E0E0] mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="organizationPhone"
                name="organizationPhone"
                value={formData.organizationPhone}
                onChange={handleChange}
                required
                className="w-full bg-[#242832] border border-[#2A2A2A] rounded-lg px-4 py-2 text-[#E0E0E0] focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Address</h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="address1" className="block text-sm font-medium text-[#E0E0E0] mb-2">
                Address Line 1 *
              </label>
              <input
                type="text"
                id="address1"
                name="address1"
                value={formData.address1}
                onChange={handleChange}
                required
                className="w-full bg-[#242832] border border-[#2A2A2A] rounded-lg px-4 py-2 text-[#E0E0E0] focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="address2" className="block text-sm font-medium text-[#E0E0E0] mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                id="address2"
                name="address2"
                value={formData.address2}
                onChange={handleChange}
                className="w-full bg-[#242832] border border-[#2A2A2A] rounded-lg px-4 py-2 text-[#E0E0E0] focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-[#E0E0E0] mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#242832] border border-[#2A2A2A] rounded-lg px-4 py-2 text-[#E0E0E0] focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-[#E0E0E0] mb-2">
                  State *
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#242832] border border-[#2A2A2A] rounded-lg px-4 py-2 text-[#E0E0E0] focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-[#E0E0E0] mb-2">
                  Postal Code *
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#242832] border border-[#2A2A2A] rounded-lg px-4 py-2 text-[#E0E0E0] focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="county" className="block text-sm font-medium text-[#E0E0E0] mb-2">
                County *
              </label>
              <input
                type="text"
                id="county"
                name="county"
                value={formData.county}
                onChange={handleChange}
                required
                className="w-full bg-[#242832] border border-[#2A2A2A] rounded-lg px-4 py-2 text-[#E0E0E0] focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Account Information</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-[#242832] border border-[#2A2A2A] rounded-lg px-4 py-2 text-[#888888] cursor-not-allowed"
              />
              <p className="text-xs text-[#666666] mt-1">Email cannot be changed</p>
            </div>

            {account?.tenantKey && (
              <div>
                <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                  Tenant Key
                </label>
                <input
                  type="text"
                  value={account.tenantKey}
                  disabled
                  className="w-full bg-[#242832] border border-[#2A2A2A] rounded-lg px-4 py-2 text-[#888888] cursor-not-allowed font-mono text-sm"
                />
                <p className="text-xs text-[#666666] mt-1">Unique identifier for your organization</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-[#2A2A2A] text-[#E0E0E0] rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={true}
            className="px-6 py-2 bg-[#6200EA] text-white rounded-lg hover:bg-[#7C4DFF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
