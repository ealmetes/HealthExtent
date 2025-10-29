import type {
  User,
  Hospital,
  Provider,
  Patient,
  DischargeSummary,
  PaginatedResponse,
} from '@/types';

export const mockUser: User = {
  id: '1',
  email: 'demo@healthextent.com',
  firstName: 'Demo',
  lastName: 'User',
  role: 'Provider',
  isActive: true,
  createdAt: new Date().toISOString(),
};

export const mockHospitals: Hospital[] = [
  {
    id: '1',
    name: 'General Hospital',
    code: 'GH001',
    address: '123 Medical Center Dr, City, ST 12345',
    phoneNumber: '(555) 123-4567',
    isActive: true,
  },
  {
    id: '2',
    name: 'St. Mary Medical Center',
    code: 'SMMC',
    address: '456 Healthcare Ave, City, ST 12345',
    phoneNumber: '(555) 234-5678',
    isActive: true,
  },
  {
    id: '3',
    name: 'University Hospital',
    code: 'UH',
    address: '789 University Blvd, City, ST 12345',
    phoneNumber: '(555) 345-6789',
    isActive: true,
  },
];

export const mockProviders: Provider[] = [
  {
    id: '1',
    npi: '1234567890',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@healthextent.com',
    phoneNumber: '(555) 111-2222',
    specialty: 'Primary Care',
    isActive: true,
  },
  {
    id: '2',
    npi: '2345678901',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@healthextent.com',
    phoneNumber: '(555) 222-3333',
    specialty: 'Internal Medicine',
    isActive: true,
  },
  {
    id: '3',
    npi: '3456789012',
    firstName: 'Michael',
    lastName: 'Davis',
    email: 'michael.davis@healthextent.com',
    phoneNumber: '(555) 333-4444',
    specialty: 'Family Medicine',
    isActive: true,
  },
];

export const mockPatients: Patient[] = [
  {
    id: '1',
    mrn: 'MRN001234',
    firstName: 'Robert',
    lastName: 'Anderson',
    dateOfBirth: '1955-03-15',
    gender: 'Male',
    address: '123 Main St, City, ST 12345',
    phoneNumber: '(555) 444-5555',
    email: 'robert.anderson@email.com',
  },
  {
    id: '2',
    mrn: 'MRN002345',
    firstName: 'Mary',
    lastName: 'Williams',
    dateOfBirth: '1962-07-22',
    gender: 'Female',
    address: '456 Oak Ave, City, ST 12345',
    phoneNumber: '(555) 555-6666',
    email: 'mary.williams@email.com',
  },
  {
    id: '3',
    mrn: 'MRN003456',
    firstName: 'James',
    lastName: 'Brown',
    dateOfBirth: '1948-11-30',
    gender: 'Male',
    address: '789 Elm St, City, ST 12345',
    phoneNumber: '(555) 666-7777',
    email: 'james.brown@email.com',
  },
  {
    id: '4',
    mrn: 'MRN004567',
    firstName: 'Patricia',
    lastName: 'Jones',
    dateOfBirth: '1970-05-18',
    gender: 'Female',
    address: '321 Pine St, City, ST 12345',
    phoneNumber: '(555) 777-8888',
  },
  {
    id: '5',
    mrn: 'MRN005678',
    firstName: 'David',
    lastName: 'Miller',
    dateOfBirth: '1958-09-25',
    gender: 'Male',
    address: '654 Maple Ave, City, ST 12345',
    phoneNumber: '(555) 888-9999',
  },
];

