using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthExtent.Api.Models;

[Table("Tenant", Schema = "he")]
public class Tenant
{
    [Key]
    public int TenantKey { get; set; }

    [Required]
    [MaxLength(64)]
    public string TenantCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string TenantName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<Hospital> Hospitals { get; set; } = new List<Hospital>();
    public virtual ICollection<Patient> Patients { get; set; } = new List<Patient>();
    public virtual ICollection<Encounter> Encounters { get; set; } = new List<Encounter>();
}
