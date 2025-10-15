using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using HealthExtent.Api.Data;
using HealthExtent.Api.DTOs;
using HealthExtent.Api.Models;

namespace HealthExtent.Api.Services;

public class HealthExtentService : IHealthExtentService
{
    private readonly HealthExtentDbContext _context;
    private readonly ILogger<HealthExtentService> _logger;

    public HealthExtentService(HealthExtentDbContext context, ILogger<HealthExtentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<UpsertPatientResponse> UpsertPatientAsync(UpsertPatientRequest request)
    {
        try
        {
            var outputParam = new SqlParameter
            {
                ParameterName = "@OutPatientKey",
                SqlDbType = System.Data.SqlDbType.BigInt,
                Direction = System.Data.ParameterDirection.Output
            };

            await _context.Database.ExecuteSqlRawAsync(
                "EXEC he.UpsertPatient_Tenant @TenantKey, @PatientIdExternal, @AssigningAuthority, @MRN, @FamilyName, @GivenName, @DOB_TS, @Sex, @Phone, @AddressLine1, @City, @State, @PostalCode, @Country, @FirstSeenHospitalCode, @OutPatientKey OUTPUT",
                new SqlParameter("@TenantKey", request.TenantKey),
                new SqlParameter("@PatientIdExternal", request.PatientIdExternal),
                new SqlParameter("@AssigningAuthority", (object?)request.AssigningAuthority ?? DBNull.Value),
                new SqlParameter("@MRN", (object?)request.MRN ?? DBNull.Value),
                new SqlParameter("@FamilyName", (object?)request.FamilyName ?? DBNull.Value),
                new SqlParameter("@GivenName", (object?)request.GivenName ?? DBNull.Value),
                new SqlParameter("@DOB_TS", (object?)request.DOB_TS ?? DBNull.Value),
                new SqlParameter("@Sex", (object?)request.Sex ?? DBNull.Value),
                new SqlParameter("@Phone", (object?)request.Phone ?? DBNull.Value),
                new SqlParameter("@AddressLine1", (object?)request.AddressLine1 ?? DBNull.Value),
                new SqlParameter("@City", (object?)request.City ?? DBNull.Value),
                new SqlParameter("@State", (object?)request.State ?? DBNull.Value),
                new SqlParameter("@PostalCode", (object?)request.PostalCode ?? DBNull.Value),
                new SqlParameter("@Country", (object?)request.Country ?? DBNull.Value),
                new SqlParameter("@FirstSeenHospitalCode", (object?)request.FirstSeenHospitalCode ?? DBNull.Value),
                outputParam);

            var patientKey = (long)outputParam.Value;

            return new UpsertPatientResponse
            {
                PatientKey = patientKey,
                Success = true,
                Message = "Patient upserted successfully"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting patient");
            return new UpsertPatientResponse
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            };
        }
    }

    public async Task<PatientDto?> GetPatientByKeyAsync(long patientKey, int tenantKey)
    {
        // Set tenant context for RLS
        await _context.Database.ExecuteSqlRawAsync(
            "EXEC sys.sp_set_session_context @key=N'tenant_id', @value={0}",
            tenantKey);

        var patient = await _context.Patients
            .Where(p => p.PatientKey == patientKey && p.TenantKey == tenantKey)
            .Select(p => new PatientDto
            {
                PatientKey = p.PatientKey,
                TenantKey = p.TenantKey,
                PatientIdExternal = p.PatientIdExternal,
                AssigningAuthority = p.AssigningAuthority,
                MRN = p.MRN,
                FamilyName = p.FamilyName,
                GivenName = p.GivenName,
                DOB = p.DOB,
                Sex = p.Sex,
                Phone = p.Phone,
                AddressLine1 = p.AddressLine1,
                City = p.City,
                State = p.State,
                PostalCode = p.PostalCode,
                Country = p.Country,
                FirstSeenHospitalKey = p.FirstSeenHospitalKey,
                LastUpdatedUtc = p.LastUpdatedUtc
            })
            .FirstOrDefaultAsync();

        return patient;
    }

    public async Task<IEnumerable<PatientDto>> GetPatientsByTenantAsync(int tenantKey, int skip = 0, int take = 100)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "EXEC sys.sp_set_session_context @key=N'tenant_id', @value={0}",
            tenantKey);

