namespace HealthExtent.Api.DTOs;

public class PatientDto
{
    public long PatientKey { get; set; }
    public int TenantKey { get; set; }
    public string PatientIdExternal { get; set; } = string.Empty;
    public string? AssigningAuthority { get; set; }
    public string? MRN { get; set; }
    public string? FamilyName { get; set; }
    public string? GivenName { get; set; }
    public DateTime? DOB { get; set; }
    public string? Sex { get; set; }
    public string? Phone { get; set; }
    public string? AddressLine1 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public int? FirstSeenHospitalKey { get; set; }
    public DateTime LastUpdatedUtc { get; set; }
}

public class UpsertPatientRequest
{
    public int TenantKey { get; set; }
    public string PatientIdExternal { get; set; } = string.Empty;
    public string? AssigningAuthority { get; set; }
    public string? MRN { get; set; }
    public string? FamilyName { get; set; }
    public string? GivenName { get; set; }
    public string? DOB_TS { get; set; }  // HL7 timestamp format
    public string? Sex { get; set; }
    public string? Phone { get; set; }
    public string? AddressLine1 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? FirstSeenHospitalCode { get; set; }
}

public class UpsertPatientResponse
{
    public long PatientKey { get; set; }
    public bool Success { get; set; }
    public string? Message { get; set; }
}
