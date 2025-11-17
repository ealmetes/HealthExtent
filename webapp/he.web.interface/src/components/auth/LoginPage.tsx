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
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1a1a2e] to-[#16213e]">
      {/* Navigation */}
      <nav className="border-b border-[#2A2A2A] bg-[#0A0A0A]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">HealthExtent</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                to="/signup"
                className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/50"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Login Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-[#888888]">
              Sign in to access your dashboard
            </p>
          </div>

          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#E0E0E0] mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#E0E0E0] mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-400">{error.message || 'Authentication failed'}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-4 text-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="text-center pt-4">
                <p className="text-sm text-[#888888]">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Tenant Selection Modal */}
      {showTenantSelection && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-2">
              Select Organization
            </h3>
            <p className="text-sm text-[#888888] mb-6">
              You have access to multiple organizations. Please select which one you'd like to access.
            </p>

            <div className="space-y-3 mb-6">
              {tenants.map((tenant) => (
                <label
                  key={tenant.tenantKey}
                  className="flex items-center p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg cursor-pointer hover:border-indigo-500 transition-colors"
                >
                  <input
                    type="radio"
                    name="tenant"
                    value={tenant.tenantKey}
                    checked={selectedTenant === tenant.tenantKey}
                    onChange={(e) => setSelectedTenant(e.target.value)}
                    className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-[#0A0A0A] border-[#2A2A2A]"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      {tenant.organizationName || tenant.tenantKey}
                    </p>
                    <p className="text-sm text-[#888888]">{tenant.role}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowTenantSelection(false)}
                className="flex-1 px-4 py-3 border border-[#2A2A2A] text-[#E0E0E0] rounded-lg hover:bg-[#2A2A2A] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTenantSelection}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/50 font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
