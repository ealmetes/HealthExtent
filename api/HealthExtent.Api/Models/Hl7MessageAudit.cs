using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace HealthExtent.Api.Models;

[Table("Hl7MessageAudit", Schema = "he")]
[PrimaryKey(nameof(TenantKey), nameof(MessageControlId))]
[Index(nameof(TenantKey), nameof(MessageType), nameof(ProcessedUtc), Name = "IX_Audit_Type_Time")]
public class Hl7MessageAudit
{
    [Required]
    public int TenantKey { get; set; }

    [Required]
    [MaxLength(64)]
    public string MessageControlId { get; set; } = string.Empty;

    [Required]
    [MaxLength(16)]
    public string MessageType { get; set; } = string.Empty;

    [Column(TypeName = "datetime2(3)")]
    public DateTime? EventTimestamp { get; set; }

    public int? SourceKey { get; set; }

    public int? HospitalKey { get; set; }

    public string? RawMessage { get; set; }

    public DateTime ProcessedUtc { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(16)]
    public string Status { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? ErrorText { get; set; }

    // Navigation properties
    [ForeignKey(nameof(TenantKey))]
    public virtual Tenant? Tenant { get; set; }

    [ForeignKey(nameof(SourceKey))]
    public virtual Hl7Source? Source { get; set; }

    [ForeignKey(nameof(HospitalKey))]
    public virtual Hospital? Hospital { get; set; }
}
