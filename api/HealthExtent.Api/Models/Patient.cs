using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace HealthExtent.Api.Models;

[Table("Patient", Schema = "he")]
[Index(nameof(TenantKey), nameof(PatientIdExternal), nameof(AssigningAuthorityNorm), IsUnique = true, Name = "UQ_Patient_Natural")]
[Index(nameof(TenantKey), nameof(MRN), nameof(AssigningAuthorityNorm), Name = "IX_Patient_MRN")]
public class Patient
{
    [Key]
    public long PatientKey { get; set; }

    [Required]
    public int TenantKey { get; set; }

    [Required]
    [MaxLength(64)]
    public string PatientIdExternal { get; set; } = string.Empty;

    [MaxLength(64)]
    public string? AssigningAuthority { get; set; }

    [MaxLength(64)]
    public string? MRN { get; set; }

    [MaxLength(100)]
    public string? FamilyName { get; set; }

    [MaxLength(100)]
    public string? GivenName { get; set; }

    [Column(TypeName = "date")]
    public DateTime? DOB { get; set; }

    [MaxLength(1)]
    public string? Sex { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    public string? AddressLine1 { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(50)]
    public string? State { get; set; }

    [MaxLength(20)]
    public string? PostalCode { get; set; }

    [MaxLength(50)]
    public string? Country { get; set; }

    public int? FirstSeenHospitalKey { get; set; }

    public DateTime LastUpdatedUtc { get; set; } = DateTime.UtcNow;

    // Computed column
    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    [MaxLength(64)]
    public string AssigningAuthorityNorm { get; private set; } = string.Empty;

    // Navigation properties
    [ForeignKey(nameof(TenantKey))]
    public virtual Tenant? Tenant { get; set; }

    [ForeignKey(nameof(FirstSeenHospitalKey))]
    public virtual Hospital? FirstSeenHospital { get; set; }

    public virtual ICollection<Encounter> Encounters { get; set; } = new List<Encounter>();
}
