import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { getOrganizationNameByTenantKey } from '@/services/account-service';
import { Dropdown } from '@/components/shared/Dropdown';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

type AlertTab = 'live' | 'tcm1' | 'tcm2' | 'admitted';

export function Header() {
  const navigate = useNavigate();
  const { user, logout, tenantKey } = useFirebaseAuth();
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isReadmittedOpen, setIsReadmittedOpen] = useState(false);
  const [isAdmittedOpen, setIsAdmittedOpen] = useState(false);
  const [isDischargedOpen, setIsDischargedOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AlertTab>('live');
  const alertsRef = useRef<HTMLDivElement>(null);
  const readmittedRef = useRef<HTMLDivElement>(null);
  const admittedRef = useRef<HTMLDivElement>(null);
  const dischargedRef = useRef<HTMLDivElement>(null);

  // Fetch overdue TCM Schedule 1
  const { data: overdueTCM1 } = useQuery({
    queryKey: ['overdue-tcm-1'],
    queryFn: () => apiClient.getOverdueTCMSchedule1(),
    enabled: isAlertsOpen && activeTab === 'tcm1',
  });

  // Fetch overdue TCM Schedule 2
  const { data: overdueTCM2 } = useQuery({
    queryKey: ['overdue-tcm-2'],
    queryFn: () => apiClient.getOverdueTCMSchedule2(),
    enabled: isAlertsOpen && activeTab === 'tcm2',
  });

  // Fetch admitted encounters - always fetch to show count
  const { data: admittedEncounters } = useQuery({
    queryKey: ['admitted-encounters'],
    queryFn: () => apiClient.getAdmittedEncounters(),
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  // Fetch discharged encounters - always fetch to show count
  const { data: dischargedEncounters } = useQuery({
    queryKey: ['discharged-encounters'],
    queryFn: () => apiClient.getDischargedEncounters(),
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  // Fetch readmitted encounters - always fetch to show count
  const { data: readmittedEncounters } = useQuery({
    queryKey: ['readmitted-encounters'],
    queryFn: () => apiClient.getReadmittedEncounters(),
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  useEffect(() => {
    async function fetchOrganizationName() {
      if (tenantKey) {
        const orgName = await getOrganizationNameByTenantKey(tenantKey);
        setOrganizationName(orgName);
      }
    }
    fetchOrganizationName();
  }, [tenantKey]);

  // Close alerts popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) {
        setIsAlertsOpen(false);
      }
    }

    if (isAlertsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAlertsOpen]);

  // Close admitted popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (admittedRef.current && !admittedRef.current.contains(event.target as Node)) {
        setIsAdmittedOpen(false);
      }
    }

    if (isAdmittedOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAdmittedOpen]);

  // Close discharged popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dischargedRef.current && !dischargedRef.current.contains(event.target as Node)) {
        setIsDischargedOpen(false);
      }
    }

    if (isDischargedOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDischargedOpen]);

  // Close readmitted popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (readmittedRef.current && !readmittedRef.current.contains(event.target as Node)) {
        setIsReadmittedOpen(false);
      }
    }

    if (isReadmittedOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isReadmittedOpen]);

  return (
    <header className="bg-[#1E1E1E] border-b border-[#2A2A2A] sticky top-0 z-10 shadow-lg shadow-black/50">
      <div className="px-6 lg:px-8 flex justify-end">
        <div className="flex justify-between items-center h-16">
          {/* Right Side - User Info & Actions */}
          <div className="flex items-center gap-4">
            {/* Readmitted Encounters - ALERT */}
            <div className="relative" ref={readmittedRef}>
              <button
                onClick={() => setIsReadmittedOpen(!isReadmittedOpen)}
                className="relative p-2 text-[#888888] hover:text-red-500 hover:bg-white/5 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {readmittedEncounters && readmittedEncounters.length > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {readmittedEncounters.length}
                  </span>
                )}
              </button>

              {/* Readmitted Encounters Popup */}
              {isReadmittedOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-[#1E1E1E] border-2 border-red-500 rounded-lg shadow-2xl overflow-hidden z-50" style={{ boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)' }}>
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-red-500/30 bg-red-900/20 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className='text-red-400'>Readmitted Patients</span> {readmittedEncounters && `(${readmittedEncounters.length})`}
                      {readmittedEncounters && readmittedEncounters.length > 0 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                          ALERT
                        </span>
                      )}
                    </h3>
                    <button
                      onClick={() => setIsReadmittedOpen(false)}
                      className="text-[#888888] hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Readmitted Encounters List */}
                  <div className="max-h-96 overflow-y-auto">
                    {!readmittedEncounters || readmittedEncounters.length === 0 ? (
                      <div className="px-4 py-8 text-center text-[#888888]">
                        No readmitted encounters
                      </div>
                    ) : (
                      readmittedEncounters.map((encounter: any, index: number) => (
                        <div
                          key={index}
                          onClick={() => encounter.EncounterKey && navigate(`/app/discharge-summaries/${encounter.EncounterKey}`)}
                          className="px-4 py-3 border-b border-[#2A2A2A] hover:bg-red-900/10 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-1.5 animate-pulse"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {encounter.PatientName || 'Unknown Patient'}
                              </p>
                              <p className="text-xs text-[#888888] mt-1">
                                {encounter.Location || encounter.HospitalName || 'Unknown Hospital'}
                              </p>
                              <p className="text-xs text-red-400 mt-1 font-medium">
                                Readmitted: {encounter.AdmitDateTime ? new Date(encounter.AdmitDateTime).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-[#2A2A2A] bg-[#0A0A0A]">
                    <button
                      onClick={() => {
                        navigate('/app/discharge-summaries?visitStatus=Readmitted');
                        setIsReadmittedOpen(false);
                      }}
                      className="w-full text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                      View All Readmitted Patients →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admitted Encounters */}
            <div className="relative" ref={admittedRef}>
              <button
                onClick={() => setIsAdmittedOpen(!isAdmittedOpen)}
                className="relative p-2 text-[#888888] hover:text-[#3D5AFE] hover:bg-white/5 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                {admittedEncounters && admittedEncounters.length > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-[#FF0000] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {admittedEncounters.length}
                  </span>
                )}
              </button>

              {/* Admitted Encounters Popup */}
              {isAdmittedOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg shadow-2xl overflow-hidden z-50">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      <span className='text-[#3D5AFE]'>Admitted Encounters</span> {admittedEncounters && `(${admittedEncounters.length})`}
                    </h3>
                    <button
                      onClick={() => setIsAdmittedOpen(false)}
                      className="text-[#888888] hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Admitted Encounters List */}
                  <div className="max-h-96 overflow-y-auto">
                    {!admittedEncounters || admittedEncounters.length === 0 ? (
                      <div className="px-4 py-8 text-center text-[#888888]">
                        No admitted encounters
                      </div>
                    ) : (
                      admittedEncounters.map((encounter: any, index: number) => (
                        <div
                          key={index}
                          onClick={() => encounter.EncounterKey && navigate(`/app/discharge-summaries/${encounter.EncounterKey}`)}
                          className="px-4 py-3 border-b border-[#2A2A2A] hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-2 h-2 bg-[#3D5AFE] rounded-full mt-1.5"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {encounter.PatientName || 'Unknown Patient'}
                              </p>
                              <p className="text-xs text-[#888888] mt-1">
                                {encounter.Location || encounter.HospitalName || 'Unknown Hospital'}
                              </p>
                              <p className="text-xs text-[#666666] mt-1">
                                Admitted: {encounter.AdmitDateTime ? new Date(encounter.AdmitDateTime).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-[#2A2A2A] bg-[#0A0A0A]">
                    <button
                      onClick={() => {
                        navigate('/app/discharge-summaries');
                        setIsAdmittedOpen(false);
                      }}
                      className="w-full text-xs font-medium text-[#3D5AFE] hover:text-[#5E72E4] transition-colors"
                    >
                      View All Discharge Summaries →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Discharged Encounters */}
            <div className="relative" ref={dischargedRef}>
              <button
                onClick={() => setIsDischargedOpen(!isDischargedOpen)}
                className="relative p-2 text-[#888888] hover:text-[#00E676] hover:bg-white/5 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {dischargedEncounters && dischargedEncounters.length > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-[#FF0000] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {dischargedEncounters.length}
                  </span>
                )}
              </button>

              {/* Discharged Encounters Popup */}
              {isDischargedOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg shadow-2xl overflow-hidden z-50">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      <span className='text-[#00E676]'>Discharged Encounters</span> {dischargedEncounters && `(${dischargedEncounters.length})`}
                    </h3>
                    <button
                      onClick={() => setIsDischargedOpen(false)}
                      className="text-[#888888] hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Discharged Encounters List */}
                  <div className="max-h-96 overflow-y-auto">
                    {!dischargedEncounters || dischargedEncounters.length === 0 ? (
                      <div className="px-4 py-8 text-center text-[#888888]">
                        No discharged encounters
                      </div>
                    ) : (
                      dischargedEncounters.map((encounter: any, index: number) => (
                        <div
                          key={index}
                          onClick={() => encounter.EncounterKey && navigate(`/app/discharge-summaries/${encounter.EncounterKey}`)}
                          className="px-4 py-3 border-b border-[#2A2A2A] hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-2 h-2 bg-[#00E676] rounded-full mt-1.5"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {encounter.PatientName || 'Unknown Patient'}
                              </p>
                              <p className="text-xs text-[#888888] mt-1">
                                {encounter.Location || encounter.HospitalName || 'Unknown Hospital'}
                              </p>
                              <p className="text-xs text-[#666666] mt-1">
                                Discharged: {encounter.DischargeDateTime ? new Date(encounter.DischargeDateTime).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-[#2A2A2A] bg-[#0A0A0A]">
                    <button
                      onClick={() => {
                        navigate('/app/discharge-summaries');
                        setIsDischargedOpen(false);
                      }}
                      className="w-full text-xs font-medium text-[#00E676] hover:text-[#00C853] transition-colors"
                    >
                      View All Discharge Summaries →
                    </button>
                  </div>
                </div>
              )}
            </div>

             {/* Notifications */}
            <div className="relative" ref={alertsRef}>
              <button
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className="relative p-2 text-[#888888] hover:text-[#00E676] hover:bg-white/5 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#00E676] rounded-full"></span>
              </button>

              {/* Alerts Popup */}
              {isAlertsOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg shadow-2xl overflow-hidden z-50">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Alerts & Exceptions</h3>
                    <button
                      onClick={() => setIsAlertsOpen(false)}
                      className="text-[#888888] hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-[#2A2A2A] bg-[#0A0A0A]">
                    <button
                      onClick={() => setActiveTab('live')}
                      className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                        activeTab === 'live'
                          ? 'text-[#00E676] border-b-2 border-[#00E676]'
                          : 'text-[#888888] hover:text-white'
                      }`}
                    >
                      Live
                    </button>
                    <button
                      onClick={() => setActiveTab('tcm1')}
                      className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                        activeTab === 'tcm1'
                          ? 'text-[#00E676] border-b-2 border-[#00E676]'
                          : 'text-[#888888] hover:text-white'
                      }`}
                    >
                      Overdue TCM Schedule 1
                    </button>
                    <button
                      onClick={() => setActiveTab('tcm2')}
                      className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                        activeTab === 'tcm2'
                          ? 'text-[#00E676] border-b-2 border-[#00E676]'
                          : 'text-[#888888] hover:text-white'
                      }`}
                    >
                      Overdue TCM Schedule 2
                    </button>
                  </div>

                  {/* Alerts List */}
                  <div className="max-h-96 overflow-y-auto">
                    {activeTab === 'live' && (
                      <>
                        {/* Live sample alerts */}
                        <div className="px-4 py-3 border-b border-[#2A2A2A] hover:bg-white/5 transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">Missing Discharge Summary</p>
                              <p className="text-xs text-[#888888] mt-1">S. Martinez • North Broward</p>
                              <p className="text-xs text-[#666666] mt-1">2d ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="px-4 py-3 border-b border-[#2A2A2A] hover:bg-white/5 transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">Overdue Follow-Up</p>
                              <p className="text-xs text-[#888888] mt-1">J. Perez • Holy Cross</p>
                              <p className="text-xs text-[#666666] mt-1">1d ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="px-4 py-3 border-b border-[#2A2A2A] hover:bg-white/5 transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">High Readmission Risk</p>
                              <p className="text-xs text-[#888888] mt-1">K. Lee • West Pines</p>
                              <p className="text-xs text-[#666666] mt-1">6h ago</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === 'tcm1' && (
                      <>
                        {!overdueTCM1 || overdueTCM1.length === 0 ? (
                          <div className="px-4 py-8 text-center text-[#888888]">
                            No overdue TCM Schedule 1 alerts
                          </div>
                        ) : (
                          overdueTCM1.map((item: any, index: number) => (
                            <div
                              key={index}
                              onClick={() => item.EncounterKey && navigate(`/app/care-transitions/encounter/${item.EncounterKey}`)}
                              className="px-4 py-3 border-b border-[#2A2A2A] hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">
                                    {item.PatientName || 'Unknown Patient'}
                                  </p>
                                  <p className="text-xs text-[#888888] mt-1">
                                    {item.Location || 'Unknown Hospital'}
                                  </p>
                                  <p className="text-xs text-[#666666] mt-1">
                                    TCM Schedule 1: {item.TcmSchedule1 ? new Date(item.TcmSchedule1).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </>
                    )}

                    {activeTab === 'tcm2' && (
                      <>
                        {!overdueTCM2 || overdueTCM2.length === 0 ? (
                          <div className="px-4 py-8 text-center text-[#888888]">
                            No overdue TCM Schedule 2 alerts
                          </div>
                        ) : (
                          overdueTCM2.map((item: any, index: number) => (
                            <div
                              key={index}
                              onClick={() => item.EncounterKey && navigate(`/app/care-transitions/encounter/${item.EncounterKey}`)}
                              className="px-4 py-3 border-b border-[#2A2A2A] hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">
                                    {item.PatientName || 'Unknown Patient'}
                                  </p>
                                  <p className="text-xs text-[#888888] mt-1">
                                    {item.Location || 'Unknown Hospital'}
                                  </p>
                                  <p className="text-xs text-[#666666] mt-1">
                                    TCM Schedule 2: {item.TcmSchedule2 ? new Date(item.TcmSchedule2).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-[#2A2A2A] bg-[#0A0A0A]">
                    {/* <button className="w-full text-xs font-medium text-[#00E676] hover:text-[#00C853] transition-colors">
                      View All Alerts →
                    </button> */}
                  </div>
                </div>
              )}
            </div>

            {/* Organization Dropdown */}
            <Dropdown
              align="right"
              trigger={
                <button className="hidden lg:flex items-center gap-2 px-3 py-1.5 border border-[#2A2A2A] rounded-lg hover:border-[#00E676] transition-colors" style={{ backgroundColor: 'rgba(36, 40, 50, 1)' }}>
                  <svg className="w-4 h-4 text-[#3D5AFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-sm text-[#E0E0E0]">
                    {organizationName || 'Organization'}
                  </span>
                  <svg className="w-4 h-4 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              }
              items={[
                {
                  label: user?.email || '',
                  icon: (
                    <svg className="w-5 h-5 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ),
                  onClick: () => {},
                },
                {
                  label: 'Account Settings',
                  icon: (
                    <svg className="w-5 h-5 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                  onClick: () => navigate('/app/settings/account-details'),
                  divider: true,
                },
                {
                  label: 'Invite Members',
                  icon: (
                    <svg className="w-5 h-5 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  ),
                  onClick: () => navigate('/app/settings/members'),
                },
                {
                  label: 'Sign Out',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  ),
                  onClick: logout,
                  variant: 'danger' as const,
                  divider: true,
                },
              ]}
            />

            {/* Divider */}
            <div className="w-px h-8 bg-[#2A2A2A]"></div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-medium text-white">
                  {user?.name || 'Provider'}
                </p>
                <p className="text-xs text-[#888888]">{user?.email}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-[#6200EA] to-[#3D5AFE] rounded-full flex items-center justify-center ring-2 ring-transparent hover:ring-[#00E676] transition-all">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
