import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { DischargeSummaryFilters, DischargeSummary } from '@/types';
import { getMockDischargeSummaries, mockDischargeSummaries } from '@/mocks/mockData';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export function useDischargeSummaries(filters?: DischargeSummaryFilters) {
  return useQuery({
    queryKey: ['discharge-summaries', filters],
    queryFn: async () => {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return getMockDischargeSummaries(
          filters?.page,
          filters?.pageSize,
          {
            search: filters?.search,
            reviewStatus: filters?.reviewStatus,
            priority: filters?.priority,
            hospitalId: filters?.hospitalId,
          }
        );
      }
      // If there's a search term, first search for patients using the patient search API
      let matchingPatientIds: Set<string> | null = null;
      if (filters?.search) {
        try {
          // Use patient search API with a large page size to get all matching patients
          const patientSearchResults = await apiClient.getPatients(filters.search, 1, 1000);
          matchingPatientIds = new Set(patientSearchResults.data.map(p => p.id));

          // If no patients found, we'll have an empty set and filter will return no results
          if (matchingPatientIds.size === 0) {
            return {
              data: [],
              page: filters?.page || 1,
              pageSize: filters?.pageSize || 20,
              totalCount: 0,
              totalPages: 0,
            };
          }
        } catch (error) {
          console.error('Error searching patients:', error);
          // Fall back to client-side filtering if patient search fails
          matchingPatientIds = null;
        }
      }

      // Fetch encounters from HealthExtent.Api and map to discharge summaries
      const encountersResponse = await apiClient.getEncounters({
        page: filters?.page,
        pageSize: filters?.pageSize,
      });

      // Map encounters to discharge summaries format
      let dischargeSummaries = encountersResponse.data.map(encounter => ({
        id: encounter.id,
        encounterId: encounter.id,
        patientId: encounter.patientId,
        hospitalId: encounter.hospitalId,
        admissionDate: encounter.admissionDate,
        dischargeDate: encounter.dischargeDate || new Date().toISOString(),
        chiefComplaint: encounter.chiefComplaint,
        diagnosisCodes: encounter.diagnosisCodes,
        dischargeDiagnosis: encounter.diagnosisCodes?.join(', '),
        procedureCodes: encounter.procedureCodes,
        medications: [], // Would need to be added to Encounter model
        followUpInstructions: '', // Would need to be added to Encounter model
        assignedToProviderId: encounter.assignedToProviderId,
        reviewStatus: encounter.status === 'Discharged' ? 'Pending' : 'InReview',
        priority: 'Medium', // Default priority
        visitStatus: encounter.visitStatus, // Add visitStatus field
        createdAt: encounter.createdAt,
        updatedAt: encounter.updatedAt,
        patient: encounter.patient,
        hospital: encounter.hospital,
        encounter: encounter,
        assignedToProvider: encounter.assignedToProvider,
      }));

      // Apply patient search filter using the patient IDs from patient search API
      if (matchingPatientIds !== null) {
        dischargeSummaries = dischargeSummaries.filter(summary =>
          matchingPatientIds!.has(summary.patientId)
        );
      }

      if (filters?.reviewStatus) {
        dischargeSummaries = dischargeSummaries.filter(summary =>
          summary.reviewStatus === filters.reviewStatus
        );
      }

      if (filters?.priority) {
        dischargeSummaries = dischargeSummaries.filter(summary =>
          summary.priority === filters.priority
        );
      }

      if (filters?.hospitalId) {
        dischargeSummaries = dischargeSummaries.filter(summary =>
          summary.hospitalId === filters.hospitalId
        );
      }

      if (filters?.visitStatus) {
        dischargeSummaries = dischargeSummaries.filter(summary =>
          summary.visitStatus === filters.visitStatus
        );
      }

      if (filters?.assignedToProviderId) {
        dischargeSummaries = dischargeSummaries.filter(summary =>
          summary.assignedToProviderId === filters.assignedToProviderId
        );
      }

      if (filters?.dischargeDateFrom) {
        const fromDate = new Date(filters.dischargeDateFrom);
        dischargeSummaries = dischargeSummaries.filter(summary =>
          new Date(summary.dischargeDate) >= fromDate
        );
      }

      if (filters?.dischargeDateTo) {
        const toDate = new Date(filters.dischargeDateTo);
        dischargeSummaries = dischargeSummaries.filter(summary =>
          new Date(summary.dischargeDate) <= toDate
        );
      }

      const totalCount = dischargeSummaries.length;
      const pageSize = filters?.pageSize || 20;
      const page = filters?.page || 1;

      return {
        data: dischargeSummaries,
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    },
  });
}

export function useDischargeSummary(id: string) {
  return useQuery({
    queryKey: ['discharge-summary', id],
    queryFn: async () => {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const summary = mockDischargeSummaries.find(s => s.id === id);
        if (!summary) throw new Error('Discharge summary not found');
        return summary;
      }
      // Fetch encounter and map to discharge summary
      const encounter = await apiClient.getEncounter(id);

      return {
        id: encounter.id,
        encounterId: encounter.id,
        patientId: encounter.patientId,
        hospitalId: encounter.hospitalId,
        admissionDate: encounter.admissionDate,
        dischargeDate: encounter.dischargeDate || new Date().toISOString(),
        chiefComplaint: encounter.chiefComplaint,
        diagnosisCodes: encounter.diagnosisCodes,
        dischargeDiagnosis: encounter.diagnosisCodes?.join(', '),
        procedureCodes: encounter.procedureCodes,
        medications: [], // Would need to be added to Encounter model
        followUpInstructions: '', // Would need to be added to Encounter model
        assignedToProviderId: encounter.assignedToProviderId,
        reviewStatus: encounter.status === 'Discharged' ? 'Pending' : 'InReview',
        priority: 'Medium' as const, // Default priority
        visitStatus: encounter.visitStatus, // Add visitStatus field
        createdAt: encounter.createdAt,
        updatedAt: encounter.updatedAt,
        patient: encounter.patient,
        hospital: encounter.hospital,
        encounter: encounter,
        assignedToProvider: encounter.assignedToProvider,
      };
    },
    enabled: !!id,
  });
}

export function useAssignDischargeSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, providerId }: { id: string; providerId: string }) =>
      apiClient.assignDischargeSummary(id, providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discharge-summaries'] });
      queryClient.invalidateQueries({ queryKey: ['discharge-summary'] });
    },
  });
}

export function useUpdateDischargeSummaryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: DischargeSummary['reviewStatus'] }) =>
      apiClient.updateDischargeSummaryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discharge-summaries'] });
      queryClient.invalidateQueries({ queryKey: ['discharge-summary'] });
    },
  });
}

export function useUpdateDischargeSummaryPriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: DischargeSummary['priority'] }) =>
      apiClient.updateDischargeSummaryPriority(id, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discharge-summaries'] });
      queryClient.invalidateQueries({ queryKey: ['discharge-summary'] });
    },
  });
}
