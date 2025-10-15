using HealthExtent.Api.DTOs;
using HealthExtent.Api.Models;

namespace HealthExtent.Api.Services;

public interface IHealthExtentService
{
    // Patient operations
    Task<UpsertPatientResponse> UpsertPatientAsync(UpsertPatientRequest request);
    Task<PatientDto?> GetPatientByKeyAsync(long patientKey, int tenantKey);
    Task<IEnumerable<PatientDto>> GetPatientsByTenantAsync(int tenantKey, int skip = 0, int take = 100);

    // Encounter operations
    Task<UpsertEncounterResponse> UpsertEncounterAsync(UpsertEncounterRequest request);
    Task<EncounterDto?> GetEncounterByKeyAsync(long encounterKey, int tenantKey);
    Task<IEnumerable<EncounterDto>> GetEncountersByPatientAsync(long patientKey, int tenantKey);
    Task<IEnumerable<EncounterDto>> GetEncountersByTenantAsync(int tenantKey, int skip = 0, int take = 100);

    // Audit operations
    Task<WriteAuditResponse> WriteAuditAsync(WriteAuditRequest request);
    Task<IEnumerable<Hl7MessageAuditDto>> GetAuditsByTenantAsync(int tenantKey, int skip = 0, int take = 100);

    // Hospital operations
    Task<IEnumerable<Hospital>> GetHospitalsByTenantAsync(int tenantKey);
}
