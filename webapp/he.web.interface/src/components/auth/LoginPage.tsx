import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { getUserTenantOptions, activatePendingInvitations } from '@/services/tenant-service';
import type { TenantOption } from '@/services/tenant-service';
import { auth } from '@/config/firebase-config';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [showTenantSelection, setShowTenantSelection] = useState(false);
  const { login, isLoading, error } = useFirebaseAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);

      // After successful login, activate any pending invitations
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          // Extract firstName and lastName from displayName if available
          let firstName = '';
          let lastName = '';
          if (currentUser.displayName) {
            const nameParts = currentUser.displayName.trim().split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }

          await activatePendingInvitations(email, currentUser.uid, firstName, lastName);
        } catch (err) {
          console.error('Failed to activate pending invitations on login:', err);
        }
      }

      // Check if user has multiple tenants
      const userTenants = await getUserTenantOptions(email);

      if (userTenants.length > 1) {
        // Show tenant selection
        setTenants(userTenants);
        setSelectedTenant(userTenants[0].tenantKey);
        setShowTenantSelection(true);
      } else if (userTenants.length === 1) {
        // Single tenant, store it and navigate
        localStorage.setItem('selectedTenantKey', userTenants[0].tenantKey);
        navigate('/app/dashboard');
      } else {
        // No tenant memberships, navigate to dashboard
        navigate('/app/dashboard');
      }
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleTenantSelection = () => {
    if (selectedTenant) {
      localStorage.setItem('selectedTenantKey', selectedTenant);
      setShowTenantSelection(false);
      navigate('/app/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {import.meta.env.VITE_APP_NAME || 'HealthExtent Provider Portal'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to review discharge summaries
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error.message || 'Authentication failed'}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>

        {/* Tenant Selection Modal */}
        {showTenantSelection && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Select Organization
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                You have access to multiple organizations. Please select which one you'd like to access.
              </p>

              <div className="space-y-3">
                {tenants.map((tenant) => (
                  <label
                    key={tenant.tenantKey}
                    className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="tenant"
                      value={tenant.tenantKey}
                      checked={selectedTenant === tenant.tenantKey}
                      onChange={(e) => setSelectedTenant(e.target.value)}
                      className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {tenant.organizationName || tenant.tenantKey}
                      </p>
                      <p className="text-sm text-gray-500">{tenant.role}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowTenantSelection(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTenantSelection}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