        return await _context.Patients
            .Where(p => p.TenantKey == tenantKey)
            .OrderByDescending(p => p.LastUpdatedUtc)
            .Skip(skip)
            .Take(take)
            .Select(p => new PatientDto
            {
                PatientKey = p.PatientKey,
                TenantKey = p.TenantKey,
                PatientIdExternal = p.PatientIdExternal,
                AssigningAuthority = p.AssigningAuthority,
                MRN = p.MRN,
                FamilyName = p.FamilyName,
                GivenName = p.GivenName,
                DOB = p.DOB,
                Sex = p.Sex,
                Phone = p.Phone,
                AddressLine1 = p.AddressLine1,
                City = p.City,
                State = p.State,
                PostalCode = p.PostalCode,
                Country = p.Country,
                FirstSeenHospitalKey = p.FirstSeenHospitalKey,
                LastUpdatedUtc = p.LastUpdatedUtc
            })
            .ToListAsync();
    }

    public async Task<UpsertEncounterResponse> UpsertEncounterAsync(UpsertEncounterRequest request)
    {
        try
        {
            await _context.Database.ExecuteSqlRawAsync(
                "EXEC he.UpsertEncounter_Tenant @TenantKey, @HospitalCode, @VisitNumber, @PatientKey, @Admit_TS, @Discharge_TS, @PatientClass, @Location, @AttendingDoctor, @PrimaryDoctor, @AdmittingDoctor, @AdmitSource, @VisitStatus, @Notes, @AdmitMessageId, @DischargeMessageId",
                new SqlParameter("@TenantKey", request.TenantKey),
                new SqlParameter("@HospitalCode", request.HospitalCode),
                new SqlParameter("@VisitNumber", request.VisitNumber),
                new SqlParameter("@PatientKey", request.PatientKey),
                new SqlParameter("@Admit_TS", (object?)request.Admit_TS ?? DBNull.Value),
                new SqlParameter("@Discharge_TS", (object?)request.Discharge_TS ?? DBNull.Value),
                new SqlParameter("@PatientClass", (object?)request.PatientClass ?? DBNull.Value),
                new SqlParameter("@Location", (object?)request.Location ?? DBNull.Value),
                new SqlParameter("@AttendingDoctor", (object?)request.AttendingDoctor ?? DBNull.Value),
                new SqlParameter("@PrimaryDoctor", (object?)request.PrimaryDoctor ?? DBNull.Value),
                new SqlParameter("@AdmittingDoctor", (object?)request.AdmittingDoctor ?? DBNull.Value),
                new SqlParameter("@AdmitSource", (object?)request.AdmitSource ?? DBNull.Value),
                new SqlParameter("@VisitStatus", (object?)request.VisitStatus ?? DBNull.Value),
                new SqlParameter("@Notes", (object?)request.Notes ?? DBNull.Value),
                new SqlParameter("@AdmitMessageId", (object?)request.AdmitMessageId ?? DBNull.Value),
                new SqlParameter("@DischargeMessageId", (object?)request.DischargeMessageId ?? DBNull.Value));

            return new UpsertEncounterResponse
            {
                Success = true,
                Message = "Encounter upserted successfully"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting encounter");
            return new UpsertEncounterResponse
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            };
        }
    }

    public async Task<EncounterDto?> GetEncounterByKeyAsync(long encounterKey, int tenantKey)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "EXEC sys.sp_set_session_context @key=N'tenant_id', @value={0}",
            tenantKey);

        return await _context.Encounters
            .Where(e => e.EncounterKey == encounterKey && e.TenantKey == tenantKey)
            .Select(e => new EncounterDto
            {
                EncounterKey = e.EncounterKey,
                TenantKey = e.TenantKey,
                HospitalKey = e.HospitalKey,
                PatientKey = e.PatientKey,
                VisitNumber = e.VisitNumber,
                AdmitDateTime = e.AdmitDateTime,
                DischargeDateTime = e.DischargeDateTime,
                PatientClass = e.PatientClass,
                Location = e.Location,
                AttendingDoctor = e.AttendingDoctor,
                PrimaryDoctor = e.PrimaryDoctor,
                AdmittingDoctor = e.AdmittingDoctor,
                AdmitSource = e.AdmitSource,
                VisitStatus = e.VisitStatus,
                Notes = e.Notes,
                AdmitMessageId = e.AdmitMessageId,
                DischargeMessageId = e.DischargeMessageId,
                LastUpdatedUtc = e.LastUpdatedUtc
            })
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<EncounterDto>> GetEncountersByPatientAsync(long patientKey, int tenantKey)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "EXEC sys.sp_set_session_context @key=N'tenant_id', @value={0}",
            tenantKey);

        return await _context.Encounters
            .Where(e => e.PatientKey == patientKey && e.TenantKey == tenantKey)
            .OrderByDescending(e => e.LastUpdatedUtc)
            .Select(e => new EncounterDto
            {
                EncounterKey = e.EncounterKey,
                TenantKey = e.TenantKey,
                HospitalKey = e.HospitalKey,
                PatientKey = e.PatientKey,
                VisitNumber = e.VisitNumber,
                AdmitDateTime = e.AdmitDateTime,
                DischargeDateTime = e.DischargeDateTime,
                PatientClass = e.PatientClass,
                Location = e.Location,
                AttendingDoctor = e.AttendingDoctor,
                PrimaryDoctor = e.PrimaryDoctor,
                AdmittingDoctor = e.AdmittingDoctor,
                AdmitSource = e.AdmitSource,
                VisitStatus = e.VisitStatus,
                Notes = e.Notes,
                AdmitMessageId = e.AdmitMessageId,
                DischargeMessageId = e.DischargeMessageId,
                LastUpdatedUtc = e.LastUpdatedUtc
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<EncounterDto>> GetEncountersByTenantAsync(int tenantKey, int skip = 0, int take = 100)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "EXEC sys.sp_set_session_context @key=N'tenant_id', @value={0}",
            tenantKey);

        return await _context.Encounters
            .Where(e => e.TenantKey == tenantKey)
            .OrderByDescending(e => e.LastUpdatedUtc)
            .Skip(skip)
            .Take(take)
            .Select(e => new EncounterDto
            {
                EncounterKey = e.EncounterKey,
                TenantKey = e.TenantKey,
                HospitalKey = e.HospitalKey,
                PatientKey = e.PatientKey,
                VisitNumber = e.VisitNumber,
                AdmitDateTime = e.AdmitDateTime,
                DischargeDateTime = e.DischargeDateTime,
                PatientClass = e.PatientClass,
                Location = e.Location,
                AttendingDoctor = e.AttendingDoctor,
                PrimaryDoctor = e.PrimaryDoctor,
                AdmittingDoctor = e.AdmittingDoctor,
                AdmitSource = e.AdmitSource,
                VisitStatus = e.VisitStatus,
                Notes = e.Notes,
                AdmitMessageId = e.AdmitMessageId,
                DischargeMessageId = e.DischargeMessageId,
                LastUpdatedUtc = e.LastUpdatedUtc
            })
            .ToListAsync();
    }

    public async Task<WriteAuditResponse> WriteAuditAsync(WriteAuditRequest request)
    {
        try
        {
            await _context.Database.ExecuteSqlRawAsync(
                "EXEC he.WriteAudit_Tenant @TenantKey, @MessageControlId, @MessageType, @EventTimestamp_TS, @SourceCode, @HospitalCode, @RawMessage, @Status, @ErrorText",
                new SqlParameter("@TenantKey", request.TenantKey),
                new SqlParameter("@MessageControlId", request.MessageControlId),
                new SqlParameter("@MessageType", request.MessageType),
                new SqlParameter("@EventTimestamp_TS", (object?)request.EventTimestamp_TS ?? DBNull.Value),
                new SqlParameter("@SourceCode", (object?)request.SourceCode ?? DBNull.Value),
                new SqlParameter("@HospitalCode", (object?)request.HospitalCode ?? DBNull.Value),
                new SqlParameter("@RawMessage", (object?)request.RawMessage ?? DBNull.Value),
                new SqlParameter("@Status", request.Status),
                new SqlParameter("@ErrorText", (object?)request.ErrorText ?? DBNull.Value));

            return new WriteAuditResponse
            {
                Success = true,
                Message = "Audit record written successfully"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing audit");
            return new WriteAuditResponse
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            };
        }
    }

    public async Task<IEnumerable<Hl7MessageAuditDto>> GetAuditsByTenantAsync(int tenantKey, int skip = 0, int take = 100)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "EXEC sys.sp_set_session_context @key=N'tenant_id', @value={0}",
            tenantKey);

        return await _context.Hl7MessageAudits
            .Where(a => a.TenantKey == tenantKey)
            .OrderByDescending(a => a.ProcessedUtc)
            .Skip(skip)
            .Take(take)
            .Select(a => new Hl7MessageAuditDto
            {
                TenantKey = a.TenantKey,
                MessageControlId = a.MessageControlId,
                MessageType = a.MessageType,
                EventTimestamp = a.EventTimestamp,
                SourceKey = a.SourceKey,
                HospitalKey = a.HospitalKey,
                RawMessage = a.RawMessage,
                ProcessedUtc = a.ProcessedUtc,
                Status = a.Status,
                ErrorText = a.ErrorText
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<Hospital>> GetHospitalsByTenantAsync(int tenantKey)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "EXEC sys.sp_set_session_context @key=N'tenant_id', @value={0}",
            tenantKey);

        return await _context.Hospitals
            .Where(h => h.TenantKey == tenantKey && h.IsActive)
            .ToListAsync();
    }
}
