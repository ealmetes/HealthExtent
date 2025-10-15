using Microsoft.EntityFrameworkCore;
using HealthExtent.Api.Models;
using HealthExtent.Api.Services;

namespace HealthExtent.Api.Data;

public class HealthExtentDbContext : DbContext
{
    private readonly ITenantProvider? _tenantProvider;

    public HealthExtentDbContext(DbContextOptions<HealthExtentDbContext> options, ITenantProvider? tenantProvider = null)
        : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Tenant> Tenants { get; set; } = null!;
    public DbSet<Hospital> Hospitals { get; set; } = null!;
    public DbSet<Hl7Source> Hl7Sources { get; set; } = null!;
    public DbSet<Patient> Patients { get; set; } = null!;
    public DbSet<Encounter> Encounters { get; set; } = null!;
    public DbSet<Hl7MessageAudit> Hl7MessageAudits { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Patient computed column
        modelBuilder.Entity<Patient>()
            .Property(p => p.AssigningAuthorityNorm)
            .HasComputedColumnSql("ISNULL([AssigningAuthority], '')", stored: true);

        // Configure unique constraints explicitly
        modelBuilder.Entity<Tenant>()
            .HasIndex(t => t.TenantCode)
            .IsUnique();

        modelBuilder.Entity<Hospital>()
            .HasIndex(h => new { h.TenantKey, h.HospitalCode })
            .IsUnique()
            .HasDatabaseName("UQ_Hospital");

        modelBuilder.Entity<Hl7Source>()
            .HasIndex(s => new { s.TenantKey, s.SourceCode })
            .IsUnique()
            .HasDatabaseName("UQ_Hl7Source");

        // Configure relationships
        modelBuilder.Entity<Patient>()
            .HasOne(p => p.FirstSeenHospital)
            .WithMany()
            .HasForeignKey(p => p.FirstSeenHospitalKey)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Encounter>()
            .HasOne(e => e.Patient)
            .WithMany(p => p.Encounters)
            .HasForeignKey(e => e.PatientKey)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Encounter>()
            .HasOne(e => e.Hospital)
            .WithMany(h => h.Encounters)
            .HasForeignKey(e => e.HospitalKey)
            .OnDelete(DeleteBehavior.NoAction);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Set tenant context for RLS if available
        if (_tenantProvider != null)
        {
            var tenantId = _tenantProvider.GetTenantId();
            if (tenantId.HasValue)
            {
                await Database.ExecuteSqlRawAsync(
                    "EXEC sys.sp_set_session_context @key=N'tenant_id', @value={0}",
                    tenantId.Value);
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
