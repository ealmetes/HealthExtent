using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthExtent.Api.Models;

[Table("Hospital", Schema = "he")]
public class Hospital
{
    [Key]
    public int HospitalKey { get; set; }

    [Required]
    public int TenantKey { get; set; }

    [Required]
    [MaxLength(64)]
    public string HospitalCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string HospitalName { get; set; } = string.Empty;

    [MaxLength(64)]
    public string? AssigningAuthority { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(TenantKey))]
    public virtual Tenant? Tenant { get; set; }

    public virtual ICollection<Encounter> Encounters { get; set; } = new List<Encounter>();
    public virtual ICollection<Hl7Source> Hl7Sources { get; set; } = new List<Hl7Source>();
}
