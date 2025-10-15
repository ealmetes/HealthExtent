using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace HealthExtent.Api.Models;

[Table("Encounter", Schema = "he")]
[Index(nameof(TenantKey), nameof(HospitalKey), nameof(VisitNumber), IsUnique = true, Name = "UQ_Encounter_Natural")]
public class Encounter
{
    [Key]
    public long EncounterKey { get; set; }

    [Required]
    public int TenantKey { get; set; }

    [Required]
    public int HospitalKey { get; set; }

    [Required]
    public long PatientKey { get; set; }

    [Required]
    [MaxLength(64)]
    public string VisitNumber { get; set; } = string.Empty;

    [Column(TypeName = "datetime2(3)")]
    public DateTime? AdmitDateTime { get; set; }

    [Column(TypeName = "datetime2(3)")]
    public DateTime? DischargeDateTime { get; set; }

    [MaxLength(10)]
    public string? PatientClass { get; set; }

    [MaxLength(100)]
    public string? Location { get; set; }

    [MaxLength(200)]
    public string? AttendingDoctor { get; set; }

    [MaxLength(200)]
    public string? PrimaryDoctor { get; set; }

    [MaxLength(200)]
    public string? AdmittingDoctor { get; set; }

    [MaxLength(64)]
    public string? AdmitSource { get; set; }

    [MaxLength(32)]
    public string? VisitStatus { get; set; }

    public string? Notes { get; set; }

    [MaxLength(64)]
    public string? AdmitMessageId { get; set; }

    [MaxLength(64)]
    public string? DischargeMessageId { get; set; }

    public DateTime LastUpdatedUtc { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(TenantKey))]
    public virtual Tenant? Tenant { get; set; }

    [ForeignKey(nameof(HospitalKey))]
    public virtual Hospital? Hospital { get; set; }

    [ForeignKey(nameof(PatientKey))]
    public virtual Patient? Patient { get; set; }
}
