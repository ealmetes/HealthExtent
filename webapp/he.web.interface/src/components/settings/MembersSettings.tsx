import { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { getTenantMembers, inviteMember, getCurrentUserMember } from '@/services/members-service';
import type { MemberHP } from '@/services/members-service';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorAlert } from '@/components/shared/ErrorAlert';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending';
  joinedAt: string;
}

export function MembersSettings() {
  const { user, tenantKey } = useFirebaseAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMembers() {
      if (!tenantKey || !user?.id) return;

      try {
        setLoading(true);

        // Fetch current user's role
        const currentMember = await getCurrentUserMember(user.id, tenantKey);
        setCurrentUserRole(currentMember?.role || null);

        const membersData = await getTenantMembers(tenantKey);

        // Transform MemberHP to Member format for display
        const transformedMembers: Member[] = membersData.map((member) => {
          const fullName = [member.firstName, member.lastName]
            .filter(Boolean)
            .join(' ') || member.email?.split('@')[0] || 'Unknown';

          return {
            id: member.userId || member.email || '',
            name: fullName,
            email: member.email || '',
            role: member.role || 'Member',
            status: member.active ? 'active' : 'pending',
            joinedAt: member.invitedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          };
        });

        // Add current user if not in list
        if (!transformedMembers.find((m) => m.email === user?.email)) {
          transformedMembers.unshift({
            id: user?.id || '',
            name: user?.name || 'You',
            email: user?.email || '',
            role: currentMember?.role || 'Admin',
            status: 'active',
            joinedAt: new Date().toISOString(),
          });
        }

        setMembers(transformedMembers);
      } catch (err) {
        console.error('Error fetching members:', err);
        setError('Failed to load members');
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, [tenantKey, user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tenantKey) {
      setError('No tenant key found');
      return;
    }

    try {
      setInviting(true);
      setError(null);

      await inviteMember(inviteEmail, tenantKey, inviteRole);

      setSuccessMessage(`Invitation sent to ${inviteEmail}`);

      // Refresh members list
      const membersData = await getTenantMembers(tenantKey);
      const transformedMembers: Member[] = membersData.map((member) => {
        const fullName = [member.firstName, member.lastName]
          .filter(Boolean)
          .join(' ') || member.email?.split('@')[0] || 'Unknown';

        return {
          id: member.userId || member.email || '',
          name: fullName,
          email: member.email || '',
          role: member.role || 'Member',
          status: member.active ? 'active' : 'pending',
          joinedAt: member.invitedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });

      if (!transformedMembers.find((m) => m.email === user?.email)) {
        transformedMembers.unshift({
          id: user?.id || '',
          name: user?.name || 'You',
          email: user?.email || '',
          role: 'Admin',
          status: 'active',
          joinedAt: new Date().toISOString(),
        });
      }

      setMembers(transformedMembers);

      // Close modal and reset form
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Team Members</h2>
          <p className="text-sm text-[#888888] mt-1">
            Manage your team members and their access
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          disabled={currentUserRole?.toLowerCase() !== 'admin'}
          className="flex items-center gap-2 px-4 py-2 bg-[#6200EA] text-white rounded-lg hover:bg-[#7C4DFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Invite Member</span>
        </button>
      </div>

      {/* Members List */}
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                <th className="text-left px-6 py-4 text-sm font-medium text-[#888888]">Member</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#888888]">Role</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#888888]">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#888888]">Joined</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-[#888888]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-[#2A2A2A] last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#6200EA] to-[#3D5AFE] rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{member.name}</p>
                        <p className="text-xs text-[#888888]">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#3D5AFE]/10 text-[#3D5AFE] border border-[#3D5AFE]/20">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                      member.status === 'active'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {member.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#E0E0E0]">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#888888] hover:text-[#00E676] transition-colors p-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {members.length === 1 && (
          <div className="px-6 py-8 text-center border-t border-[#2A2A2A]">
            <svg className="mx-auto w-12 h-12 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-white">No team members yet</h3>
            <p className="mt-2 text-sm text-[#888888]">
              Invite team members to collaborate with you
            </p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#6200EA] text-white rounded-lg hover:bg-[#7C4DFF] transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Invite Your First Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-[#888888] hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label htmlFor="inviteEmail" className="block text-sm font-medium text-[#E0E0E0] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="inviteEmail"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder="colleague@example.com"
                  className="w-full bg-[#242832] border border-[#2A2A2A] rounded-lg px-4 py-2 text-[#E0E0E0] placeholder-[#666666] focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="inviteRole" className="block text-sm font-medium text-[#E0E0E0] mb-2">
                  Role
                </label>
                <select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-[#242832] border border-[#2A2A2A] rounded-lg px-4 py-2 text-[#E0E0E0] focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-colors"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-[#666666] mt-1">
                  Admins can manage settings and invite members
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  disabled={inviting}
                  className="flex-1 px-4 py-2 border border-[#2A2A2A] text-[#E0E0E0] rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-2 bg-[#6200EA] text-white rounded-lg hover:bg-[#7C4DFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {inviting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    'Send Invite'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
