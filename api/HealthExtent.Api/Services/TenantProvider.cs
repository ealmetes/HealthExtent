namespace HealthExtent.Api.Services;

public class TenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int? GetTenantId()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
            return null;

        // Check custom header first
        if (httpContext.Request.Headers.TryGetValue("X-Tenant-Id", out var tenantIdHeader))
        {
            if (int.TryParse(tenantIdHeader, out var tenantId))
                return tenantId;
        }

        // Check if tenant ID is in claims (from JWT token)
        var tenantClaim = httpContext.User.FindFirst("tenant_id");
        if (tenantClaim != null && int.TryParse(tenantClaim.Value, out var tenantIdFromClaim))
        {
            return tenantIdFromClaim;
        }

        return null;
    }

    public string? GetTenantCode()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
            return null;

        // Check custom header
        if (httpContext.Request.Headers.TryGetValue("X-Tenant-Code", out var tenantCode))
        {
            return tenantCode;
        }

        // Check if tenant code is in claims
        var tenantClaim = httpContext.User.FindFirst("tenant_code");
        return tenantClaim?.Value;
    }
}
