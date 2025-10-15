namespace HealthExtent.Api.DTOs;

public class EncounterDto
{
    public long EncounterKey { get; set; }
    public int TenantKey { get; set; }
    public int HospitalKey { get; set; }
    public long PatientKey { get; set; }
    public string VisitNumber { get; set; } = string.Empty;
    public DateTime? AdmitDateTime { get; set; }
    public DateTime? DischargeDateTime { get; set; }
    public string? PatientClass { get; set; }
    public string? Location { get; set; }
    public string? AttendingDoctor { get; set; }
    public string? PrimaryDoctor { get; set; }
    public string? AdmittingDoctor { get; set; }
    public string? AdmitSource { get; set; }
    public string? VisitStatus { get; set; }
    public string? Notes { get; set; }
    public string? AdmitMessageId { get; set; }
    public string? DischargeMessageId { get; set; }
    public DateTime LastUpdatedUtc { get; set; }
}

public class UpsertEncounterRequest
{
    public int TenantKey { get; set; }
    public string HospitalCode { get; set; } = string.Empty;
    public string VisitNumber { get; set; } = string.Empty;
    public long PatientKey { get; set; }
    public string? Admit_TS { get; set; }  // HL7 timestamp format
    public string? Discharge_TS { get; set; }  // HL7 timestamp format
    public string? PatientClass { get; set; }
    public string? Location { get; set; }
    public string? AttendingDoctor { get; set; }
    public string? PrimaryDoctor { get; set; }
    public string? AdmittingDoctor { get; set; }
    public string? AdmitSource { get; set; }
    public string? VisitStatus { get; set; }
    public string? Notes { get; set; }
    public string? AdmitMessageId { get; set; }
    public string? DischargeMessageId { get; set; }
}

public class UpsertEncounterResponse
{
    public long? EncounterKey { get; set; }
    public bool Success { get; set; }
    public string? Message { get; set; }
}
