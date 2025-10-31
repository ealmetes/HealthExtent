import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { DischargeSummaryFilters } from '@/types';
import { mockHospitals, mockProviders } from '@/mocks/mockData';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

interface DischargeSummaryFiltersProps {
  filters: DischargeSummaryFilters;
  onFiltersChange: (filters: DischargeSummaryFilters) => void;
}

export function DischargeSummaryFiltersComponent({
  filters,
  onFiltersChange,
}: DischargeSummaryFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [searchValue, setSearchValue] = useState("");
  const { data: hospitals } = useQuery({
    queryKey: ['hospitals'],
    queryFn: async () => {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockHospitals;
      }
      return apiClient.getHospitals();
    },
  });

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange(localFilters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localFilters, onFiltersChange]);

  const handleChange = (key: keyof DischargeSummaryFilters, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleClearFilters = () => {
    const clearedFilters: DischargeSummaryFilters = {
      page: 1,
      pageSize: 20,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    const clearedFilters: DischargeSummaryFilters = {
      ...localFilters,
      search: undefined,
      mrn: undefined,
      givenName: undefined,
      familyName: undefined,
      page: 1,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  // ---- NEW: robust search handler (MRN vs Name) ----
  const applySearch = () => {
    const raw = (searchValue ?? '').trim();

    // start from current filters, force page reset
    let next: DischargeSummaryFilters & Record<string, any> = {
      ...localFilters,
      page: 1,
      search: raw || undefined,
    };

    // clear all name/MRN fields first
    next.mrn = undefined;
    next.givenName = undefined;   // <-- use givenName
    next.familyName = undefined;  // <-- use familyName

    if (!raw) {
      setLocalFilters(next);
      return;
    }

    const isNumeric = /^\d+$/.test(raw);

    if (isNumeric) {
      // MRN search path
      next.mrn = raw;
    } else {
      // Name search path: support "Last, First" or "First Last ..."
      let givenName = '';
      let familyName = '';

      if (raw.includes(',')) {
        const [last, first] = raw.split(',').map(s => s.trim()).filter(Boolean);
        familyName = last || '';
        givenName = first || '';
      } else {
        const parts = raw.split(/\s+/).filter(Boolean);
        if (parts.length === 1) {
          // single token: treat as family name
          familyName = parts[0];
        } else {
          // multi token: First ... Last (collapse middle to last)
          givenName = parts[0];
          familyName = parts[parts.length - 1];
        }
      }

      // next.givenName = givenName || undefined;
      // next.familyName = familyName || undefined;
      next.familyName = familyName // "Diaz"
      next.search = raw;
    }
    setLocalFilters(next as DischargeSummaryFilters);
  };


  return (
    <div>
      <div className="bg-[#1E1E1E] mb-2 p-4 rounded-lg border border-[#2A2A2A] space-y-4" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Search</h3>

        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="w-full">
            <input
              type="text"
              id="search"
              className="block w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-[#E0E0E0] placeholder-[#666666] focus:border-gray-900 focus:ring-gray-900 sm:text-sm h-10 px-3"
              placeholder="Patient name (e.g., 'Martinez, Sofia' or 'Sofia Martinez') or MRN"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch();
              }}
            />
          </div>

          <button
            type="button"
            onClick={applySearch}
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
      <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#2A2A2A] space-y-4" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          <div>
            <label htmlFor="visitStatus" className="block text-sm font-medium text-[#888888] mb-1">
              Status
            </label>
            <select
              id="visitStatus"
              className="block w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-[#E0E0E0] focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10 px-3"
              value={localFilters.visitStatus || ''}
              onChange={(e) => handleChange('visitStatus', e.target.value)}
            >
              <option value="">All</option>
              <option value="Admitted">Admitted</option>
              <option value="Discharged">Discharged</option>
              <option value="Readmitted">Readmitted</option>
            </select>
          </div>

          <div>
            <label htmlFor="hospitalId" className="block text-sm font-medium text-[#888888] mb-1">
              Hospital
            </label>
            <select
              id="hospitalId"
              className="block w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-[#E0E0E0] focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10 px-3"
              value={localFilters.hospitalId || ''}
              onChange={(e) => handleChange('hospitalId', e.target.value)}
            >
              <option value="">All Hospitals</option>
              {hospitals?.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="assignedToProviderId" className="block text-sm font-medium text-[#888888] mb-1">
              Assigned To
            </label>
            <select
              id="assignedToProviderId"
              className="block w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-[#E0E0E0] focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10 px-3"
              value={localFilters.assignedToProviderId || ''}
              onChange={(e) => handleChange('assignedToProviderId', e.target.value)}
            >
              <option value="">All Providers</option>
              {providers?.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.firstName} {provider.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dischargeDateFrom" className="block text-sm font-medium text-[#888888] mb-1">
              Discharge From
            </label>
            <input
              type="date"
              id="dischargeDateFrom"
              className="block w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-[#E0E0E0] focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10 px-3"
              value={localFilters.dischargeDateFrom || ''}
              onChange={(e) => handleChange('dischargeDateFrom', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="dischargeDateTo" className="block text-sm font-medium text-[#888888] mb-1">
              Discharge To
            </label>
            <input
              type="date"
              id="dischargeDateTo"
              className="block w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-[#E0E0E0] focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10 px-3"
              value={localFilters.dischargeDateTo || ''}
              onChange={(e) => handleChange('dischargeDateTo', e.target.value)}
            />
          </div>


        </div>
      </div>
    </div>

  );
}
