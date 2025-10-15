using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthExtent.Api.Models;

[Table("Hl7Source", Schema = "he")]
public class Hl7Source
{
    [Key]
    public int SourceKey { get; set; }

    [Required]
    public int TenantKey { get; set; }

    [Required]
    [MaxLength(64)]
    public string SourceCode { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    public int? HospitalKey { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(TenantKey))]
    public virtual Tenant? Tenant { get; set; }

    [ForeignKey(nameof(HospitalKey))]
    public virtual Hospital? Hospital { get; set; }
}
