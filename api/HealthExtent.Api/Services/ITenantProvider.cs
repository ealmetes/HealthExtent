namespace HealthExtent.Api.Services;

public interface ITenantProvider
{
    int? GetTenantId();
    string? GetTenantCode();
}
