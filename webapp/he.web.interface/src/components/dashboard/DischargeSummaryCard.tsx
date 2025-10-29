import { Link } from 'react-router-dom';
import { formatDate, formatRelativeTime } from '@/utils/date';
import { cn } from '@/utils/cn';
import type { DischargeSummary } from '@/types';

interface DischargeSummaryCardProps {
  summary: DischargeSummary;
}

const statusColors = {
  Pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  InReview: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  Reviewed: 'bg-green-500/20 text-green-400 border border-green-500/30',
  Escalated: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const priorityColors = {
  Low: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  High: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  Urgent: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export function DischargeSummaryCard({ summary }: DischargeSummaryCardProps) {
  return (
    <Link
      to={`/app/discharge-summaries/${summary.id}`}
      className="block bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] hover:bg-[#252525] transition-colors group"
      style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[#6200EA]/20 rounded-lg flex items-center justify-center border border-[#6200EA]/30">
                <svg
                  className="h-6 w-6 text-[#6200EA]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white group-hover:text-[#6200EA] transition-colors">
                  {summary.patient?.firstName} {summary.patient?.lastName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {summary.priority && (
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold',
                        priorityColors[summary.priority]
                      )}
                    >
                      {summary.priority}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-[#888888]">MRN:</span>
                <span className="font-medium text-[#E0E0E0]">{summary.patient?.mrn}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[#888888]">DOB:</span>
                <span className="font-medium text-[#E0E0E0]">{summary.patient?.dateOfBirth ? new Date(summary.patient.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[#888888]">Location:</span>
                <span className="font-medium text-[#E0E0E0]">{summary.encounter?.location || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-lg ${summary.visitStatus === 'Admitted'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : summary.visitStatus === 'Discharged'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
              {summary.visitStatus === 'Admitted' ? 'Admitted' : summary.visitStatus === 'Discharged' ? 'Discharged' : summary.visitStatus}
            </span>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-[#2A2A2A] grid grid-cols-2 gap-6 text-sm">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Admit Date</p>
              <p className="font-medium text-[#E0E0E0]">{formatDate(summary.admissionDate)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Discharge Date</p>
              <p className="font-medium text-[#E0E0E0]">{formatDate(summary.dischargeDate)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Location</p>
              <p className="font-medium text-[#E0E0E0]">{summary.encounter?.location || 'N/A'}</p>
            </div>
          </div>
          {summary.assignedToProvider && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <p className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Assigned To</p>
                <p className="font-medium text-[#E0E0E0]">
                  {summary.assignedToProvider.firstName} {summary.assignedToProvider.lastName}
                </p>
              </div>
            </div>
          )}
        </div>

        {summary.chiefComplaint && (
          <div className="mt-5 pt-5 border-t border-[#2A2A2A]">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Chief Complaint</p>
                <p className="text-sm text-[#E0E0E0]">{summary.chiefComplaint}</p>
              </div>
            </div>
          </div>
        )}

        {summary.diagnosisCodes && summary.diagnosisCodes.length > 0 && (
          <div className="mt-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#888888] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-2">Diagnosis Codes</p>
                <div className="flex flex-wrap gap-2">
                  {summary.diagnosisCodes.slice(0, 3).map((code, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[#3D5AFE]/20 text-[#3D5AFE] border border-[#3D5AFE]/30"
                    >
                      {code}
                    </span>
                  ))}
                  {summary.diagnosisCodes.length > 3 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[#888888]/20 text-[#888888] border border-[#888888]/30">
                      +{summary.diagnosisCodes.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
