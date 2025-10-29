import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';
import { formatDate } from '@/utils/date';

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => apiClient.getPatient(id!),
    enabled: !!id,
  });

  const { data: encounters, isLoading: encountersLoading } = useQuery({
    queryKey: ['patient-encounters', id],
    queryFn: () => apiClient.getPatientEncounters(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !patient) {
    return <ErrorAlert error={error || new Error('Patient not found')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#888888] hover:text-[#00E676] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to patients
        </button>
      </div>

      {/* Patient Header Card */}
      <div className="bg-gradient-to-br from-[#00E676] to-[#00C965] rounded-lg overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
        <div className="px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-black/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-[#0A0A0A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#0A0A0A]">
                    {patient.firstName} {patient.lastName}
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    {patient.gender && (
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-black/20 text-[#0A0A0A] backdrop-blur-sm">
                        {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : patient.gender}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-black/10 backdrop-blur-sm rounded-lg px-4 py-3">
                  <div className="text-xs font-medium text-[#0A0A0A]/70 uppercase tracking-wide mb-1">MRN</div>
                  <div className="text-lg font-semibold text-[#0A0A0A]">{patient.mrn}</div>
                </div>
                <div className="bg-black/10 backdrop-blur-sm rounded-lg px-4 py-3">
                  <div className="text-xs font-medium text-[#0A0A0A]/70 uppercase tracking-wide mb-1">Date of Birth</div>
                  <div className="text-lg font-semibold text-[#0A0A0A]">
                    {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'N/A'}
                  </div>
                </div>
                <div className="bg-black/10 backdrop-blur-sm rounded-lg px-4 py-3">
                  <div className="text-xs font-medium text-[#0A0A0A]/70 uppercase tracking-wide mb-1">Last Updated</div>
                  <div className="text-lg font-semibold text-[#0A0A0A]">
                    {patient.createdAt ? formatDate(patient.createdAt) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            {patient.phone && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone</div>
                  <div className="text-sm font-medium text-gray-900">{patient.phone}</div>
                </div>
              </div>
            )}

            {patient.email && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</div>
                  <div className="text-sm font-medium text-gray-900">{patient.email}</div>
                </div>
              </div>
            )}

            {patient.address && (patient.address.city || patient.address.state) && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Address</div>
                  <div className="text-sm text-gray-900">
                    {patient.address.street && <div className="font-medium">{patient.address.street}</div>}
                    {patient.address.city && patient.address.state && (
                      <div className="text-gray-600">
                        {patient.address.city}, {patient.address.state} {patient.address.zipCode}
                      </div>
                    )}
                    {patient.address.country && <div className="text-gray-600">{patient.address.country}</div>}
                  </div>
                </div>
              </div>
            )}

            {!patient.phone && !patient.email && !patient.address && (
              <div className="text-center py-4 text-sm text-gray-500">
                No contact information available
              </div>
            )}
          </div>
        </div>

        {/* Medical Record Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Medical Record Details</h3>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Patient ID (External)</div>
              <div className="text-sm font-medium text-gray-900">{patient.patientIdExternal || 'N/A'}</div>
            </div>

            {patient.assigningAuthority && (
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Assigning Authority</div>
                <div className="text-sm font-medium text-gray-900">{patient.assigningAuthority}</div>
              </div>
            )}

            {patient.tenantKey && (
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tenant Key</div>
                <div className="text-sm font-mono font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {patient.tenantKey}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Encounters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Encounters</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {encounters && encounters.length > 0
                    ? `${encounters.length} encounter${encounters.length !== 1 ? 's' : ''} found`
                    : 'No encounters found for this patient'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {encountersLoading ? (
          <div className="px-6 py-12">
            <LoadingSpinner />
          </div>
        ) : encounters && encounters.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {encounters.map((encounter, index) => (
              <Link
                key={encounter.id}
                to={`/discharge-summaries/${encounter.id}`}
                className="block px-6 py-5 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Encounter Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 font-semibold text-sm group-hover:bg-indigo-100 transition-colors">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {encounter.encounterNumber || 'N/A'}
                          </h4>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              encounter.status === 'Discharged'
                                ? 'bg-green-100 text-green-700'
                                : encounter.status === 'Admitted'
                                ? 'bg-blue-100 text-blue-700'
                                : encounter.status === 'Transferred'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {encounter.status}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                            {encounter.encounterType}
                          </span>
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* Encounter Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <div className="text-xs text-gray-500">Admitted</div>
                          <div className="font-medium text-gray-900">{formatDate(encounter.admissionDate)}</div>
                        </div>
                      </div>

                      {encounter.dischargeDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <div className="text-xs text-gray-500">Discharged</div>
                            <div className="font-medium text-gray-900">{formatDate(encounter.dischargeDate)}</div>
                          </div>
                        </div>
                      )}

                      {encounter.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div>
                            <div className="text-xs text-gray-500">Location</div>
                            <div className="font-medium text-gray-900 truncate">{encounter.location}</div>
                          </div>
                        </div>
                      )}

                      {encounter.attendingDoctor && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div>
                            <div className="text-xs text-gray-500">Attending</div>
                            <div className="font-medium text-gray-900 truncate">{encounter.attendingDoctor}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chief Complaint */}
                    {encounter.chiefComplaint && (
                      <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Chief Complaint</div>
                        <p className="text-sm text-gray-700 leading-relaxed">{encounter.chiefComplaint}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">No encounters found</h4>
            <p className="text-sm text-gray-500">This patient has no recorded encounters yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
