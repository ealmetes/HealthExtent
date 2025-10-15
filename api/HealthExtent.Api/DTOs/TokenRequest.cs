namespace HealthExtent.Api.DTOs;

public class TokenRequest
{
    public string Username { get; set; } = "api-user";
    public int TenantId { get; set; } = 1;
    public string? TenantCode { get; set; }
}
