namespace HealthExtent.Api.DTOs;

public class Hl7MessageAuditDto
{
    public int TenantKey { get; set; }
    public string MessageControlId { get; set; } = string.Empty;
    public string MessageType { get; set; } = string.Empty;
    public DateTime? EventTimestamp { get; set; }
    public int? SourceKey { get; set; }
    public int? HospitalKey { get; set; }
    public string? RawMessage { get; set; }
    public DateTime ProcessedUtc { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ErrorText { get; set; }
}

public class WriteAuditRequest
{
    public int TenantKey { get; set; }
    public string MessageControlId { get; set; } = string.Empty;
    public string MessageType { get; set; } = string.Empty;
    public string? EventTimestamp_TS { get; set; }  // HL7 timestamp format
    public string? SourceCode { get; set; }
    public string? HospitalCode { get; set; }
    public string? RawMessage { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ErrorText { get; set; }
}

public class WriteAuditResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
}
