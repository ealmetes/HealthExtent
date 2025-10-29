import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { getPendingInvitations } from '@/services/members-service';
import type { MemberHP } from '@/services/members-service';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, logout } = useFirebaseAuth();
  const [pendingInvitations, setPendingInvitations] = useState<MemberHP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkInvitations() {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const invites = await getPendingInvitations(user.email);
        setPendingInvitations(invites);
      } catch (error) {
        console.error('Error checking invitations:', error);
      } finally {
        setLoading(false);
      }
    }

    checkInvitations();
  }, [user?.email]);

  const handleCreateAccount = () => {
    navigate('/account-setup');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <LoadingSpinner />
      </div>
    );
  }

  // Check if user has pending invitations
  const hasInvitations = pendingInvitations.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#6200EA]/10 rounded-full mb-4">
            <svg className="w-10 h-10 text-[#6200EA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to HealthExtent Provider Portal
          </h1>
          <p className="text-[#888888]">
            {user?.email}
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-8">
          {hasInvitations ? (
            // User has been invited
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00E676]/10 rounded-full mb-4">
                <svg className="w-8 h-8 text-[#00E676]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-3">
                You've Been Invited!
              </h2>

              <p className="text-[#E0E0E0] mb-6">
                Your email has been invited to join {pendingInvitations.length === 1 ? 'an organization' : `${pendingInvitations.length} organizations`}.
              </p>

              {/* Invitation List */}
              <div className="bg-[#242832] border border-[#2A2A2A] rounded-lg p-6 mb-6 text-left">
                <h3 className="text-sm font-medium text-[#888888] mb-4">Pending Invitations</h3>
                <div className="space-y-3">
                  {pendingInvitations.map((invite, index) => (
                    <div key={index} className="flex items-center gap-3 pb-3 border-b border-[#2A2A2A] last:border-0 last:pb-0">
                      <div className="w-10 h-10 bg-[#3D5AFE]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[#3D5AFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#E0E0E0]">Organization Invite</p>
                        <p className="text-xs text-[#888888]">Role: {invite.role}</p>
                      </div>
                      <span className="px-2 py-1 bg-[#00E676]/10 text-[#00E676] text-xs rounded">Pending</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-[#FF9800]/10 border border-[#FF9800]/20 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-[#FF9800] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-[#FF9800] mb-1">Action Required</h4>
                    <p className="text-sm text-[#E0E0E0]">
                      Please contact your organization administrator to activate your invitation. Once activated, you'll be able to access the dashboard.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-[#888888] mb-6">
                After your admin activates your account, sign out and sign back in to access your organization's dashboard.
              </p>

              <button
                onClick={handleLogout}
                className="w-full px-6 py-3 bg-[#6200EA] text-white rounded-lg hover:bg-[#7C4DFF] transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          ) : (
            // User has no invitations - can create own organization
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3D5AFE]/10 rounded-full mb-4">
                <svg className="w-8 h-8 text-[#3D5AFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-3">
                Get Started
              </h2>

              <p className="text-[#E0E0E0] mb-6">
                Create your organization account to start managing patient care transitions, discharge summaries, and healthcare data.
              </p>

              {/* Features List */}
              <div className="bg-[#242832] border border-[#2A2A2A] rounded-lg p-6 mb-6 text-left">
                <h3 className="text-sm font-medium text-[#888888] mb-4">What you'll get</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00E676] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-[#E0E0E0]">Multi-tenant Organization Management</p>
                      <p className="text-xs text-[#888888]">Manage your healthcare organization and team members</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00E676] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-[#E0E0E0]">Care Transitions Management</p>
                      <p className="text-xs text-[#888888]">Track and manage patient care transitions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00E676] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-[#E0E0E0]">HL7 Integration</p>
                      <p className="text-xs text-[#888888]">Seamless healthcare data integration</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#00E676] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-[#E0E0E0]">Team Collaboration</p>
                      <p className="text-xs text-[#888888]">Invite and manage team members</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Information Box */}
              <div className="bg-[#3D5AFE]/10 border border-[#3D5AFE]/20 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-[#3D5AFE] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-[#3D5AFE] mb-1">Already part of an organization?</h4>
                    <p className="text-sm text-[#E0E0E0]">
                      If you're joining an existing organization, ask your administrator to send you an invitation. After receiving the invitation, sign out and sign back in to activate your membership.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCreateAccount}
                  className="w-full px-6 py-3 bg-[#6200EA] text-white rounded-lg hover:bg-[#7C4DFF] transition-colors font-medium"
                >
                  Create New Organization Account
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-6 py-3 border border-[#2A2A2A] text-[#E0E0E0] rounded-lg hover:bg-white/5 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-[#666666]">
            Need help? Contact support at{' '}
            <a href="mailto:support@healthextent.com" className="text-[#6200EA] hover:text-[#7C4DFF]">
              support@healthextent.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
