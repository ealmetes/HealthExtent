import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ErrorAlert } from '../shared/ErrorAlert';

export function HospitalsList() {
  const queryClient = useQueryClient();

  const { data: hospitals, isLoading, error } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => apiClient.getHospitals(),
  });

  const { mutate: setHospitalStatus } = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.updateHospitalStatus(id, isActive),
    // Optimistic update

    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['hospitals'] });
      const previous = queryClient.getQueryData<any[]>(['hospitals']);

      queryClient.setQueryData<any[]>(['hospitals'], (old) =>
        (old ?? []).map((h) => (h.id === id ? { ...h, isActive } : h))
      );

      return { previous };
    },
    // Rollback on error
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['hospitals'], context.previous);
      }
    },
    // Refetch to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    },

  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Hospitals</h1>
        <div className="text-sm text-[#888888]">
          {hospitals?.length || 0} total hospitals
        </div>
      </div>

      {!hospitals || hospitals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#888888]">No hospitals found</p>
        </div>
      ) : (
        <div className="bg-[#1E1E1E] shadow-[0_4px_12px_rgba(0,0,0,0.5)] overflow-hidden sm:rounded-md border border-[#2A2A2A]">
          <ul className="divide-y divide-[#2A2A2A]">
            {hospitals.map((hospital) => {
              const groupName = `status-${hospital.id}`;
              const activeId = `active-${hospital.id}`;
              const inactiveId = `inactive-${hospital.id}`;

              return (
                <li key={hospital.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-[#2A2A2A] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-[#3D5AFE]/80">
                            {hospital.name}
                          </h3>
                          {hospital.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800/30 text-gray-400 border border-gray-700">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#888888]">
                          <span>
                            Code:{' '}
                            <span className="font-medium text-[#E0E0E0]">{hospital.code}</span>
                          </span>
                          {hospital.assigningAuthority && (
                            <span>
                              Authority:{' '}
                              <span className="font-medium text-[#E0E0E0]">
                                {hospital.assigningAuthority}
                              </span>
                            </span>
                          )}
                          {hospital.city && hospital.state && (
                            <span>
                              Location:{' '}
                              <span className="font-medium text-[#E0E0E0]">
                                {hospital.city}, {hospital.state}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Refactored Active input: radio group */}
                      <fieldset className="flex items-center space-x-4">
                        <legend className="sr-only">Status</legend>
                        {/* Refactored: Toggle switch for Active status */}
                        <div className="flex items-center space-x-3">
                          <label htmlFor={`toggle-${hospital.id}`} className="text-sm text-gray-300">
                            {hospital.isActive ? 'Active' : 'Inactive'}
                          </label>

                          <button
                            id={`toggle-${hospital.id}`}
                            type="button"
                            onClick={() =>
                              setHospitalStatus({ id: hospital.id, isActive: !hospital.isActive })
                            }
                            className={`
      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
      ${hospital.isActive ? 'bg-green-600' : 'bg-gray-500'}
      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
    `}
                          >
                            <span
                              className={`
        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
        ${hospital.isActive ? 'translate-x-6' : 'translate-x-1'}
      `}
                            />
                          </button>
                        </div>

                      </fieldset>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
