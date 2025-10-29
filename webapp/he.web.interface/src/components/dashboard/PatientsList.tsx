import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';

export function PatientsList() {
  const [searchValue, setSearchValue] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', appliedSearch, page],
    queryFn: () => apiClient.getPatients(appliedSearch, page, pageSize),
  });

  const handleSearch = () => {
    setAppliedSearch(searchValue.trim());
    setPage(1); // Reset to first page on new search
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setAppliedSearch('');
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Patients</h1>
        {data && (
          <div className="text-sm text-[#888888]">
            {data.totalCount || 0} total patients
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg p-4" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Search</h3>
          {appliedSearch && (
            <button
              onClick={handleClearSearch}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              Clear all
            </button>
          )}
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
            className="px-4 h-10 w-40 bg-purple-800 rounded-md py-2 border border-[#2A2A2A] focus:border-indigo-500 text-sm font-medium text-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Search
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorAlert error={error} />
      ) : !data?.data || data.data.length === 0 ? (
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg py-16 text-center" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2A2A2A] rounded-full mb-4">
            <svg className="w-8 h-8 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-white mb-1">No patients found</h4>
          <p className="text-sm text-[#888888]">Try adjusting your search criteria</p>
        </div>
      ) : (
        <>
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] overflow-hidden rounded-lg" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
            <ul className="divide-y divide-[#2A2A2A]">
              {data.data.map((patient) => (
                <li key={patient.id}>
                  <Link
                    to={`/app/patients/${patient.id}`}
                    className="block px-4 py-4 sm:px-6 hover:bg-[#2A2A2A] transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-[#00E676] group-hover:text-purple-800 transition-colors">
                            {patient.firstName} {patient.lastName}
                          </h3>
                          {patient.gender && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#3D5AFE]/20 text-[#3D5AFE] border border-[#3D5AFE]/30">
                              {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : patient.gender}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#888888]">
                          <span>
                            MRN: <span className="font-medium text-[#E0E0E0]">{patient.mrn}</span>
                          </span>
                          <span>
                            DOB:{' '}
                            <span className="font-medium text-[#E0E0E0]">
                              {patient.dateOfBirth
                                ? new Date(patient.dateOfBirth).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </span>
                          {patient.phone && (
                            <span>
                              Phone: <span className="font-medium text-[#E0E0E0]">{patient.phone}</span>
                            </span>
                          )}
                          {patient.address && patient.address.city && patient.address.state && (
                            <span>
                              Address:{' '}
                              <span className="font-medium text-[#E0E0E0]">
                                {patient.address.street && `${patient.address.street}, `}
                                {patient.address.city}, {patient.address.state}{' '}
                                {patient.address.zipCode}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-[#888888] group-hover:text-[#00E676] transition-colors flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#2A2A2A] bg-[#1E1E1E] px-4 py-3 sm:px-6 rounded-lg" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-4 py-2 text-sm font-medium text-[#E0E0E0] hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === data.totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-4 py-2 text-sm font-medium text-[#E0E0E0] hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[#E0E0E0]">
                    Showing{' '}
                    <span className="font-medium">
                      {(page - 1) * pageSize + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(page * pageSize, data.totalCount)}
                    </span>{' '}
                    of <span className="font-medium">{data.totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[#888888] ring-1 ring-inset ring-[#2A2A2A] hover:bg-[#252525] hover:text-[#E0E0E0] focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-[#2A2A2A] bg-[#0A0A0A] focus:outline-offset-0">
                      Page {page} of {data.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === data.totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-[#888888] ring-1 ring-inset ring-[#2A2A2A] hover:bg-[#252525] hover:text-[#E0E0E0] focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
