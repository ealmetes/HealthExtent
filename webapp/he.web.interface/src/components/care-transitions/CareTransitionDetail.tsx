import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CareTransition, LogOutreachRequest } from '@/types';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';
import { LogOutreachModal } from './LogOutreachModal';
import { format } from 'date-fns';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

export function CareTransitionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useFirebaseAuth();
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const careTransitionKey = id || '';

  const { data: careTransition, isLoading, error } = useQuery({
    queryKey: ['care-transition', careTransitionKey],
    queryFn: () => apiClient.getCareTransition(careTransitionKey),
    enabled: !!careTransitionKey,
  });

  // Redirect to encounter-based route for better design
  useEffect(() => {
    if (careTransition?.encounterKey) {
      navigate(`/app/care-transitions/encounter/${careTransition.encounterKey}`, { replace: true });
    }
  }, [careTransition, navigate]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CareTransition>) =>
      apiClient.updateCareTransition(careTransitionKey, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-transition', careTransitionKey] });
      queryClient.invalidateQueries({ queryKey: ['care-transitions'] });
    },
  });

  const logOutreachMutation = useMutation({
    mutationFn: (data: LogOutreachRequest) =>
      apiClient.logOutreach(careTransitionKey, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-transition', careTransitionKey] });
      queryClient.invalidateQueries({ queryKey: ['care-transitions'] });
      setIsOutreachModalOpen(false);
    },
  });

  const closeMutation = useMutation({
    mutationFn: (data: { closeReason: string; notes?: string }) =>
      apiClient.closeCareTransition(careTransitionKey, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-transition', careTransitionKey] });
      queryClient.invalidateQueries({ queryKey: ['care-transitions'] });
    },
  });

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
      } else if (e.key === 'a' || e.key === 'A') {
        // Assign to me - would need current user context
        alert('Assign to me functionality - requires user context');
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
  }, [careTransitionKey]);

  useEffect(() => {
    if (careTransition?.notes) {
      setNotes(careTransition.notes);
    }
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
      <div className="p-8 text-center text-gray-500">Care transition not found</div>
    );
  }

  const handleUpdateNotes = () => {
    updateMutation.mutate({ notes });
  };

  const handleClose = () => {
    const reason = prompt('Enter close reason:');
    if (reason) {
      closeMutation.mutate({ closeReason: reason, notes });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <button
              onClick={() => navigate('/app/care-transitions')}
              className="text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              ← Back to Care Transitions
            </button>
            <h1 className="text-2xl font-bold text-purple-900">
              {careTransition.patient?.name || 'Unknown Patient'}
            </h1>
            <p className="text-sm text-gray-500">
              MRN: {careTransition.patient?.mrn} | Visit: {careTransition.visitNumber}
            </p>
            {careTransition.patient?.phone && (
              <p className="text-sm text-gray-500">Phone: {careTransition.patient.phone}</p>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={careTransition.status}
              onChange={(e) => updateMutation.mutate({ status: e.target.value as any })}
              className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            >
              <option value="Open">Open</option>
              <option value="InProgress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-gray-500">Priority</span>
            <p className="text-lg font-semibold">{careTransition.priority}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Risk Tier</span>
            <p className="text-lg font-semibold">{careTransition.riskTier}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Outreach Attempts</span>
            <p className="text-lg font-semibold">{careTransition.outreachAttempts}</p>
          </div>
        </div>
      </div>

      {/* Discharge Panel */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Discharge Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Location</span>
            <p className="text-sm font-medium">{careTransition.encounter?.location || 'N/A'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Discharge Date</span>
            <p className="text-sm font-medium">
              {careTransition.encounter?.dischargeDateTime
                ? format(new Date(careTransition.encounter.dischargeDateTime), 'MM/dd/yyyy HH:mm')
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Schedules Panel */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">TCM Schedules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">TCM Schedule 1 (D+7)</span>
            <p className="text-sm font-medium">
              {careTransition.tcmSchedule1
                ? format(new Date(careTransition.tcmSchedule1), 'MM/dd/yyyy HH:mm')
                : 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">TCM Schedule 2 (D+15)</span>
            <p className="text-sm font-medium">
              {careTransition.tcmSchedule2
                ? format(new Date(careTransition.tcmSchedule2), 'MM/dd/yyyy HH:mm')
                : 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Outreach Date</span>
            <p className="text-sm font-medium">
              {careTransition.outreachDate
                ? format(new Date(careTransition.outreachDate), 'MM/dd/yyyy HH:mm')
                : 'Not contacted'}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Follow-up Appointment</span>
            <p className="text-sm font-medium">
              {careTransition.followUpApptDateTime
                ? format(new Date(careTransition.followUpApptDateTime), 'MM/dd/yyyy HH:mm')
                : 'Not scheduled'}
            </p>
          </div>
        </div>
      </div>

      {/* Outreach Panel */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Outreach</h2>
          <button
            onClick={() => setIsOutreachModalOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Log Outreach (L)
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Next Outreach Date</span>
            <p className="text-sm font-medium">
              {careTransition.nextOutreachDate
                ? format(new Date(careTransition.nextOutreachDate), 'MM/dd/yyyy HH:mm')
                : 'Not set'}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Attempts</span>
            <p className="text-sm font-medium">{careTransition.outreachAttempts}</p>
          </div>
        </div>
      </div>

      {/* Notes Panel */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
          placeholder="Add notes about this care transition..."
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleUpdateNotes}
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>

      {/* Actions */}
      {careTransition.status !== 'Closed' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              disabled={closeMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {closeMutation.isPending ? 'Closing...' : 'Close Care Transition'}
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Keyboard Shortcuts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-blue-800">
          <div><kbd className="px-2 py-1 bg-white rounded border border-blue-300">L</kbd> Log Outreach</div>
          <div><kbd className="px-2 py-1 bg-white rounded border border-blue-300">A</kbd> Assign to Me</div>
          <div><kbd className="px-2 py-1 bg-white rounded border border-blue-300">S</kbd> Set Status</div>
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
    </div>
  );
}
