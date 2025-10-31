import axios, { type AxiosError, type AxiosInstance } from 'axios';
import type {
  Encounter,
  EncounterFilters,
  DischargeSummary,
  DischargeSummaryFilters,
  Hospital,
  Patient,
  Provider,
  PaginatedResponse,
  ApiError,
  AuthToken,
  CareTransition,
  CareTransitionFilters,
  LogOutreachRequest,
  AssignCareTransitionRequest,
  CloseCareTransitionRequest,
  TCMMetrics,
} from '@/types';

// In production, use full API URL from environment variable
// In development, use empty string to work with Vite proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

console.log('=== API Client Configuration ===');
console.log('Environment:', import.meta.env.MODE);
console.log('API Base URL:', API_BASE_URL || 'Using Vite proxy (dev mode)');
console.log('================================');

class ApiClient {
  private client: AxiosInstance;
  private getAccessToken: (() => Promise<string | null>) | null = null;
  private getTenantKey: (() => string | null) | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token and tenant context
    this.client.interceptors.request.use(async (config) => {
      // Get access token from MSAL
      if (this.getAccessToken) {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      // Add tenant key to headers if available
      if (this.getTenantKey) {
        const tenantKey = this.getTenantKey();
        if (tenantKey) {
          config.headers['X-Tenant-Key'] = tenantKey;
        }
      }

      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Let MSAL handle authentication, just redirect to login
          window.location.href = '/login';
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  // Method to set the token getter function from MSAL
  setAuthTokenGetter(getter: () => Promise<string | null>) {
    this.getAccessToken = getter;
  }

  // Method to set the tenant key getter function from MSAL
  setTenantKeyGetter(getter: () => string | null) {
    this.getTenantKey = getter;
  }

  private handleError(error: AxiosError<ApiError>): ApiError {
    if (error.response?.data) {
      return error.response.data;
    }
    return {
      message: error.message || 'An unexpected error occurred',
      statusCode: error.response?.status || 500,
    };
  }

  // Authentication
  async login(email: string, password: string): Promise<AuthToken> {
    const response = await this.client.post<AuthToken>('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async getToken(): Promise<AuthToken> {
    const response = await this.client.post<AuthToken>('/api/auth/token');
    return response.data;
  }

  // Get JWT token from production API
  async getApiToken(username: string, tenantKey: string, tenantCode?: string): Promise<{
    token: string;
    expires: string;
    tenantKey: string;
    username: string;
  }> {
    const response = await this.client.post('/api/auth/token', {
      username,
      tenantKey,
      tenantCode,
    });
    return {
      token: response.data.Token || response.data.token,
      expires: response.data.Expires || response.data.expires,
      tenantKey: response.data.TenantKey || response.data.tenantKey,
      username: response.data.Username || response.data.username,
    };
  }

  // Set static token (for production API)
  setStaticToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Helper: Map API response to Encounter interface
  private mapApiToEncounter(apiData: any): Encounter {
    // Map patient data if available
    let patient = undefined;
    if (apiData.Patient) {
      patient = {
        id: apiData.Patient.PatientKey?.toString() || '',
        mrn: apiData.Patient.MRN || apiData.Patient.PatientIdExternal || '',
        firstName: apiData.Patient.GivenName || '',
        lastName: apiData.Patient.FamilyName || '',
        dateOfBirth: apiData.Patient.DOB || '',
        gender: apiData.Patient.Sex || '',
        phone: apiData.Patient.Phone || '',
        email: undefined,
        address: {
          street: apiData.Patient.AddressLine1 || '',
          city: apiData.Patient.City || '',
          state: apiData.Patient.State || '',
          zipCode: apiData.Patient.PostalCode || '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const mapped = {
      id: apiData.EncounterKey?.toString() || '',
      patientId: apiData.PatientKey?.toString() || '',
      hospitalId: apiData.HospitalKey?.toString() || '',
      encounterNumber: apiData.VisitNumber || '',
      admissionDate: apiData.AdmitDateTime || '',
      dischargeDate: apiData.DischargeDateTime || null,
      encounterType: this.mapPatientClass(apiData.PatientClass),
      status: this.mapVisitStatus(apiData.VisitStatus),
      visitStatus: apiData.VisitStatus || '',
      chiefComplaint: apiData.Notes || '',
      location: apiData.Location || '',
      attendingDoctor: apiData.AttendingDoctor || '',
      primaryDoctor: apiData.PrimaryDoctor || '',
      admittingDoctor: apiData.AdmittingDoctor || '',
      diagnosisCodes: [],
      procedureCodes: [],
      attendingProviderId: undefined,
      assignedToProviderId: undefined,
      hl7MessageId: apiData.AdmitMessageId || '',
      tcmSchedule1: apiData.TcmSchedule1 || undefined,
      tcmSchedule2: apiData.TcmSchedule2 || undefined,
      createdAt: apiData.LastUpdatedUtc || new Date().toISOString(),
      updatedAt: apiData.LastUpdatedUtc || new Date().toISOString(),
      patient: patient,
    };
    return mapped;
  }

  private mapPatientClass(patientClass?: string): Encounter['encounterType'] {
    switch (patientClass) {
      case 'I': return 'Inpatient';
      case 'E': return 'Emergency';
      case 'O': return 'Outpatient';
      default: return 'Observation';
    }
  }

  private mapVisitStatus(visitStatus?: string): Encounter['status'] {
    switch (visitStatus) {
      case 'A': return 'Admitted';
      case 'F': return 'Discharged';
      case 'T': return 'Transferred';
      case 'C': return 'Cancelled';
      default: return 'Admitted';
    }
  }

  // Encounters (Discharge Summaries source)
  async getEncounters(filters?: EncounterFilters): Promise<PaginatedResponse<Encounter>> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const skip = filters?.page ? (filters.page - 1) * (filters.pageSize || 20) : 0;
    const take = filters?.pageSize || 100;

    const response = await this.client.get<any[]>(
      `/api/Encounters/tenant/${tenantKey}`,
      {
        params: { skip, take },
      }
    );

    // Map API response to Encounter interface
    const data = response.data.map(apiData => this.mapApiToEncounter(apiData));

    const totalCount = data.length;
    const pageSize = filters?.pageSize || 20;
    const page = filters?.page || 1;

    return {
      data,
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  async getEncounter(id: string): Promise<Encounter> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const response = await this.client.get<any>(
      `/api/Encounters/${id}`,
      {
        params: { tenantKey },
      }
    );
    return this.mapApiToEncounter(response.data);
  }

  async getPatientEncounters(patientId: string): Promise<Encounter[]> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const response = await this.client.get<any[]>(
      `/api/Encounters/tenant/${tenantKey}`
    );

    // Filter encounters for this specific patient
    const patientEncounters = response.data
      .filter(e => e.PatientKey?.toString() === patientId)
      .map(apiData => this.mapApiToEncounter(apiData));

    // Sort by admission date (most recent first)
    return patientEncounters.sort((a, b) =>
      new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime()
    );
  }

  async assignEncounter(id: string, providerId: string): Promise<Encounter> {
    const response = await this.client.patch<Encounter>(`/api/encounters/${id}/assign`, {
      assignedToProviderId: providerId,
    });
    return response.data;
  }

  // Helper: Transform Encounter to DischargeSummary
  private transformEncounterToDischargeSummary(encounter: Encounter): DischargeSummary {
    const dischargeSummary = {
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
      medications: [],
      followUpInstructions: undefined,
      assignedToProviderId: encounter.assignedToProviderId,
      reviewStatus: 'Pending', // Default - can be enhanced based on encounter status
      priority: 'Medium', // Default priority
      visitStatus: encounter.visitStatus,
      createdAt: encounter.createdAt,
      updatedAt: encounter.updatedAt,
      reviewedAt: undefined,
      patient: encounter.patient,
      hospital: encounter.hospital,
      encounter: encounter,
      assignedToProvider: encounter.assignedToProvider,
    };
    return dischargeSummary;
  }

  // Discharge Summaries (powered by Encounters API)
  async getDischargeSummaries(
    filters?: DischargeSummaryFilters
  ): Promise<PaginatedResponse<DischargeSummary>> {
    // Get encounters from API
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const skip = filters?.page ? (filters.page - 1) * (filters.pageSize || 20) : 0;
    const take = filters?.pageSize || 100;

    const response = await this.client.get<any[]>(
      `/api/Encounters/tenant/${tenantKey}`,
      {
        params: { skip, take },
      }
    );

    // Map API response to Encounter interface
    const allEncounters = response.data.map(apiData => this.mapApiToEncounter(apiData));

    // Filter to exclude visitStatus "2" and optionally filter by specific visitStatus
    let encounters = allEncounters.filter(e => {
      // Always exclude visitStatus "2"
      if (e.visitStatus === '2') return false;

      // If a specific visitStatus filter is provided, apply it
      if (filters?.visitStatus) {
        const filterStatus = filters.visitStatus.toUpperCase();
        const encounterStatus = (e.visitStatus || '').toUpperCase();

        // Handle both abbreviated ('A', 'F') and full text ('ADMITTED', 'DISCHARGED') formats
        const isMatch =
          encounterStatus === filterStatus ||
          (filterStatus === 'A' && encounterStatus === 'ADMITTED') ||
          (filterStatus === 'F' && encounterStatus === 'DISCHARGED') ||
          (filterStatus === 'ADMITTED' && encounterStatus === 'A') ||
          (filterStatus === 'DISCHARGED' && encounterStatus === 'F');

        if (!isMatch) {
          return false;
        }
      }

      return true;
    });

    // Apply additional filters (search, hospitalId, etc.)
    if (filters?.search) {
      // const searchLower = filters.search.toLowerCase();
      // encounters = encounters.filter(e => {
      //   const patientName = `${e.patient?.firstName || ''} ${e.patient?.lastName || ''}`.toLowerCase();
      //   const mrn = (e.patient?.mrn || '').toLowerCase();
      //   return patientName.includes(searchLower) || mrn.includes(searchLower);
      // });
      // normalization helpers (put these above where you filter, or in a utils file)
// Normalizer (optional but helps with accents/spaces)
const normalize = (s?: string) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// Apply additional filters (mrn, givenName, familyName)
if (filters?.mrn || filters?.givenName || filters?.familyName) {
  const qMrn  = normalize(filters.mrn);
  const qGiven = normalize(filters.givenName);
  const qFamily = normalize(filters.familyName);

  encounters = encounters.filter(e => {
    const first = normalize(e.patient?.firstName);
    const last  = normalize(e.patient?.lastName);
    const mrn   = normalize(e.patient?.mrn);

    // If MRN provided, match by MRN
    if (qMrn && !mrn.includes(qMrn)) return false;

    // If givenName provided, require it to appear in first name
    if (qGiven && !first.includes(qGiven)) return false;

    // If familyName provided, require it to appear in last name
    if (qFamily && !last.includes(qFamily)) return false;

    return true;
  });
}


    }

    if (filters?.hospitalId) {
      encounters = encounters.filter(e => e.hospitalId === filters.hospitalId);
    }

    if (filters?.dischargeDateFrom) {
      encounters = encounters.filter(e =>
        e.dischargeDate && e.dischargeDate >= filters.dischargeDateFrom!
      );
    }

    if (filters?.dischargeDateTo) {
      encounters = encounters.filter(e =>
        e.dischargeDate && e.dischargeDate <= filters.dischargeDateTo!
      );
    }

    if (filters?.assignedToProviderId) {
      encounters = encounters.filter(e =>
        e.assignedToProviderId === filters.assignedToProviderId
      );
    }

    // Transform to discharge summaries
    const allData = encounters.map(e => this.transformEncounterToDischargeSummary(e));

    const totalCount = allData.length;
    const pageSize = filters?.pageSize || 20;
    const page = filters?.page || 1;

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = allData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  async getDischargeSummary(id: string): Promise<DischargeSummary> {
    const encounter = await this.getEncounter(id);
    return this.transformEncounterToDischargeSummary(encounter);
  }

  async assignDischargeSummary(id: string, providerId: string): Promise<DischargeSummary> {
    const encounter = await this.assignEncounter(id, providerId);
    return this.transformEncounterToDischargeSummary(encounter);
  }

  async updateDischargeSummaryStatus(
    id: string,
    status: DischargeSummary['reviewStatus']
  ): Promise<DischargeSummary> {
    // For now, just return the encounter as discharge summary
    // This can be enhanced when we add review status to database
    const encounter = await this.getEncounter(id);
    return this.transformEncounterToDischargeSummary(encounter);
  }

  async updateDischargeSummaryPriority(
    id: string,
    priority: DischargeSummary['priority']
  ): Promise<DischargeSummary> {
    // For now, just return the encounter as discharge summary
    // This can be enhanced when we add priority to database
    const encounter = await this.getEncounter(id);
    return this.transformEncounterToDischargeSummary(encounter);
  }

  // Patients
  async getPatients(search?: string, page: number = 1, pageSize: number = 100): Promise<PaginatedResponse<Patient>> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const skip = (page - 1) * pageSize;

    // Use wildcard '*' for empty search to get all patients
    const searchTerm = search && search.trim() ? search.trim() : '*';

    const response = await this.client.get<any>(
      `/api/Patients/search`,
      {
        params: {
          tenantKey,
          searchTerm,
          skip,
          take: pageSize,
        },
      }
    );

    // API returns an array directly, not wrapped in Data/TotalCount
    const apiData = Array.isArray(response.data) ? response.data : [];

    // Map API response to Patient interface
    const patients = apiData.map((item: any) => ({
      id: item.PatientKey?.toString() || '',
      mrn: item.MRN || item.PatientIdExternal || '',
      firstName: item.GivenName || '',
      lastName: item.FamilyName || '',
      dateOfBirth: item.DOB || '',
      gender: item.Sex || '',
      phone: item.Phone || '',
      email: undefined,
      address: {
        street: item.AddressLine1 || '',
        city: item.City || '',
        state: item.State || '',
        zipCode: item.PostalCode || '',
        country: item.Country || '',
      },
      patientIdExternal: item.PatientIdExternal || '',
      assigningAuthority: item.AssigningAuthority || '',
      tenantKey: item.TenantKey || '',
      createdAt: item.LastUpdatedUtc || '',
      updatedAt: item.LastUpdatedUtc || '',
    }));

    // Since API doesn't provide total count, estimate based on results
    // If we got a full page, there might be more
    const hasMore = patients.length === pageSize;
    const estimatedTotal = hasMore ? (page * pageSize) + 1 : (page - 1) * pageSize + patients.length;
    const totalPages = hasMore ? page + 1 : page;

    return {
      data: patients,
      totalCount: estimatedTotal,
      totalPages,
      currentPage: page,
      pageSize,
    };
  }

  async getPatient(id: string): Promise<Patient> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const response = await this.client.get<any[]>(
      `/api/Patients/tenant/${tenantKey}`
    );
    const apiData = response.data.find(p => p.PatientKey?.toString() === id);
    if (!apiData) throw new Error('Patient not found');

    return {
      id: apiData.PatientKey?.toString() || '',
      mrn: apiData.MRN || apiData.PatientIdExternal || '',
      firstName: apiData.GivenName || '',
      lastName: apiData.FamilyName || '',
      dateOfBirth: apiData.DOB || '',
      gender: apiData.Sex || '',
      phone: apiData.Phone || '',
      email: undefined,
      address: {
        street: apiData.AddressLine1 || '',
        city: apiData.City || '',
        state: apiData.State || '',
        zipCode: apiData.PostalCode || '',
        country: apiData.Country || '',
      },
      patientIdExternal: apiData.PatientIdExternal || '',
      assigningAuthority: apiData.AssigningAuthority || '',
      tenantKey: apiData.TenantKey || '',
      createdAt: apiData.LastUpdatedUtc || '',
      updatedAt: apiData.LastUpdatedUtc || '',
    };
  }

  // Hospitals
  async getHospitals(): Promise<Hospital[]> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';

    const response = await this.client.get<any[]>(
      `/api/Hospitals/tenant/${tenantKey}`
    );

    // Map API response to Hospital interface
    const hospitals = response.data.map(apiData => ({
      id: apiData.HospitalKey?.toString() || '',
      name: apiData.HospitalName || '',
      code: apiData.HospitalCode || '',
      assigningAuthority: apiData.AssigningAuthority || '',
      city: apiData.City || '',
      state: apiData.State || '',
      isActive: apiData.IsActive ?? true,
      tenantKey: apiData.TenantKey || '',
    }));

    return hospitals;
  }

  async getHospital(id: string): Promise<Hospital> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const response = await this.client.get<any[]>(
      `/api/Hospitals/tenant/${tenantKey}`
    );
    const apiData = response.data.find(h => h.HospitalKey?.toString() === id);
    if (!apiData) throw new Error('Hospital not found');

    return {
      id: apiData.HospitalKey?.toString() || '',
      name: apiData.HospitalName || '',
      code: apiData.HospitalCode || '',
      assigningAuthority: apiData.AssigningAuthority || '',
      city: apiData.City || '',
      state: apiData.State || '',
      isActive: apiData.IsActive ?? true,
      tenantKey: apiData.TenantKey || '',
    };
  }

  async updateHospitalStatus(id: string, isActive: boolean): Promise<void> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';

    await this.client.patch(
      `/api/Hospitals/tenant/${tenantKey}/${id}/status`,
      { IsActive: isActive }
    );
  }

  // Providers
  async getProviders(): Promise<Provider[]> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';

    const response = await this.client.get<any[]>(
      `/api/Providers/tenant/${tenantKey}`,
      {
        params: { skip: 0, take: 100 },
      }
    );

    // Map API response to Provider interface
    const providers = response.data.map(apiData => ({
      id: apiData.ProviderKey?.toString() || '',
      npi: apiData.NPI || '',
      firstName: apiData.GivenName || '',
      lastName: apiData.FamilyName || '',
      email: '', // Not provided by API
      phoneNumber: apiData.Phone || '',
      specialty: apiData.Specialty || '',
      isActive: apiData.Status === 1,
    }));

    return providers;
  }

