import { useState } from 'react';
import { useDischargeSummaries } from '@/hooks/useDischargeSummaries';
import { DischargeSummaryFiltersComponent } from './DischargeSummaryFilters';
import { DischargeSummaryCard } from './DischargeSummaryCard';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';
import type { DischargeSummaryFilters } from '@/types';

export function DischargeSummariesList() {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DischargeSummaryFilters>({
    page: 1,
    pageSize: 20,
  });

  const { data, isLoading, error } = useDischargeSummaries(filters);

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert error={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Discharge Summaries</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-[#888888]">
            {data?.totalCount || 0} total results
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
      </div>

      {showFilters && (
        <div className="relative">
          <button
            onClick={() => setShowFilters(false)}
            className="absolute top-4 right-4 z-10 text-[#888888] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <DischargeSummaryFiltersComponent filters={filters} onFiltersChange={setFilters} />
        </div>
      )}

      {data?.data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#888888]">No discharge summaries found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {data?.data.map((summary) => (
              <DischargeSummaryCard key={summary.id} summary={summary} />
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#2A2A2A] bg-[#1E1E1E] px-4 py-3 sm:px-6 rounded-lg" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-4 py-2 text-sm font-medium text-[#E0E0E0] hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={filters.page === data.totalPages}
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
                      {(filters.page! - 1) * filters.pageSize! + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(filters.page! * filters.pageSize!, data.totalCount)}
                    </span>{' '}
                    of <span className="font-medium">{data.totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(filters.page! - 1)}
                      disabled={filters.page === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[#888888] ring-1 ring-inset ring-[#2A2A2A] hover:bg-[#252525] hover:text-[#E0E0E0] focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-[#2A2A2A] bg-[#0A0A0A] focus:outline-offset-0">
                      Page {filters.page} of {data.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(filters.page! + 1)}
                      disabled={filters.page === data.totalPages}
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
