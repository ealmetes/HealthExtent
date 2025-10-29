import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CareTransition, LogOutreachRequest, AssignCareTransitionRequest } from '@/types';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';
import { LogOutreachModal } from './LogOutreachModal';
import { CloseCareTransitionModal } from './CloseCareTransitionModal';
import { format, differenceInDays } from 'date-fns';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { getTenantMembers } from '@/services/members-service';
import type { MemberHP } from '@/services/members-service';

export function CareTransitionAction() {
  const { encounterKey } = useParams<{ encounterKey: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, tenantKey } = useFirebaseAuth();
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [teamMembers, setTeamMembers] = useState<MemberHP[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const encounterKeyNum = encounterKey ? parseInt(encounterKey) : 0;

  // Fetch care transition by encounter key
  const { data: careTransition, isLoading, error } = useQuery({
    queryKey: ['care-transition-by-encounter', encounterKeyNum],
    queryFn: () => apiClient.getCareTransitionByEncounter(encounterKeyNum),
    enabled: encounterKeyNum > 0,
  });

  // Log care transition data for debugging
  useEffect(() => {
    if (careTransition) {
      console.log('=== Care Transition Data ===');
      console.log('Full careTransition object:', careTransition);
      console.log('careTransitionKey:', careTransition.careTransitionKey);
      console.log('encounterKey:', careTransition.encounterKey);
    }
  }, [careTransition]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CareTransition>) => {
      if (!careTransition?.careTransitionKey) {
        throw new Error('CareTransition key is not available');
      }
      return apiClient.updateCareTransition(careTransition.careTransitionKey, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-transition-by-encounter', encounterKeyNum] });
      queryClient.invalidateQueries({ queryKey: ['care-transitions'] });
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: (priority: 'Low' | 'Medium' | 'High') => {
      if (!careTransition?.careTransitionKey) {
        throw new Error('CareTransition key is not available');
      }
      return apiClient.updatePriority(careTransition.careTransitionKey, priority);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-transition-by-encounter', encounterKeyNum] });
      queryClient.invalidateQueries({ queryKey: ['care-transitions'] });
    },
  });

  const updateRiskTierMutation = useMutation({
    mutationFn: (riskTier: 'Low' | 'Medium' | 'High') => {
      if (!careTransition?.careTransitionKey) {
        throw new Error('CareTransition key is not available');
      }
      return apiClient.updateRiskTier(careTransition.careTransitionKey, riskTier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-transition-by-encounter', encounterKeyNum] });
      queryClient.invalidateQueries({ queryKey: ['care-transitions'] });
    },
  });

  const logOutreachMutation = useMutation({
    mutationFn: (data: LogOutreachRequest) => {
      if (!careTransition?.careTransitionKey) {
        throw new Error('CareTransition key is not available');
      }
      return apiClient.logOutreach(careTransition.careTransitionKey, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-transition-by-encounter', encounterKeyNum] });
      queryClient.invalidateQueries({ queryKey: ['care-transitions'] });
      setIsOutreachModalOpen(false);
    },
  });

  const closeMutation = useMutation({
    mutationFn: (data: { closeReason: string; notes?: string }) => {
      if (!careTransition?.careTransitionKey) {
        throw new Error('CareTransition key is not available');
      }
      return apiClient.closeCareTransition(careTransition.careTransitionKey, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-transition-by-encounter', encounterKeyNum] });
      queryClient.invalidateQueries({ queryKey: ['care-transitions'] });
      setIsCloseModalOpen(false);
    },
  });

  const assignMutation = useMutation({
    mutationFn: (data: AssignCareTransitionRequest) => {
      console.log('assignMutation mutationFn called with data:', data);
      if (!careTransition?.careTransitionKey) {
        console.error('CareTransition key is not available');
        throw new Error('CareTransition key is not available');
      }
      console.log('Calling API with careTransitionKey:', careTransition.careTransitionKey);
      return apiClient.assignCareTransition(careTransition.careTransitionKey, data);
    },
    onSuccess: (data) => {
      console.log('Assignment successful:', data);
      queryClient.invalidateQueries({ queryKey: ['care-transition-by-encounter', encounterKeyNum] });
      queryClient.invalidateQueries({ queryKey: ['care-transitions'] });
      setIsAssignModalOpen(false);
      setSelectedUserId('');
    },
    onError: (error) => {
      console.error('Assignment failed:', error);
    },
  });

  useEffect(() => {
    if (careTransition?.notes) {
      setNotes(careTransition.notes);
    }
  }, [careTransition]);

  // Fetch team members for assignment
  useEffect(() => {
    async function fetchTeamMembers() {
      if (!tenantKey) return;

      try {
        const members = await getTenantMembers(tenantKey);
        // Filter only active members
        const activeMembers = members.filter(m => m.active);
        setTeamMembers(activeMembers);
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    }

    fetchTeamMembers();
  }, [tenantKey]);

  // Get assigned user name from team members if not provided by API
  const assignedUserName = careTransition?.assignedTo?.name ||
    (careTransition?.assignedToUserKey && teamMembers.length > 0
      ? (() => {
          // Try to find by userId first, then by memberDocId as fallback
          let member = teamMembers.find(m => m.userId === careTransition.assignedToUserKey);

          if (!member) {
            // Fallback: check if assignedToUserKey matches memberDocId
            member = teamMembers.find(m => m.memberDocId === careTransition.assignedToUserKey);
          }

          if (member) {
            // Try to construct full name from firstName and lastName
            const fullName = [member.firstName, member.lastName].filter(n => n && n.trim()).join(' ');
            if (fullName) {
              return fullName;
            }
            // Fallback to email
            return member.email || 'Unknown User';
          }
          return null;
        })()
      : null);

  // Helper function to calculate days until date and return badge info
  const getDaysUntilBadge = (dateString?: string) => {
    if (!dateString) return null;

    const targetDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const daysUntil = differenceInDays(targetDate, today);

    if (daysUntil < 0) {
      return {
        text: `${Math.abs(daysUntil)} days overdue`,
        bgColor: 'bg-red-500',
        textColor: 'text-white'
      };
    } else if (daysUntil === 0) {
      return {
        text: 'Due today',
        bgColor: 'bg-amber-500',
        textColor: 'text-white'
      };
    } else if (daysUntil <= 3) {
      return {
        text: `${daysUntil} days`,
        bgColor: 'bg-orange-500',
        textColor: 'text-white'
      };
    } else if (daysUntil <= 7) {
      return {
        text: `${daysUntil} days`,
        bgColor: 'bg-blue-500',
        textColor: 'text-white'
      };
    } else {
      return {
        text: `${daysUntil} days`,
        bgColor: 'bg-green-500',
        textColor: 'text-white'
      };
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'l' || e.key === 'L') {
        setIsOutreachModalOpen(true);
      } else if (e.key === 's' || e.key === 'S') {
        // Set status
        const newStatus = prompt('Enter status (Open/InProgress/Closed):');
        if (newStatus && ['Open', 'InProgress', 'Closed'].includes(newStatus)) {
          updateMutation.mutate({ status: newStatus as any });
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [careTransition]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorAlert error={error} />
      </div>
    );
  }

  if (!careTransition) {
    return (
      <div className="p-8 text-center">
        <div className="text-[#888888] mb-4">
          No care transition found for this encounter.
        </div>
        <button
          onClick={() => navigate('/app/care-transitions')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#888888] hover:text-[#9C27B0] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Care Transitions
        </button>
      </div>
    );
  }

  const handleUpdateNotes = () => {
    updateMutation.mutate({ notes });
  };

  const handleClose = () => {
    setIsCloseModalOpen(true);
  };

  const handleAssignToMe = () => {
    console.log('=== Assign to Me clicked ===');
    console.log('user:', user);
    console.log('user?.id:', user?.id);

    if (!user?.id) {
      console.error('User ID is not available');
      alert('Unable to assign: User information not available. Please try refreshing the page.');
      return;
    }

    console.log('Calling assignMutation with:', { assignedToUserKey: user.id });
    assignMutation.mutate({ assignedToUserKey: user.id });
  };

  const handleAssignToUser = () => {
    if (!selectedUserId) return;
    assignMutation.mutate({ assignedToUserKey: selectedUserId });
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app/care-transitions')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#888888] hover:text-[#9C27B0] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Care Transitions
        </button>
      </div>

      {/* Patient Header Card */}
      <div className="bg-gradient-to-br from-[#9C27B0] to-[#7B1FA2] rounded-lg overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
        <div className="px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {careTransition.patient?.patientName || careTransition.patient?.name || 'Unknown Patient'}
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                      Visit: {careTransition.visitNumber}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm ${
                      careTransition.status === 'Open' ? 'bg-yellow-500/30 text-yellow-100' :
                      careTransition.status === 'InProgress' ? 'bg-blue-500/30 text-blue-100' :
                      'bg-gray-500/30 text-gray-100'
                    }`}>
                      {careTransition.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                  <div className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">MRN</div>
                  <div className="text-lg font-semibold text-white">{careTransition.patient?.mrn || 'N/A'}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                  <div className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">Phone</div>
                  <div className="text-lg font-semibold text-white">{careTransition.patient?.phone || 'N/A'}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                  <div className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">Outreach Attempts</div>
                  <div className="text-lg font-semibold text-white">{careTransition.outreachAttempts || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Information Panel */}
      <div className="bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
        <div className="px-6 py-5 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#9C27B0]/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-[#9C27B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Patient Information</h3>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Name</div>
                <div className="text-sm font-medium text-[#E0E0E0]">
                  {careTransition.patient?.givenName} {careTransition.patient?.familyName}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Date of Birth</div>
                <div className="text-sm font-medium text-[#E0E0E0]">
                  {careTransition.patient?.dob
                    ? format(new Date(careTransition.patient.dob), 'MM/dd/yyyy')
                    : 'N/A'}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Phone</div>
                <div className="text-sm font-medium text-[#E0E0E0]">{careTransition.patient?.phone || 'N/A'}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">MRN</div>
                <div className="text-sm font-medium text-[#E0E0E0]">{careTransition.patient?.mrn || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discharge Panel */}
      <div className="bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
        <div className="px-6 py-5 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00E676]/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-[#00E676]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Discharge Information</h3>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Location</div>
                <div className="text-sm font-medium text-[#E0E0E0]">{careTransition.encounter?.location || 'N/A'}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Admit Date</div>
                <div className="text-sm font-medium text-[#E0E0E0]">
                  {careTransition.encounter?.admitDateTime
                    ? format(new Date(careTransition.encounter.admitDateTime), 'MM/dd/yyyy HH:mm')
                    : 'N/A'}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Discharge Date</div>
                <div className="text-sm font-medium text-[#E0E0E0]">
                  {careTransition.encounter?.dischargeDateTime
                    ? format(new Date(careTransition.encounter.dischargeDateTime), 'MM/dd/yyyy HH:mm')
                    : 'N/A'}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Visit Status</div>
                <div className="text-sm font-medium text-[#E0E0E0]">{careTransition.encounter?.visitStatus || 'N/A'}</div>
              </div>
            </div>
            <div className="md:col-span-2 flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Attending Doctor</div>
                <div className="text-sm font-medium text-[#E0E0E0]">{careTransition.encounter?.attendingDoctor || 'N/A'}</div>
              </div>
            </div>
            {careTransition.encounter?.notes && (
              <div className="md:col-span-2 flex items-start gap-3">
                <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Notes</div>
                  <div className="text-sm font-medium text-[#E0E0E0] whitespace-pre-wrap">{careTransition.encounter.notes}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TCM Schedules & Outreach Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedules Panel */}
        <div className="bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
          <div className="px-6 py-5 border-b border-[#2A2A2A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#3D5AFE]/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#3D5AFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">TCM Schedules</h3>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">TCM Schedule 1 (D+7)</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-[#E0E0E0]">
                    {careTransition.tcmSchedule1
                      ? format(new Date(careTransition.tcmSchedule1), 'MM/dd/yyyy HH:mm')
                      : 'Not set'}
                  </div>
                  {careTransition.tcmSchedule1 && getDaysUntilBadge(careTransition.tcmSchedule1) && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getDaysUntilBadge(careTransition.tcmSchedule1)?.bgColor} ${getDaysUntilBadge(careTransition.tcmSchedule1)?.textColor}`}>
                      {getDaysUntilBadge(careTransition.tcmSchedule1)?.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">TCM Schedule 2 (D+14)</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-[#E0E0E0]">
                    {careTransition.tcmSchedule2
                      ? format(new Date(careTransition.tcmSchedule2), 'MM/dd/yyyy HH:mm')
                      : 'Not set'}
                  </div>
                  {careTransition.tcmSchedule2 && getDaysUntilBadge(careTransition.tcmSchedule2) && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getDaysUntilBadge(careTransition.tcmSchedule2)?.bgColor} ${getDaysUntilBadge(careTransition.tcmSchedule2)?.textColor}`}>
                      {getDaysUntilBadge(careTransition.tcmSchedule2)?.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Outreach Date</div>
                <div className="text-sm font-medium text-[#E0E0E0]">
                  {careTransition.outreachDate
                    ? format(new Date(careTransition.outreachDate), 'MM/dd/yyyy HH:mm')
                    : 'Not contacted'}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Outreach Method</div>
                <div className="text-sm font-medium text-[#E0E0E0]">{careTransition.outreachMethod || 'N/A'}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Follow-up Appointment</div>
                <div className="text-sm font-medium text-[#E0E0E0]">
                  {careTransition.followUpApptDateTime
                    ? format(new Date(careTransition.followUpApptDateTime), 'MM/dd/yyyy HH:mm')
                    : 'Not scheduled'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Outreach Panel */}
        <div className="bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
          <div className="px-6 py-5 border-b border-[#2A2A2A]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#9C27B0]/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#9C27B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Outreach</h3>
              </div>
              <button
                onClick={() => setIsOutreachModalOpen(true)}
                className="px-4 py-2 bg-[#9C27B0] text-white rounded-lg hover:bg-[#7B1FA2] focus:outline-none focus:ring-2 focus:ring-[#9C27B0] focus:ring-offset-2 focus:ring-offset-[#1E1E1E] text-sm font-medium transition-colors"
              >
                Log Outreach (L)
              </button>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Last Outreach Date</div>
                <div className="text-sm font-medium text-[#E0E0E0]">
                  {careTransition.lastOutreachDate
                    ? format(new Date(careTransition.lastOutreachDate), 'MM/dd/yyyy HH:mm')
                    : 'None'}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Next Outreach Date</div>
                <div className="text-sm font-medium text-[#E0E0E0]">
                  {careTransition.nextOutreachDate
                    ? format(new Date(careTransition.nextOutreachDate), 'MM/dd/yyyy HH:mm')
                    : 'Not set'}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Attempts</div>
                <div className="text-sm font-medium text-[#E0E0E0]">{careTransition.outreachAttempts || 0}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Contact Outcome</div>
                <div className="text-sm font-medium text-[#E0E0E0]">{careTransition.contactOutcome || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Panel */}
      <div className="bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
        <div className="px-6 py-5 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF9800]/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-[#FF9800]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Care Transition Notes</h3>
          </div>
        </div>
        <div className="px-6 py-5">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            className="block w-full rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-[#E0E0E0] placeholder-[#666666] focus:border-[#9C27B0] focus:ring-[#9C27B0] text-sm"
            placeholder="Add notes about patient contact, follow-up plans, or other care transition details..."
          />
          {/* <div className="mt-4 flex justify-end">
            <button
              onClick={handleUpdateNotes}
              disabled={updateMutation.isPending}
              className="px-6 py-2 bg-[#9C27B0] text-white rounded-lg hover:bg-[#7B1FA2] focus:outline-none focus:ring-2 focus:ring-[#9C27B0] focus:ring-offset-2 focus:ring-offset-[#1E1E1E] disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Notes'}
            </button>
          </div> */}
        </div>
      </div>

      {/* Actions */}
      {careTransition.status !== 'Closed' && (
        <div className="bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
          <div className="px-6 py-5 border-b border-[#2A2A2A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F44336]/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#F44336]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Actions</h3>
            </div>
          </div>
          <div className="px-6 py-5 space-y-6">
            {/* Priority and Risk Tier Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


          
            </div>

            {/* Assignment Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-[#E0E0E0]">Assignment</h4>
                {assignedUserName && (
                  <span className="text-xs text-[#888888]">
                    (Assigned to {assignedUserName})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleAssignToMe}
                  disabled={assignMutation.isPending}
                  className="px-6 py-2 bg-[#00E676] text-black rounded-lg hover:bg-[#00C853] focus:outline-none focus:ring-2 focus:ring-[#00E676] focus:ring-offset-2 focus:ring-offset-[#1E1E1E] disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  {assignMutation.isPending ? 'Assigning...' : 'Assign to Me'}
                </button>
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  disabled={assignMutation.isPending}
                  className="px-6 py-2 bg-[#3D5AFE] text-white rounded-lg hover:bg-[#304FFE] focus:outline-none focus:ring-2 focus:ring-[#3D5AFE] focus:ring-offset-2 focus:ring-offset-[#1E1E1E] disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  Assign to Team Member
                </button>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={handleClose}
                disabled={closeMutation.isPending}
                className="px-6 py-2 bg-[#F44336] text-white rounded-lg hover:bg-[#D32F2F] focus:outline-none focus:ring-2 focus:ring-[#F44336] focus:ring-offset-2 focus:ring-offset-[#1E1E1E] disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {closeMutation.isPending ? 'Closing...' : 'Close Care Transition'}
              </button>

                  {/* Risk Tier Toggle */}
              <div className="flex items-center gap-2 justify-between">
                <div>
                  <div className="text-sm font-medium text-[#E0E0E0]">Risk Tier</div>
                  <div className="text-xs text-[#888888]">
                    {careTransition.riskTier === 'High' ? 'High' : 'Low'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newRiskTier = careTransition.riskTier === 'High' ? 'Low' : 'High';
                    updateRiskTierMutation.mutate(newRiskTier);
                  }}
                  disabled={updateRiskTierMutation.isPending}
                  className={`w-8 h-8 rounded-full cursor-pointer transition-all duration-300 active:scale-95 disabled:opacity-50 ${
                    careTransition.riskTier === 'High'
                      ? 'bg-[#F44336] shadow-lg shadow-[#F44336]/50'
                      : 'bg-[#505050] hover:bg-[#606060]'
                  }`}
                />
              </div>

              {/* Priority Toggle */}
              <div className="flex items-center gap-2 justify-between">
                <div>
                  <div className="text-sm font-medium text-[#E0E0E0]">Priority</div>
                  <div className="text-xs text-[#888888]">
                    {careTransition.priority === 'High' ? 'High' : 'Low'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newPriority = careTransition.priority === 'High' ? 'Low' : 'High';
                    updatePriorityMutation.mutate(newPriority);
                  }}
                  disabled={updatePriorityMutation.isPending}
                  className={`w-8 h-8 rounded-full cursor-pointer transition-all duration-300 active:scale-95 disabled:opacity-50 ${
                    careTransition.priority === 'High'
                            ? 'bg-[#FF9800] shadow-lg shadow-[#FF9800]/50'
                      : 'bg-[#505050] hover:bg-[#606060]'
                  }`}
                />
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="bg-[#0A0A0A]/50 border border-[#2A2A2A] rounded-lg p-6">
        <h3 className="text-sm font-semibold text-white mb-3">Keyboard Shortcuts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <kbd className="px-3 py-1.5 bg-[#1E1E1E] text-white rounded border border-[#2A2A2A] font-mono text-xs">L</kbd>
            <span className="text-[#888888]">Log Outreach</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-3 py-1.5 bg-[#1E1E1E] text-white rounded border border-[#2A2A2A] font-mono text-xs">S</kbd>
            <span className="text-[#888888]">Set Status</span>
          </div>
        </div>
      </div>

      {/* Log Outreach Modal */}
      <LogOutreachModal
        isOpen={isOutreachModalOpen}
        onClose={() => setIsOutreachModalOpen(false)}
        onSubmit={(data) => logOutreachMutation.mutate(data)}
        isPending={logOutreachMutation.isPending}
        currentUserId={user?.id}
      />

      {/* Close Care Transition Modal */}
      <CloseCareTransitionModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onSubmit={(data) => closeMutation.mutate(data)}
        isPending={closeMutation.isPending}
        currentUserId={user?.id}
      />

      {/* Assign Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Assign Care Transition</h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-[#888888] hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                  Select Team Member
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-[#242832] border border-[#2A2A2A] rounded-lg px-4 py-2 text-[#E0E0E0] focus:outline-none focus:border-[#3D5AFE] focus:ring-1 focus:ring-[#3D5AFE] transition-colors"
                >
                  <option value="">-- Select a team member --</option>
                  {teamMembers.map((member) => {
                    const fullName = [member.firstName, member.lastName]
                      .filter(Boolean)
                      .join(' ') || member.email || 'Unknown';
                    return (
                      <option key={member.userId} value={member.userId}>
                        {fullName} ({member.email})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-[#2A2A2A] text-[#E0E0E0] rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignToUser}
                  disabled={!selectedUserId || assignMutation.isPending}
                  className="flex-1 px-4 py-2 bg-[#3D5AFE] text-white rounded-lg hover:bg-[#304FFE] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {assignMutation.isPending ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
