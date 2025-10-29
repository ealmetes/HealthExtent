import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CareTransition, CareTransitionFilters } from '@/types';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { getTenantMembers } from '@/services/members-service';
import type { MemberHP } from '@/services/members-service';

type SortField = 'patient' | 'hospital' | 'discharge' | 'tcm' | 'outreach' | 'priority' | 'risk' | 'status' | 'attempts';
type SortDirection = 'asc' | 'desc';

export function CareTransitionsList() {
  const { tenantKey } = useFirebaseAuth();
  const [teamMembers, setTeamMembers] = useState<MemberHP[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CareTransitionFilters>({
    page: 1,
    pageSize: 25,
    status: undefined,
    priority: undefined,
    riskTier: undefined,
    search: undefined,
  });
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSearch = () => {
    setFilters({ ...filters, search: searchValue.trim() || undefined, page: 1 });
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setFilters({ ...filters, search: undefined, page: 1 });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['care-transitions', filters],
    queryFn: () => apiClient.getCareTransitions(filters),
  });

  // Fetch team members for assigned user lookup
  useEffect(() => {
    if (!tenantKey) return;

    getTenantMembers(tenantKey).then(members => {
      setTeamMembers(members);
    }).catch(error => {
      console.error('Error fetching team members:', error);
    });
  }, [tenantKey]);

  const getStatusColor = (status: CareTransition['status']) => {
    switch (status) {
      case 'Open':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'InProgress':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'Closed':
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: CareTransition['priority']) => {
    switch (priority) {
      case 'High':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'Medium':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'Low':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getRiskColor = (risk: CareTransition['riskTier']) => {
    switch (risk) {
      case 'High':
        return 'bg-red-500 text-white';
      case 'Medium':
        return 'bg-orange-500 text-white';
      case 'Low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getOutreachStatus = (ct: CareTransition) => {
    if (!ct.nextOutreachDate) return null;

    const nextDate = new Date(ct.nextOutreachDate);
    if (isPast(nextDate) && !isToday(nextDate)) {
      return { label: 'Overdue', color: 'bg-red-500 text-white' };
    }
    if (isToday(nextDate)) {
      return { label: 'Due Today', color: 'bg-amber-500 text-white' };
    }
    return null;
  };

  const getTCMStatus = (ct: CareTransition) => {
    if (!ct.tcmSchedule1) return null;

    const tcm1Date = new Date(ct.tcmSchedule1);
    if (ct.outreachDate) {
      const contactDate = new Date(ct.outreachDate);
      const dischargeDt = ct.encounter?.dischargeDateTime
        ? new Date(ct.encounter.dischargeDateTime)
        : null;

      if (dischargeDt) {
        const daysDiff = Math.floor(
          (contactDate.getTime() - dischargeDt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff <= 2) {
          return { label: 'TCM ✓', color: 'bg-green-500 text-white' };
        }
      }
    }

    if (isPast(tcm1Date) && !ct.outreachDate) {
      return { label: 'TCM Missed', color: 'bg-red-500 text-white' };
    }

    return null;
  };

  const getAssignedUserName = (ct: CareTransition): string | null => {
    // First check if API provided the name
    if (ct.assignedTo?.name) {
      return ct.assignedTo.name;
    }

    // If not, look up from team members
    if (ct.assignedToUserKey && teamMembers.length > 0) {
      // Try to find by memberDocId (document ID)
      let member = teamMembers.find(m => m.memberDocId === ct.assignedToUserKey);

      // If not found, try to find by userId
      if (!member) {
        member = teamMembers.find(m => m.userId === ct.assignedToUserKey);
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
    }

    // If still not found but has assignedToUserKey, show "Assigned" to indicate it's assigned
    if (ct.assignedToUserKey) {
      return 'Assigned';
    }

    return null;
  };

  const getUserInitials = (name: string): string => {
    // Special cases
    if (name === 'Assigned' || name === 'Unknown User') {
      return 'A';
    }

    // Check if it's an email address
    if (name.includes('@')) {
      const username = name.split('@')[0];
      // Remove special characters and numbers, take first 2 letters
      const letters = username.replace(/[^a-zA-Z]/g, '');
      return letters.slice(0, 2).toUpperCase() || 'U';
    }

    // For regular names, get first letter of first two words
    const nameParts = name.trim().split(' ').filter(n => n);
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    } else if (nameParts.length === 1) {
      return nameParts[0].slice(0, 2).toUpperCase();
    }

    return 'U';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = data?.data ? [...data.data].sort((a, b) => {
    if (!sortField) return 0;

    const direction = sortDirection === 'asc' ? 1 : -1;

    switch (sortField) {
      case 'patient':
        return direction * (a.patient?.name || '').localeCompare(b.patient?.name || '');
      case 'hospital':
        return direction * (a.hospital?.hospitalName || a.encounter?.location || '').localeCompare(b.hospital?.hospitalName || b.encounter?.location || '');
      case 'discharge':
        const aDate = a.encounter?.dischargeDateTime ? new Date(a.encounter.dischargeDateTime).getTime() : 0;
        const bDate = b.encounter?.dischargeDateTime ? new Date(b.encounter.dischargeDateTime).getTime() : 0;
        return direction * (aDate - bDate);
      case 'tcm':
        const aTcm = a.tcmSchedule1 ? new Date(a.tcmSchedule1).getTime() : 0;
        const bTcm = b.tcmSchedule1 ? new Date(b.tcmSchedule1).getTime() : 0;
        return direction * (aTcm - bTcm);
      case 'outreach':
        const aOutreach = a.nextOutreachDate ? new Date(a.nextOutreachDate).getTime() : 0;
        const bOutreach = b.nextOutreachDate ? new Date(b.nextOutreachDate).getTime() : 0;
        return direction * (aOutreach - bOutreach);
      case 'priority':
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        return direction * (priorityOrder[a.priority] - priorityOrder[b.priority]);
      case 'risk':
        const riskOrder = { High: 3, Medium: 2, Low: 1 };
        return direction * (riskOrder[a.riskTier] - riskOrder[b.riskTier]);
      case 'status':
        return direction * a.status.localeCompare(b.status);
      case 'attempts':
        return direction * (a.outreachAttempts - b.outreachAttempts);
      default:
        return 0;
    }
  }) : [];

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-[#9C27B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-[#9C27B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Care Transitions</h1>
          <p className="mt-1 text-sm text-[#888888]">
            Manage TCM outreach and follow-up coordination
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-[#9C27B0] hover:bg-[#7B1FA2] text-white rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {showFilters ? 'Hide Search & Filters' : 'Search & Filters'}
        </button>
      </div>

      {showFilters && (
        <>
          {/* Search */}
          <div className="bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] p-4 relative" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
            <button
              onClick={() => setShowFilters(false)}
              className="absolute top-4 right-4 text-[#888888] hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Search</h3>
        
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Patient name (e.g., 'Martinez, Sofia' or 'Sofia Martinez') or MRN"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  className="block w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-[#E0E0E0] placeholder-[#666666] focus:border-gray-900 focus:ring-gray-900 sm:text-sm h-10 px-3"
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="px-4 h-10 w-40 bg-green-800 rounded-md py-2 border border-[#2A2A2A] focus:border-indigo-500 text-sm font-medium text-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Search
              </button>
                    {filters.search && (
                <button
                  onClick={handleClearSearch}
            className="px-4 h-10 w-40 bg-purple-800 rounded-md py-2 border border-[#2A2A2A] focus:border-indigo-500 text-sm font-medium text-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] p-6" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-[#888888] mb-2">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value as any || undefined, page: 1 })
              }
              className="block w-full rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-[#E0E0E0] focus:border-[#9C27B0] focus:ring-[#9C27B0] sm:text-sm px-3 py-2"
            >
              <option value="">All</option>
              <option value="Open">Open</option>
              <option value="InProgress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#888888] mb-2">
              Priority
            </label>
            <select
              value={filters.priority || ''}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value as any || undefined, page: 1 })
              }
              className="block w-full rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-[#E0E0E0] focus:border-[#9C27B0] focus:ring-[#9C27B0] sm:text-sm px-3 py-2"
            >
              <option value="">All</option>
              <option value="Low">Low</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#888888] mb-2">
              Risk Tier
            </label>
            <select
              value={filters.riskTier || ''}
              onChange={(e) =>
                setFilters({ ...filters, riskTier: e.target.value as any || undefined, page: 1 })
              }
              className="block w-full rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-[#E0E0E0] focus:border-[#9C27B0] focus:ring-[#9C27B0] sm:text-sm px-3 py-2"
            >
              <option value="">All</option>
              <option value="Low">Low</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
      </div>
        </>
      )}

      {/* List */}
      <div className="bg-[#1E1E1E] rounded-lg border border-[#2A2A2A] overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
        {isLoading ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorAlert error={error} />
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2A2A2A] rounded-full mb-4">
              <svg className="w-8 h-8 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-white mb-1">No care transitions found</h4>
            <p className="text-sm text-[#888888]">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#2A2A2A]">
                <thead className="bg-[#2A2A2A]">
                  <tr>
                    <th onClick={() => handleSort('patient')} className="px-4 py-3 text-left text-xs font-medium text-[#E0E0E0] uppercase tracking-wider cursor-pointer hover:text-[#9C27B0] transition-colors">
                      <div className="flex items-center gap-2">
                        Patient
                        <SortIcon field="patient" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('hospital')} className="px-4 py-3 text-left text-xs font-medium text-[#E0E0E0] uppercase tracking-wider cursor-pointer hover:text-[#9C27B0] transition-colors">
                      <div className="flex items-center gap-2">
                        Hospital
                        <SortIcon field="hospital" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('discharge')} className="px-4 py-3 text-left text-xs font-medium text-[#E0E0E0] uppercase tracking-wider cursor-pointer hover:text-[#9C27B0] transition-colors">
                      <div className="flex items-center gap-2">
                        Discharge
                        <SortIcon field="discharge" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('tcm')} className="px-4 py-3 text-left text-xs font-medium text-[#E0E0E0] uppercase tracking-wider cursor-pointer hover:text-[#9C27B0] transition-colors">
                      <div className="flex items-center gap-2">
                        TCM Due
                        <SortIcon field="tcm" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#E0E0E0] uppercase tracking-wider">
                      Assigned
                    </th>
                    <th onClick={() => handleSort('priority')} className="px-4 py-3 text-left text-xs font-medium text-[#E0E0E0] uppercase tracking-wider cursor-pointer hover:text-[#9C27B0] transition-colors">
                      <div className="flex items-center gap-2">
                        Priority
                        <SortIcon field="priority" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('risk')} className="px-4 py-3 text-left text-xs font-medium text-[#E0E0E0] uppercase tracking-wider cursor-pointer hover:text-[#9C27B0] transition-colors">
                      <div className="flex items-center gap-2">
                        Risk
                        <SortIcon field="risk" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('status')} className="px-4 py-3 text-left text-xs font-medium text-[#E0E0E0] uppercase tracking-wider cursor-pointer hover:text-[#9C27B0] transition-colors">
                      <div className="flex items-center gap-2">
                        Status
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('attempts')} className="px-4 py-3 text-left text-xs font-medium text-[#E0E0E0] uppercase tracking-wider cursor-pointer hover:text-[#9C27B0] transition-colors">
                      <div className="flex items-center gap-2">
                        Attempts
                        <SortIcon field="attempts" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#1E1E1E] divide-y divide-[#2A2A2A]">
                  {sortedData.map((ct) => {
                    const outreachStatus = getOutreachStatus(ct);
                    const tcmStatus = getTCMStatus(ct);
                    const assignedUserName = getAssignedUserName(ct);

                    return (
                      <tr key={ct.careTransitionKey} className="hover:bg-[#2A2A2A] transition-colors cursor-pointer" onClick={() => window.location.href = `/app/care-transitions/${ct.careTransitionKey}`}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-[#9C27B0]">
                            {ct.patient?.name || ct.patient?.patientName || 'Unknown'}
                          </div>
                          <div className="text-xs text-[#888888]">
                            MRN: {ct.patient?.mrn || ct.patient?.patientIdExternal || 'N/A'}
                          </div>
                          {ct.patient?.phone && (
                            <div className="text-xs text-[#888888]">
                              {ct.patient.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-[#E0E0E0]">
                          <div>{ct.hospital?.hospitalName || ct.encounter?.location || 'N/A'}</div>
                          {ct.hospital?.city && ct.hospital?.state && (
                            <div className="text-xs text-[#888888]">
                              {ct.hospital.city}, {ct.hospital.state}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-[#E0E0E0]">
                          {ct.encounter?.dischargeDateTime
                            ? format(new Date(ct.encounter.dischargeDateTime), 'MM/dd/yyyy')
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {ct.tcmSchedule1 ? (
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <span className="text-sm text-[#E0E0E0]">
                                  {format(new Date(ct.tcmSchedule1), 'MM/dd/yyyy')}
                                </span>
                                {tcmStatus && (
                                  <span
                                    className={`px-2 py-1 text-xs font-semibold rounded ${tcmStatus.color}`}
                                  >
                                    {tcmStatus.label}
                                  </span>
                                )}
                              </div>

                            ) : (
                              <span className="text-sm text-[#888888]">N/A</span>
                            )}
                          </div>
                        </td>
                   <td className="px-4 py-4 whitespace-nowrap">
  <div className="flex items-center justify-center">
    {assignedUserName ? (
      <div className="flex items-center justify-center">
        <div className="w-8 h-8 bg-gradient-to-br from-[#6200EA] to-[#3D5AFE] rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-xs">
            {getUserInitials(assignedUserName)}
          </span>
        </div>
        {/* <span className="text-sm text-[#E0E0E0] ml-2">{assignedUserName}</span> */}
      </div>
    ) : (
      <span className="text-sm text-[#888888]"></span>
    )}
  </div>
</td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(ct.priority)}`}>
                            {ct.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(ct.riskTier)}`}>
                            {ct.riskTier}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ct.status)}`}>
                            {ct.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-[#E0E0E0]">
                          {ct.outreachAttempts}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="bg-[#1E1E1E] px-4 py-3 border-t border-[#2A2A2A] sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#E0E0E0]">
                    Showing <span className="font-medium text-white">{(data.page - 1) * data.pageSize + 1}</span> to{' '}
                    <span className="font-medium text-white">
                      {Math.min(data.page * data.pageSize, data.totalCount)}
                    </span>{' '}
                    of <span className="font-medium text-white">{data.totalCount}</span> results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                      disabled={!filters.page || filters.page === 1}
                      className="px-4 py-2 border border-[#2A2A2A] rounded-lg text-sm font-medium text-[#E0E0E0] bg-[#0A0A0A] hover:bg-[#2A2A2A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                      disabled={filters.page === data.totalPages}
                      className="px-4 py-2 border border-[#2A2A2A] rounded-lg text-sm font-medium text-[#E0E0E0] bg-[#0A0A0A] hover:bg-[#2A2A2A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