  async getProvider(id: string): Promise<Provider> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const response = await this.client.get<any[]>(
      `/api/Providers/tenant/${tenantKey}`
    );
    const apiData = response.data.find(p => p.ProviderKey?.toString() === id);
    if (!apiData) throw new Error('Provider not found');

    return {
      id: apiData.ProviderKey?.toString() || '',
      npi: apiData.NPI || '',
      firstName: apiData.GivenName || '',
      lastName: apiData.FamilyName || '',
      email: '', // Not provided by API
      phoneNumber: apiData.Phone || '',
      specialty: apiData.Specialty || '',
      isActive: apiData.Status === 1,
    };
  }

  async searchProviders(query: string): Promise<Provider[]> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';

    const response = await this.client.get<any[]>(
      `/api/Providers/tenant/${tenantKey}`,
      {
        params: { q: query, skip: 0, take: 20 },
      }
    );

    // Map API response to Provider interface
    const providers = response.data.map(apiData => ({
      id: apiData.ProviderKey?.toString() || '',
      npi: apiData.NPI || '',
      firstName: apiData.GivenName || '',
      lastName: apiData.FamilyName || '',
      email: '', // Not provided by API
      phoneNumber: apiData.Phone || '',
      specialty: apiData.Specialty || '',
      isActive: apiData.Status === 1,
    }));

    return providers;
  }

  // Helper: Map API response to CareTransition interface
  private mapApiToCareTransition(apiData: any): CareTransition {
    return {
      careTransitionKey: apiData.CareTransitionKey?.toString() || '',
      encounterKey: apiData.EncounterKey || 0,
      patientKey: apiData.PatientKey,
      visitNumber: apiData.VisitNumber,
      status: apiData.Status,
      priority: apiData.Priority || 'Medium',
      riskTier: apiData.RiskTier || 'Medium',
      tcmSchedule1: apiData.TcmSchedule1,
      tcmSchedule2: apiData.TcmSchedule2,
      nextOutreachDate: apiData.NextOutreachDate,
      lastOutreachDate: apiData.LastOutreachDate,
      outreachAttempts: apiData.OutreachAttempts || 0,
      contactOutcome: apiData.ContactOutcome,
      lastUpdatedUtc: apiData.LastUpdatedUtc,
      assignedToUserKey: apiData.AssignedToUserKey?.toString() || undefined,
      careManagerUserKey: apiData.CareManagerUserKey?.toString() || undefined,
      assignedTeam: apiData.AssignedTeam,
      closeReason: apiData.CloseReason,
      closedAtUtc: apiData.ClosedUtc,
      notes: apiData.Notes,
      outreachDate: apiData.OutreachDate,
      outreachMethod: apiData.OutreachMethod,
      followUpApptDateTime: apiData.FollowUpApptDateTime,
      followUpProviderKey: apiData.FollowUpProviderKey,
      communicationSentDate: apiData.CommunicationSentDate,
      isActive: apiData.IsActive,
      createdUtc: apiData.CreatedUtc,
      patient: apiData.Patient ? {
        patientKey: apiData.Patient.PatientKey,
        patientIdExternal: apiData.Patient.PatientIdExternal,
        patientName: apiData.Patient.PatientName,
        name: apiData.Patient.PatientName || `${apiData.Patient.GivenName || ''} ${apiData.Patient.FamilyName || ''}`.trim() || 'Unknown',
        mrn: apiData.Patient.MRN || apiData.Patient.PatientIdExternal || '',
        familyName: apiData.Patient.FamilyName,
        givenName: apiData.Patient.GivenName,
        dob: apiData.Patient.DOB,
        sex: apiData.Patient.Sex,
        phone: apiData.Patient.Phone,
        addressLine1: apiData.Patient.AddressLine1,
        city: apiData.Patient.City,
        state: apiData.Patient.State,
        postalCode: apiData.Patient.PostalCode,
      } : apiData.PatientName ? {
        name: apiData.PatientName,
        patientName: apiData.PatientName,
        mrn: '',
        phone: undefined,
      } : undefined,
      hospital: apiData.Hospital ? {
        hospitalKey: apiData.Hospital.HospitalKey,
        hospitalCode: apiData.Hospital.HospitalCode,
        hospitalName: apiData.Hospital.HospitalName,
        city: apiData.Hospital.City,
        state: apiData.Hospital.State,
        isActive: apiData.Hospital.IsActive,
      } : undefined,
      encounter: apiData.Encounter ? {
        encounterKey: apiData.Encounter.EncounterKey,
        admitDateTime: apiData.Encounter.AdmitDateTime,
        dischargeDateTime: apiData.Encounter.DischargeDateTime,
        location: apiData.Encounter.Location,
        visitStatus: apiData.Encounter.VisitStatus,
        notes: apiData.Encounter.Notes,
        attendingDoctor: apiData.Encounter.AttendingDoctor,
        admittingDoctor: apiData.Encounter.AdmittingDoctor,
        primaryDoctor: apiData.Encounter.PrimaryDoctor,
      } : undefined,
      assignedTo: apiData.AssignedToUser ? {
        userKey: apiData.AssignedToUser.UserKey,
        name: apiData.AssignedToUser.Name || apiData.AssignedToUser.DisplayName || 'Unknown User',
      } : undefined,
      followUpProvider: apiData.FollowUpProvider ? {
        providerKey: apiData.FollowUpProvider.ProviderKey,
        displayName: apiData.FollowUpProvider.DisplayName || apiData.FollowUpProvider.Name || 'Unknown Provider',
      } : undefined,
    };
  }

  // Care Transitions
  async getCareTransitions(
    filters?: CareTransitionFilters
  ): Promise<PaginatedResponse<CareTransition>> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const skip = filters?.page ? (filters.page - 1) * (filters.pageSize || 25) : 0;
    const take = filters?.pageSize || 25;

    // If there's a search term, first search for patients using the patient search API
    let matchingPatientIds: Set<string> | null = null;
    if (filters?.search) {
      try {
        // Use patient search API with a large page size to get all matching patients
        const patientSearchResults = await this.getPatients(filters.search, 1, 1000);
        matchingPatientIds = new Set(patientSearchResults.data.map(p => p.id));

        // If no patients found, return empty results early
        if (matchingPatientIds.size === 0) {
          return {
            data: [],
            page: filters?.page || 1,
            pageSize: filters?.pageSize || 25,
            totalCount: 0,
            totalPages: 0,
          };
        }
      } catch (error) {
        console.error('Error searching patients:', error);
        // Fall back to no filtering if patient search fails
        matchingPatientIds = null;
      }
    }

    const endpoint = `/api/CareTransitions/tenant/${tenantKey}`;

    const response = await this.client.get<any[]>(endpoint, {
      params: { tenantKey, skip, take },
    });

    // Map API response to CareTransition interface
    let data = response.data.map(apiData => this.mapApiToCareTransition(apiData));

    // Apply patient search filter using the patient IDs from patient search API
    if (matchingPatientIds !== null) {
      data = data.filter(ct => matchingPatientIds!.has(ct.patientKey?.toString() || ''));
    }

    // Client-side filtering by status if specified
    if (filters?.status) {
      data = data.filter(ct => ct.status === filters.status);
    }

    // Client-side filtering by priority if specified
    if (filters?.priority) {
      data = data.filter(ct => ct.priority === filters.priority);
    }

    // Client-side filtering by risk tier if specified
    if (filters?.riskTier) {
      data = data.filter(ct => ct.riskTier === filters.riskTier);
    }

    const totalCount = data.length;
    const pageSize = filters?.pageSize || 25;
    const page = filters?.page || 1;

    return {
      data,
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  async getCareTransition(careTransitionKey: string): Promise<CareTransition> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const response = await this.client.get<any>(
      `/api/CareTransitions/${careTransitionKey}`,
      { params: { tenantKey } }
    );
    return this.mapApiToCareTransition(response.data);
  }

  async getCareTransitionByEncounter(encounterKey: number): Promise<CareTransition | null> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    try {
      const response = await this.client.get<any>(
        `/api/CareTransitions/encounter/${encounterKey}`,
        { params: { tenantKey } }
      );
      return this.mapApiToCareTransition(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createCareTransition(data: Partial<CareTransition>): Promise<CareTransition> {
    const response = await this.client.post<any>('/api/CareTransitions/create', data);
    return response.data.data;
  }

  async updateCareTransition(
    careTransitionKey: string,
    data: Partial<CareTransition>
  ): Promise<CareTransition> {
    const response = await this.client.put<any>('/api/CareTransitions/update', {
      careTransitionKey,
      ...data,
    });
    return response.data.data;
  }

  async updatePriority(
    careTransitionKey: string,
    priority: 'Low' | 'Medium' | 'High'
  ): Promise<void> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';

    await this.client.post(
      `/api/CareTransitions/${careTransitionKey}/priority`,
      {
        TenantKey: tenantKey,
        Priority: priority,
      }
    );
  }

  async updateRiskTier(
    careTransitionKey: string,
    riskTier: 'Low' | 'Medium' | 'High'
  ): Promise<void> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';

    await this.client.post(
      `/api/CareTransitions/${careTransitionKey}/riskTier`,
      {
        TenantKey: tenantKey,
        RiskTier: riskTier,
      }
    );
  }

  async logOutreach(
    careTransitionKey: string,
    data: LogOutreachRequest
  ): Promise<void> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';

    // Transform camelCase to PascalCase for backend
    const requestBody = {
      TenantKey: tenantKey,
      CareTransitionKey: parseInt(careTransitionKey), // Convert to number
      OutreachMethod: data.outreachMethod,
      OutreachDate: data.outreachDate,
      ContactOutcome: data.contactOutcome,
      NextOutreachDate_TS: data.nextOutreachDate_TS || undefined,
      Notes: data.notes || undefined,
      AssignedToUserKey: data.assignedToUserKey || '',
      LastOutreachDate: data.outreachDate, // Set to current outreach date
      Status: data.Status || 'In Progress',
    };

    console.log('=== API Client logOutreach ===');
    console.log('URL:', `/api/CareTransitions/${careTransitionKey}/outreach`);
    console.log('Request body:', requestBody);
    console.log('NextOutreachDate_TS:', requestBody.NextOutreachDate_TS);

    const response = await this.client.post<{ Success: boolean; Message?: string; CareTransitionKey?: string }>(
      `/api/CareTransitions/${careTransitionKey}/outreach`,
      requestBody
    );

    // Check if the operation was successful
    if (!response.data.Success) {
      throw new Error(response.data.Message || 'Failed to log outreach');
    }
  }

  async assignCareTransition(
    careTransitionKey: string,
    data: AssignCareTransitionRequest
  ): Promise<CareTransition> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';

    // Send in request body as per API specification
    const requestBody = {
      TenantKey: tenantKey,
      CareTransitionKey: parseInt(careTransitionKey),
      CareManagerUserKey: data.careManagerUserKey || '',
      AssignedToUserKey: data.assignedToUserKey,
      AssignedTeam: data.assignedTeam || '',
    };

    const url = `/api/CareTransitions/${careTransitionKey}/assign`;
    console.log('API Client - assignCareTransition URL:', url);
    console.log('API Client - Request body:', requestBody);

    const response = await this.client.post<any>(url, requestBody);
    console.log('API Client - Response:', response);
    return response.data.data;
  }

  async closeCareTransition(
    careTransitionKey: string,
    data: CloseCareTransitionRequest
  ): Promise<CareTransition> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';

    // Transform to PascalCase for backend
    const requestBody = {
      TenantKey: tenantKey,
      CareTransitionKey: parseInt(careTransitionKey),
      CloseReason: data.closeReason,
      Notes: data.notes || '',
      ClosedByUserKey: data.closedByUserKey || '',
    };

    console.log('=== API Client closeCareTransition ===');
    console.log('URL:', '/api/CareTransitions/close');
    console.log('Request body:', requestBody);
    console.log('ClosedByUserKey:', requestBody.ClosedByUserKey);

    const response = await this.client.post<any>('/api/CareTransitions/close', requestBody);
    return response.data.data;
  }

  async getTCMMetrics(from?: string, to?: string): Promise<TCMMetrics> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const params: any = { tenantKey };
    if (from) params.from = from;
    if (to) params.to = to;

    console.log('=== API Client getTCMMetrics ===');
    console.log('URL:', '/api/tcm/metrics');
    console.log('Params:', params);

    const response = await this.client.get<any>('/api/tcm/metrics', { params });

    console.log('TCM Metrics Response:', response.data);
    console.log('Raw response data keys:', Object.keys(response.data));

    // Transform PascalCase API response to camelCase for frontend
    // API returns: TotalActiveCareTransitions, TotalClosedCareTransitions, CompletedTcm7DayCount,
    // CompletedTcm14DayCount, AverageOutreachAttempts, PendingOutreachCount
    const transformedData: TCMMetrics = {
      totalOpen: response.data.TotalActiveCareTransitions || 0,
      totalInProgress: 0, // API doesn't provide this, could calculate from StatusBreakdown if needed
      totalClosed: response.data.TotalClosedCareTransitions || 0,
      overdue: response.data.PendingOutreachCount || 0,
      dueToday: 0, // API doesn't provide this
      tcmContactWithin2Days: response.data.CompletedTcm7DayCount || 0,
      followUpWithin14Days: response.data.CompletedTcm14DayCount || 0,
      avgOutreachAttempts: response.data.AverageOutreachAttempts || 0,
    };

    console.log('Transformed data:', transformedData);
    console.log('avgOutreachAttempts:', transformedData.avgOutreachAttempts);

    return transformedData;
  }

  async getCareTransitionTimeline(careTransitionKey: string): Promise<any[]> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const response = await this.client.get<any[]>(
      `/api/CareTransitions/${careTransitionKey}/timeline`,
      { params: { tenantKey } }
    );
    return response.data;
  }

  async getOverdueTCMSchedule1(): Promise<any[]> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const response = await this.client.get<any[]>('/api/tcm/overdue', {
      params: { tenantKey }
    });
    return response.data;
  }

  async getOverdueTCMSchedule2(): Promise<any[]> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const response = await this.client.get<any[]>('/api/tcm/overdue2', {
      params: { tenantKey }
    });
    return response.data;
  }

  async getAdmittedEncounters(): Promise<any[]> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const response = await this.client.get<any[]>('/api/Encounters/admitted', {
      params: { tenantKey, skip: 0, take: 100 }
    });
    return response.data;
  }

  async getDischargedEncounters(): Promise<any[]> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const response = await this.client.get<any[]>('/api/Encounters/discharged', {
      params: { tenantKey, skip: 0, take: 100 }
    });
    return response.data;
  }

  async getReadmittedEncounters(): Promise<any[]> {
    const tenantKey = this.getTenantKey ? this.getTenantKey() : 'jY4rw2QSwyW0xIAnn2Xa7k2CGfF2';
    const response = await this.client.get<any[]>(`/api/Encounters/tenant/${tenantKey}`, {
      params: { skip: 0, take: 100 }
    });
    // Filter for readmitted encounters (VisitStatus = "Readmitted" or "R")
    const readmitted = response.data.filter((enc: any) =>
      enc.VisitStatus?.toUpperCase() === 'READMITTED' || enc.VisitStatus?.toUpperCase() === 'R'
    );

    // Add PatientName field by constructing from Patient data
    return readmitted.map((enc: any) => ({
      ...enc,
      PatientName: enc.Patient
        ? `${enc.Patient.GivenName || ''} ${enc.Patient.FamilyName || ''}`.trim() || 'Unknown Patient'
        : enc.PatientName || 'Unknown Patient'
    }));
  }
}

export const apiClient = new ApiClient();
