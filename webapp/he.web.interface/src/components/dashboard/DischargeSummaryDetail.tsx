import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  useDischargeSummary,
  useUpdateDischargeSummaryStatus,
  useUpdateDischargeSummaryPriority,
  useAssignDischargeSummary,
} from '@/hooks/useDischargeSummaries';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';
import { formatDate, formatDateTime } from '@/utils/date';
import { cn } from '@/utils/cn';
import type { DischargeSummary } from '@/types';
import { useState } from 'react';
import { mockProviders } from '@/mocks/mockData';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const statusColors = {
  Pending: 'bg-yellow-100 text-yellow-800',
  InReview: 'bg-blue-100 text-blue-800',
  Reviewed: 'bg-green-100 text-green-800',
  Escalated: 'bg-red-100 text-red-800',
};

const priorityColors = {
  Low: 'bg-gray-100 text-gray-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800',
  Urgent: 'bg-red-100 text-red-800',
};

export function DischargeSummaryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAssigning, setIsAssigning] = useState(false);

  const { data: summary, isLoading, error } = useDischargeSummary(id!);
  const updateStatus = useUpdateDischargeSummaryStatus();
  const updatePriority = useUpdateDischargeSummaryPriority();
  const assignSummary = useAssignDischargeSummary();

  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockProviders;
      }
      return apiClient.getProviders();
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !summary) {
    return <ErrorAlert error={error || new Error('Discharge summary not found')} />;
  }

  // Debug logging
  console.log('DischargeSummaryDetail - summary:', summary);
  console.log('DischargeSummaryDetail - visitStatus:', summary.visitStatus);

  // Helper function to check if patient is admitted or discharged
  const isAdmitted = (status?: string) => {
    if (!status) return false;
    const normalized = status.toUpperCase();
    return normalized === 'A' || normalized === 'ADMITTED';
  };

  const isDischarged = (status?: string) => {
    if (!status) return false;
    const normalized = status.toUpperCase();
    return normalized === 'F' || normalized === 'DISCHARGED';
  };

  const handleStatusChange = (status: DischargeSummary['reviewStatus']) => {
    updateStatus.mutate({ id: summary.id, status });
  };

  const handlePriorityChange = (priority: DischargeSummary['priority']) => {
    updatePriority.mutate({ id: summary.id, priority });
  };

  const handleAssign = (providerId: string) => {
    assignSummary.mutate(
      { id: summary.id, providerId },
      {
        onSuccess: () => setIsAssigning(false),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button and Action Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app/discharge-summaries')}
          className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to list
        </button>
        {summary.visitStatus === 'Discharged' && (
          <button
            onClick={() => navigate(`/app/care-transitions/encounter/${summary.encounterId}`)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-sm font-medium"
          >
            View Care Transition
          </button>
        )}
      </div>

      {/* Patient Header Card with Gradient */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-lg overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
        <div className="px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {summary.patient?.firstName} {summary.patient?.lastName}
                </h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <div className="text-indigo-200 text-xs">MRN</div>
                    <div className="text-white font-medium">{summary.patient?.mrn}</div>
                  </div>
                  <div>
                    <div className="text-indigo-200 text-xs">DOB</div>
                    <div className="text-white font-medium">
                      {summary.patient?.dateOfBirth ? new Date(summary.patient.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-indigo-200 text-xs">Sex</div>
                    <div className="text-white font-medium">{summary.patient.gender}</div>
                  </div>
                  <div>
                    <div className="text-indigo-200 text-xs">Location</div>
                    <div className="text-white font-medium">{summary.encounter?.location || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-4">
              <span
                className={cn(
                  'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold',
                  isAdmitted(summary.visitStatus)
                    ? 'bg-orange-500 text-white'
                    : isDischarged(summary.visitStatus)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-500 text-white'
                )}
              >
                {isAdmitted(summary.visitStatus)
                  ? 'Admitted'
                  : isDischarged(summary.visitStatus)
                    ? 'Discharged'
                    : summary.visitStatus || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Details Card */}
      <div className="bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
        <div className="px-6 py-5 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Patient Details</h3>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Admission Date</div>
                <div className="text-sm font-medium text-[#E0E0E0]">{formatDate(summary.admissionDate)}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Discharge Date</div>
                <div className="text-sm font-medium text-[#E0E0E0]">{formatDate(summary.dischargeDate)}</div>
              </div>
            </div>

            {summary.patient?.phone && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Phone</div>
                  <div className="text-sm font-medium text-[#E0E0E0]">{summary.patient.phone}</div>
                </div>
              </div>
            )}

            {summary.encounter?.primaryDoctor && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Primary Doctor</div>
                  <div className="text-sm font-medium text-[#E0E0E0]">{summary.encounter.primaryDoctor}</div>
                </div>
              </div>
            )}

            {summary.encounter?.attendingDoctor && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Attending Doctor</div>
                  <div className="text-sm font-medium text-[#E0E0E0]">{summary.encounter.attendingDoctor}</div>
                </div>
              </div>
            )}

            {summary.assignedToProvider && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Assigned To</div>
                  <div className="text-sm font-medium text-[#E0E0E0]">
                    {summary.assignedToProvider.firstName} {summary.assignedToProvider.lastName}
                  </div>
                </div>
              </div>
            )}

            {summary.reviewedAt && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Reviewed At</div>
                  <div className="text-sm font-medium text-[#E0E0E0]">{formatDateTime(summary.reviewedAt)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clinical Information Card */}
      <div className="bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
        <div className="px-6 py-5 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Clinical Information</h3>
          </div>
        </div>
        <div className="px-6 py-5 space-y-6">
          {summary.chiefComplaint && (
            <div>
              <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-2">Chief Complaint</div>
              <div className="text-sm text-[#E0E0E0] leading-relaxed">{summary.chiefComplaint}</div>
            </div>
          )}

          {summary.dischargeDiagnosis && (
            <div>
              <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-2">Discharge Diagnosis</div>
              <div className="text-sm text-[#E0E0E0] leading-relaxed">{summary.dischargeDiagnosis}</div>
            </div>
          )}

          {summary.diagnosisCodes && summary.diagnosisCodes.length > 0 && (
            <div>
              <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-2">Diagnosis Codes</div>
              <div className="flex flex-wrap gap-2">
                {summary.diagnosisCodes.map((code, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-[#2A2A2A] text-[#E0E0E0] border border-[#3A3A3A]"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}

          {summary.procedureCodes && summary.procedureCodes.length > 0 && (
            <div>
              <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-2">Procedure Codes</div>
              <div className="flex flex-wrap gap-2">
                {summary.procedureCodes.map((code, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}

          {summary.medications && summary.medications.length > 0 && (
            <div>
              <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-2">Medications</div>
              <ul className="space-y-2">
                {summary.medications.map((medication, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-[#E0E0E0]">
                    <span className="text-[#888888] mt-1">•</span>
                    <span>{medication}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.followUpInstructions && (
            <div>
              <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-2">Follow-up Instructions</div>
              <div className="text-sm text-[#E0E0E0] leading-relaxed whitespace-pre-wrap bg-[#0A0A0A] rounded-lg p-4 border border-[#2A2A2A]">
                {summary.followUpInstructions}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
