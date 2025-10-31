import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { getTenantMembers, type MemberHP } from '@/services/members-service';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';


export function DashboardHome() {
  const { tenantKey } = useFirebaseAuth();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<MemberHP[]>([]);

  // Fetch care transitions for metrics
  const { data: careTransitions, isLoading: isLoadingCT, error: ctError } = useQuery({
    queryKey: ['care-transitions-all'],
    queryFn: () => apiClient.getCareTransitions({ page: 1, pageSize: 1000 }),
  });

  // Fetch TCM metrics
  const { data: tcmMetrics } = useQuery({
    queryKey: ['tcm-metrics'],
    queryFn: () => apiClient.getTCMMetrics(),
  });

  // Fetch encounters for monthly trends
  const { data: encounters, isLoading: isLoadingEnc } = useQuery({
    queryKey: ['encounters-all'],
    queryFn: () => apiClient.getEncounters({ page: 1, pageSize: 1000 }),
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

  // Calculate monthly trends
  const monthlyTrends = useMemo(() => {
    if (!encounters?.data) return [];

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, 'MMM yyyy'),
        start: startOfMonth(date),
        end: endOfMonth(date),
        admissions: 0,
        discharges: 0,
      };
    });

    encounters.data.forEach((enc) => {
      last6Months.forEach((month) => {
        if (enc.admissionDate) {
          const admitDate = parseISO(enc.admissionDate);
          if (admitDate >= month.start && admitDate <= month.end) {
            month.admissions++;
          }
        }
        if (enc.dischargeDate) {
          const dischargeDate = parseISO(enc.dischargeDate);
          if (dischargeDate >= month.start && dischargeDate <= month.end) {
            month.discharges++;
          }
        }
      });
    });

    return last6Months;
  }, [encounters?.data]);

  // Calculate max value for chart scaling
  const maxValue = Math.max(
    ...monthlyTrends.map((m) => Math.max(m.admissions, m.discharges)),
    1
  );

  // Calculate executive summary metrics
  const executiveMetrics = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Active encounters (Status = 1 or not discharged)
    const activeEncounters = encounters?.data?.filter(
      (enc) => !enc.dischargeDate || enc.dischargeDate === null
    ).length || 0;

    // Patients admitted this month
    const admittedThisMonth = encounters?.data?.filter((enc) => {
      if (!enc.admissionDate) return false;
      const admitDate = parseISO(enc.admissionDate);
      return admitDate >= startOfMonth && admitDate <= endOfMonth;
    }).length || 0;

    // Patients discharged this month
    const dischargedThisMonth = encounters?.data?.filter((enc) => {
      if (!enc.dischargeDate) return false;
      const dischargeDate = parseISO(enc.dischargeDate);
      return dischargeDate >= startOfMonth && dischargeDate <= endOfMonth;
    }).length || 0;

    // Average length of stay
    const completedStays = encounters?.data?.filter(
      (enc) => enc.admissionDate && enc.dischargeDate
    ) || [];
    const avgLOS = completedStays.length > 0
      ? completedStays.reduce((sum, enc) => {
          const admit = parseISO(enc.admissionDate!);
          const discharge = parseISO(enc.dischargeDate!);
          return sum + Math.ceil((discharge.getTime() - admit.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / completedStays.length
      : 0;

    // Active care transitions
    const activeCareTransitions = careTransitions?.data?.filter(
      (ct) => ct.status === 'Open' || ct.status === 'InProgress'
    ).length || 0;

    // Pending follow-ups (future next outreach dates)
    const pendingFollowUps = careTransitions?.data?.filter((ct) => {
      if (!ct.nextOutreachDate) return false;
      return parseISO(ct.nextOutreachDate) > now;
    }).length || 0;

    // 30-day readmission rate - based on readmitted encounters in last 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Count encounters discharged in the last 30 days
    const dischargedLast30Days = encounters?.data?.filter((enc) => {
      if (!enc.dischargeDate) return false;
      const dischargeDate = parseISO(enc.dischargeDate);
      return dischargeDate >= thirtyDaysAgo && dischargeDate <= now;
    }).length || 0;

    // Count readmitted encounters in the last 30 days
    const readmittedLast30Days = encounters?.data?.filter((enc) => {
      const isReadmitted = enc.visitStatus?.toUpperCase() === 'READMITTED' || enc.visitStatus?.toUpperCase() === 'R';
      if (!isReadmitted || !enc.admissionDate) return false;
      const admitDate = parseISO(enc.admissionDate);
      return admitDate >= thirtyDaysAgo && admitDate <= now;
    }).length || 0;

    // Calculate readmission rate as percentage
    const readmissionRate = dischargedLast30Days > 0
      ? Math.round((readmittedLast30Days / dischargedLast30Days) * 100)
      : 0;

    return {
      activeEncounters,
      admittedThisMonth,
      dischargedThisMonth,
      avgLOS,
      activeCareTransitions,
      pendingFollowUps,
      readmissionRate,
    };
  }, [encounters?.data, careTransitions?.data]);

  // Calculate care transition metrics
  const ctMetrics = useMemo(() => {
    if (!careTransitions?.data) {
      return {
        total: 0,
        open: 0,
        inProgress: 0,
        closed: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        overdue: 0,
      };
    }

    const now = new Date();
    return {
      total: careTransitions.data.length,
      open: careTransitions.data.filter((ct) => ct.status === 'Open').length,
      inProgress: careTransitions.data.filter((ct) => ct.status === 'InProgress').length,
      closed: careTransitions.data.filter((ct) => ct.status === 'Closed').length,
      highRisk: careTransitions.data.filter((ct) => ct.riskTier === 'High').length,
      mediumRisk: careTransitions.data.filter((ct) => ct.riskTier === 'Medium').length,
      lowRisk: careTransitions.data.filter((ct) => ct.riskTier === 'Low').length,
      overdue: careTransitions.data.filter((ct) => {
        if (!ct.nextOutreachDate) return false;
        return parseISO(ct.nextOutreachDate) < now && ct.status !== 'Closed';
      }).length,
    };
  }, [careTransitions?.data]);

  // Helper function to get assigned user name
  const getAssignedUserName = (ct: any): string | null => {
    // First check if assignedTo.name is present
    if (ct.assignedTo?.name) {
      return ct.assignedTo.name;
    }

    // Then try to lookup by assignedToUserKey
    if (ct.assignedToUserKey && teamMembers.length > 0) {
      // First try to find by userId
      let member = teamMembers.find((m: MemberHP) => m.userId === ct.assignedToUserKey);

      // If not found, try to find by memberDocId
      if (!member) {
        member = teamMembers.find((m: MemberHP) => m.memberDocId === ct.assignedToUserKey);
      }

      if (member) {
        // Build full name from firstName and lastName
        const fullName = [member.firstName, member.lastName]
          .filter(n => n && n.trim())
          .join(' ');

        if (fullName) {
          return fullName;
        }

        // Fallback to email if name not available
        return member.email || 'Unknown User';
      }
    }

    return null;
  };

  // Calculate compliance percentages
  const tcmComplianceRate = tcmMetrics && tcmMetrics.tcmContactWithin2Days !== undefined && tcmMetrics.totalOpen !== undefined && tcmMetrics.totalInProgress !== undefined
    ? Math.round((tcmMetrics.tcmContactWithin2Days / Math.max(tcmMetrics.totalOpen + tcmMetrics.totalInProgress, 1)) * 100)
    : 0;

  const followUpRate = tcmMetrics && tcmMetrics.followUpWithin14Days !== undefined && tcmMetrics.totalOpen !== undefined && tcmMetrics.totalInProgress !== undefined
    ? Math.round((tcmMetrics.followUpWithin14Days / Math.max(tcmMetrics.totalOpen + tcmMetrics.totalInProgress, 1)) * 100)
    : 0;

  if (isLoadingCT || isLoadingEnc) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-[#888888]">
          Care Management Performance Overview
        </p>
      </div>

      {/* Executive Summary - Top Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Active Encounters */}
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-5" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-[#888888] truncate">Active Encounters</dt>
                <dd className="text-3xl font-semibold text-white">{executiveMetrics.activeEncounters}</dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Patients Admitted This Month */}
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-5" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-gradient-to-br from-green-500 to-green-600 p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-[#888888] truncate">Admitted (Month)</dt>
                <dd className="text-3xl font-semibold text-white">{executiveMetrics.admittedThisMonth}</dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Patients Discharged This Month */}
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-5" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-gradient-to-br from-purple-500 to-purple-600 p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-[#888888] truncate">Discharged (Month)</dt>
                <dd className="text-3xl font-semibold text-white">{executiveMetrics.dischargedThisMonth}</dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Average Length of Stay */}
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-5" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-[#888888] truncate">Avg Length of Stay</dt>
                <dd className="text-3xl font-semibold text-white">{executiveMetrics.avgLOS.toFixed(1)} <span className="text-sm text-[#888888]">days</span></dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Active Care Transitions */}
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-5" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-[#888888] truncate">Active Care Transitions</dt>
                <dd className="text-3xl font-semibold text-white">{executiveMetrics.activeCareTransitions}</dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Pending Follow-Ups */}
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-5" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-[#888888] truncate">Pending Follow-Ups</dt>
                <dd className="text-3xl font-semibold text-white">{executiveMetrics.pendingFollowUps}</dd>
              </dl>
            </div>
          </div>
        </div>

        {/* 30-Day Readmission Rate - Clickable */}
        <button
          onClick={() => navigate('/app/discharge-summaries?visitStatus=Readmitted')}
          className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-5 hover:bg-[#2A2A2A] transition-colors cursor-pointer text-left w-full"
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-gradient-to-br from-red-500 to-red-600 p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-[#888888] truncate">30-Day Readmission Rate</dt>
                <dd className="text-3xl font-semibold text-white">{executiveMetrics.readmissionRate}<span className="text-sm text-[#888888]">%</span></dd>
              </dl>
            </div>
          </div>
        </button>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Admissions & Discharges */}
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-6" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Monthly Trends</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-[#888888]">Admissions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-800"></div>
                <span className="text-[#888888]">Discharges</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {monthlyTrends.map((month, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#E0E0E0] font-medium">{month.month}</span>
                  <span className="text-[#888888]">
                    {month.admissions} / {month.discharges}
                  </span>
                </div>
                <div className="relative h-4 bg-[#0A0A0A] rounded-lg overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg transition-all"
                    style={{ width: `${(month.admissions / maxValue) * 100}%` }}
                  ></div>
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-800 to-purple-600 rounded-lg transition-all"
                    style={{ width: `${(month.discharges / maxValue) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TCM Compliance & Risk Distribution */}
        <div className="space-y-6">
          {/* TCM Compliance Metrics */}
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-6" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
            <h3 className="text-lg font-semibold text-white mb-4">TCM Compliance</h3>
            <div className="space-y-4">
              {/* Contact Within 2 Days */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#E0E0E0]">2-Day Contact Rate</span>
                  <span className="text-white font-semibold">{tcmComplianceRate}%</span>
                </div>
                <div className="relative h-3 bg-[#0A0A0A] rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                      tcmComplianceRate >= 90
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : tcmComplianceRate >= 70
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                    style={{ width: `${tcmComplianceRate}%` }}
                  ></div>
                </div>
              </div>

              {/* Follow-up Within 14 Days */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#E0E0E0]">14-Day Follow-up Rate</span>
                  <span className="text-white font-semibold">{followUpRate}%</span>
                </div>
                <div className="relative h-3 bg-[#0A0A0A] rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                      followUpRate >= 90
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : followUpRate >= 70
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                    style={{ width: `${followUpRate}%` }}
                  ></div>
                </div>
              </div>

              {/* Avg Outreach Attempts */}
              <div className="pt-2 border-t border-[#2A2A2A]">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#888888]">Avg Outreach Attempts</span>
                  <span className="text-lg font-semibold text-white">
                    {tcmMetrics?.avgOutreachAttempts?.toFixed(1) || '0.0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-6" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
            <h3 className="text-lg font-semibold text-white mb-4">Risk Distribution</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-[#E0E0E0]">High Risk</span>
                </div>
                <span className="text-lg font-semibold text-white">{ctMetrics.highRisk}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-[#E0E0E0]">Low Risk</span>
                </div>
                <span className="text-lg font-semibold text-white">{ctMetrics.lowRisk}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
              <div className="relative h-4 bg-[#0A0A0A] rounded-full overflow-hidden flex">
                {ctMetrics.total > 0 && (
                  <>
                    <div
                      className="bg-red-500"
                      style={{ width: `${(ctMetrics.highRisk / ctMetrics.total) * 100}%` }}
                    ></div>
                    <div
                      className="bg-yellow-500"
                      style={{ width: `${(ctMetrics.mediumRisk / ctMetrics.total) * 100}%` }}
                    ></div>
                    <div
                      className="bg-green-500"
                      style={{ width: `${(ctMetrics.lowRisk / ctMetrics.total) * 100}%` }}
                    ></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Care Transitions */}
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
        <div className="px-6 py-5 border-b border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Care Transitions</h2>
            <Link
              to="/app/care-transitions"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all →
            </Link>
          </div>
        </div>
        <div>
          {(() => {
            // Filter out closed care transitions
            const activeCareTransitions = careTransitions?.data?.filter(ct => ct.status !== 'Closed') || [];

            if (activeCareTransitions.length === 0) {
              return (
                <div className="p-8 text-center text-[#888888]">
                  No active care transitions found
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#2A2A2A]">
                  <thead className="bg-[#0A0A0A]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#888888] uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#888888] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#888888] uppercase tracking-wider">
                        Risk
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#888888] uppercase tracking-wider">
                        Next Outreach
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#888888] uppercase tracking-wider">
                        Assigned To
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#1E1E1E] divide-y divide-[#2A2A2A]">
                    {activeCareTransitions.slice(0, 10).map((ct) => {
                    const patientName = ct.patient?.name || ct.patient?.patientName || `Patient ${ct.patientKey}`;
                    const dob = ct.patient?.dob ? new Date(ct.patient.dob).toLocaleDateString() : 'N/A';

                    return (
                      <tr key={ct.careTransitionKey} 
                      onClick={() => navigate(`/app/care-transitions/${ct.careTransitionKey}`)}
                      className="hover:bg-[#252525] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/app/care-transitions/${ct.careTransitionKey}`}
                            className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                          >
                            {patientName}
                          </Link>
                          <div className="text-xs text-[#888888]">
                            DOB: {dob} 
                          </div>
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            ct.status === 'Open'
                              ? 'bg-blue-500/20 text-blue-400'
                              : ct.status === 'InProgress'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {ct.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            ct.riskTier === 'High'
                              ? 'bg-red-500/20 text-red-400'
                              : ct.riskTier === 'Medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {ct.riskTier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#E0E0E0]">
                        {ct.nextOutreachDate ? format(parseISO(ct.nextOutreachDate), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#E0E0E0]">
                        {getAssignedUserName(ct) || 'Unassigned'}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