export const mockDischargeSummaries: DischargeSummary[] = [
  {
    id: '1',
    encounterId: 'ENC001',
    patientId: '1',
    hospitalId: '1',
    admissionDate: '2025-10-10T08:00:00Z',
    dischargeDate: '2025-10-15T14:30:00Z',
    chiefComplaint: 'Chest pain and shortness of breath',
    diagnosisCodes: ['I21.9', 'I50.9', 'E11.9'],
    dischargeDiagnosis: 'Acute myocardial infarction, congestive heart failure',
    procedureCodes: ['93458', '92928'],
    medications: [
      'Aspirin 81mg daily',
      'Metoprolol 50mg twice daily',
      'Atorvastatin 40mg at bedtime',
      'Lisinopril 10mg daily',
    ],
    followUpInstructions: 'Follow up with cardiology in 1 week. Monitor blood pressure daily. Cardiac rehab referral provided.',
    reviewStatus: 'Pending',
    priority: 'Urgent',
    createdAt: '2025-10-15T15:00:00Z',
    updatedAt: '2025-10-15T15:00:00Z',
    patient: mockPatients[0],
    hospital: mockHospitals[0],
  },
  {
    id: '2',
    encounterId: 'ENC002',
    patientId: '2',
    hospitalId: '2',
    admissionDate: '2025-10-12T10:00:00Z',
    dischargeDate: '2025-10-16T11:00:00Z',
    chiefComplaint: 'Pneumonia',
    diagnosisCodes: ['J18.9', 'E11.9'],
    dischargeDiagnosis: 'Community-acquired pneumonia',
    procedureCodes: ['71045'],
    medications: [
      'Azithromycin 500mg daily x 5 days',
      'Albuterol inhaler as needed',
      'Metformin 1000mg twice daily',
    ],
    followUpInstructions: 'Follow up with PCP in 5-7 days. Complete full course of antibiotics. Return if fever returns or breathing worsens.',
    assignedToProviderId: '1',
    reviewStatus: 'InReview',
    priority: 'High',
    createdAt: '2025-10-16T12:00:00Z',
    updatedAt: '2025-10-16T16:30:00Z',
    patient: mockPatients[1],
    hospital: mockHospitals[1],
    assignedToProvider: mockProviders[0],
  },
  {
    id: '3',
    encounterId: 'ENC003',
    patientId: '3',
    hospitalId: '1',
    admissionDate: '2025-10-14T15:00:00Z',
    dischargeDate: '2025-10-17T10:00:00Z',
    chiefComplaint: 'Fall with hip fracture',
    diagnosisCodes: ['S72.001A', 'M81.0'],
    dischargeDiagnosis: 'Right femoral neck fracture, osteoporosis',
    procedureCodes: ['27236'],
    medications: [
      'Oxycodone 5mg every 4-6 hours as needed for pain',
      'Alendronate 70mg weekly',
      'Calcium with Vitamin D twice daily',
      'Enoxaparin 40mg daily x 4 weeks',
    ],
    followUpInstructions: 'Orthopedic follow-up in 2 weeks. Physical therapy 3x per week. Weight bearing as tolerated with walker. DVT prophylaxis for 4 weeks.',
    assignedToProviderId: '2',
    reviewStatus: 'Reviewed',
    priority: 'Medium',
    createdAt: '2025-10-17T11:00:00Z',
    updatedAt: '2025-10-17T14:00:00Z',
    reviewedAt: '2025-10-17T14:00:00Z',
    patient: mockPatients[2],
    hospital: mockHospitals[0],
    assignedToProvider: mockProviders[1],
  },
  {
    id: '4',
    encounterId: 'ENC004',
    patientId: '4',
    hospitalId: '3',
    admissionDate: '2025-10-13T09:00:00Z',
    dischargeDate: '2025-10-16T16:00:00Z',
    chiefComplaint: 'Diabetic ketoacidosis',
    diagnosisCodes: ['E11.10', 'E87.2'],
    dischargeDiagnosis: 'Type 2 diabetes with ketoacidosis',
    procedureCodes: [],
    medications: [
      'Insulin glargine 20 units at bedtime',
      'Insulin lispro per sliding scale with meals',
      'Metformin 1000mg twice daily',
    ],
    followUpInstructions: 'Endocrinology follow-up in 1 week. Check blood glucose 4x daily. Diabetes education scheduled.',
    reviewStatus: 'Pending',
    priority: 'High',
    createdAt: '2025-10-16T17:00:00Z',
    updatedAt: '2025-10-16T17:00:00Z',
    patient: mockPatients[3],
    hospital: mockHospitals[2],
  },
  {
    id: '5',
    encounterId: 'ENC005',
    patientId: '5',
    hospitalId: '2',
    admissionDate: '2025-10-15T07:00:00Z',
    dischargeDate: '2025-10-17T12:00:00Z',
    chiefComplaint: 'COPD exacerbation',
    diagnosisCodes: ['J44.1', 'J44.0'],
    dischargeDiagnosis: 'Acute exacerbation of COPD',
    procedureCodes: [],
    medications: [
      'Prednisone 40mg daily x 5 days',
      'Azithromycin 500mg daily x 5 days',
      'Albuterol/Ipratropium inhaler 4x daily',
      'Spiriva 18mcg daily',
    ],
    followUpInstructions: 'Pulmonology follow-up in 2 weeks. Home oxygen 2L continuous. Smoking cessation counseling provided.',
    assignedToProviderId: '3',
    reviewStatus: 'Pending',
    priority: 'Medium',
    createdAt: '2025-10-17T13:00:00Z',
    updatedAt: '2025-10-17T13:00:00Z',
    patient: mockPatients[4],
    hospital: mockHospitals[1],
    assignedToProvider: mockProviders[2],
  },
];

export function getMockDischargeSummaries(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    search?: string;
    reviewStatus?: string;
    priority?: string;
    hospitalId?: string;
  }
): PaginatedResponse<DischargeSummary> {
  let filtered = [...mockDischargeSummaries];

  // Apply filters
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.patient?.firstName?.toLowerCase().includes(search) ||
        s.patient?.lastName?.toLowerCase().includes(search) ||
        s.patient?.mrn?.toLowerCase().includes(search)
    );
  }

  if (filters?.reviewStatus) {
    filtered = filtered.filter((s) => s.reviewStatus === filters.reviewStatus);
  }

  if (filters?.priority) {
    filtered = filtered.filter((s) => s.priority === filters.priority);
  }

  if (filters?.hospitalId) {
    filtered = filtered.filter((s) => s.hospitalId === filters.hospitalId);
  }

  // Pagination
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = filtered.slice(start, end);

  return {
    data,
    page,
    pageSize,
    totalCount,
    totalPages,
  };
}
