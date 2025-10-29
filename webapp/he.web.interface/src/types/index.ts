// Core domain types matching backend API

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  patientIdExternal?: string;
  assigningAuthority?: string;
  tenantKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Hospital {
  id: string;
  name: string;
  code: string;
  assigningAuthority?: string;
  city?: string;
  state?: string;
  address?: string;
  phoneNumber?: string;
  isActive: boolean;
  tenantKey?: string;
}

export interface Provider {
  id: string;
  npi: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  specialty?: string;
  isActive: boolean;
}

export interface Encounter {
  id: string;
  patientId: string;
  hospitalId: string;
  encounterNumber: string;
  admissionDate: string;
  dischargeDate?: string;
  encounterType: 'Inpatient' | 'Outpatient' | 'Emergency' | 'Observation';
  status: 'Admitted' | 'Discharged' | 'Transferred' | 'Cancelled';
  visitStatus?: string;
  chiefComplaint?: string;
  diagnosisCodes?: string[];
  procedureCodes?: string[];
  attendingProviderId?: string;
  assignedToProviderId?: string;
  hl7MessageId?: string;
  tcmSchedule1?: string;
  tcmSchedule2?: string;
  createdAt: string;
  updatedAt: string;

  // Nested relationships
  patient?: Patient;
  hospital?: Hospital;
  attendingProvider?: Provider;
  assignedToProvider?: Provider;
}

export interface DischargeSummary {
  id: string;
  encounterId: string;
  patientId: string;
  hospitalId: string;
  admissionDate: string;
  dischargeDate: string;
  chiefComplaint?: string;
  diagnosisCodes?: string[];
  dischargeDiagnosis?: string;
  procedureCodes?: string[];
  medications?: string[];
  followUpInstructions?: string;
  assignedToProviderId?: string;
  reviewStatus: 'Pending' | 'InReview' | 'Reviewed' | 'Escalated';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  visitStatus?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;

  // Nested relationships
  patient?: Patient;
  hospital?: Hospital;
  encounter?: Encounter;
  assignedToProvider?: Provider;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Provider' | 'CareCoordinator';
  providerId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthToken {
  token: string;
  expiresAt: string;
  user: User;
}

// Filter and pagination types
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface DischargeSummaryFilters extends PaginationParams {
  search?: string;
  hospitalId?: string;
  reviewStatus?: DischargeSummary['reviewStatus'];
  priority?: DischargeSummary['priority'];
  visitStatus?: string;
  assignedToProviderId?: string;
  dischargeDateFrom?: string;
  dischargeDateTo?: string;
}

export interface EncounterFilters extends PaginationParams {
  search?: string;
  hospitalId?: string;
  status?: Encounter['status'];
  encounterType?: Encounter['encounterType'];
  assignedToProviderId?: string;
  admissionDateFrom?: string;
  admissionDateTo?: string;
}

// API Response types
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

// Care Transition types
export interface CareTransition {
  careTransitionKey: string;
  encounterKey: number;
  patientKey: number;
  visitNumber: string;
  status: 'Open' | 'InProgress' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  riskTier: 'Low' | 'Medium' | 'High';
  tcmSchedule1?: string;
  tcmSchedule2?: string;
  nextOutreachDate?: string;
  outreachAttempts: number;
  lastUpdatedUtc: string;
  assignedToUserKey?: string;
  careManagerUserKey?: string;
  closeReason?: string;
  closedAtUtc?: string;
  notes?: string;
  outreachDate?: string;
  outreachMethod?: string;
  followUpApptDateTime?: string;
  followUpProviderKey?: number;

  // Nested relationships
  patient?: {
    patientKey?: number;
    patientIdExternal?: string;
    patientName?: string;
    name?: string;
    mrn?: string;
    familyName?: string;
    givenName?: string;
    dob?: string;
    sex?: string;
    phone?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  hospital?: {
    hospitalKey: number;
    hospitalCode: string;
    hospitalName: string;
    city: string;
    state: string;
    isActive: boolean;
  };
  encounter?: {
    encounterKey?: number;
    admitDateTime?: string;
    dischargeDateTime?: string;
    location?: string;
    visitStatus?: string;
    notes?: string;
    attendingDoctor?: string;
    admittingDoctor?: string;
    primaryDoctor?: string;
  };
  assignedTo?: {
    userKey: number;
    name: string;
  };
  followUpProvider?: {
    providerKey: number;
    displayName: string;
  };
}

export interface CareTransitionFilters extends PaginationParams {
  status?: CareTransition['status'];
  priority?: CareTransition['priority'];
  riskTier?: CareTransition['riskTier'];
  assignedToUserKey?: string;
  hospitalId?: string;
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface LogOutreachRequest {
  tenantKey?: string;
  careTransitionKey?: string;
  outreachMethod?: string;
  outreachDate?: string;
  contactOutcome?: string;
  nextOutreachDate_TS?: string;
  notes?: string;
  assignedToUserKey?: string;
  careManagerUserKey?: string;
  lastOutreachDate?: string;
  outreachAttempts?: number;
  Status?: string;
}

export interface AssignCareTransitionRequest {
  assignedToUserKey: string;
  careManagerUserKey?: string;
  assignedTeam?: string;
}

export interface CloseCareTransitionRequest {
  closeReason: string;
  notes?: string;
  closedByUserKey?: string;
}

export interface TCMMetrics {
  totalOpen: number;
  totalInProgress: number;
  totalClosed: number;
  overdue: number;
  dueToday: number;
  tcmContactWithin2Days: number;
  followUpWithin14Days: number;
  avgOutreachAttempts: number;
}
