using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HealthExtent.Api.DTOs;

namespace HealthExtent.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IConfiguration configuration, ILogger<AuthController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Generate a JWT token for API access (Development/Testing only)
    /// </summary>
    /// <remarks>
    /// This endpoint generates a JWT Bearer token that can be used to authenticate API requests.
    ///
    /// Example request:
    ///
    ///     POST /api/auth/token
    ///     {
    ///         "username": "api-user",
    ///         "tenantId": 1,
    ///         "tenantCode": "TENANT001"
    ///     }
    ///
    /// Use the returned token in the Authorization header:
    ///
    ///     Authorization: Bearer {token}
    ///
    /// </remarks>
    [AllowAnonymous]
    [HttpPost("token")]
    [ProducesResponseType(typeof(TokenResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult GenerateToken([FromBody] TokenRequest request)
    {
        _logger.LogInformation("Token generation requested for user: {Username}, tenant: {TenantId}",
            request.Username, request.TenantId);

        var jwtSecretKey = _configuration["Jwt:SecretKey"];
        var jwtIssuer = _configuration["Jwt:Issuer"];
        var jwtAudience = _configuration["Jwt:Audience"];

        if (string.IsNullOrEmpty(jwtSecretKey) || jwtSecretKey == "REPLACE_WITH_SECRET_KEY_FROM_USER_SECRETS")
        {
            _logger.LogError("JWT secret key not configured");
            return BadRequest(new { error = "JWT authentication is not configured. Please set Jwt:SecretKey in configuration." });
        }

        if (request.TenantId <= 0)
        {
            return BadRequest(new { error = "TenantId must be greater than 0" });
        }

        if (string.IsNullOrWhiteSpace(request.Username))
        {
            return BadRequest(new { error = "Username is required" });
        }

        try
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, request.Username),
                new Claim(ClaimTypes.NameIdentifier, request.Username),
                new Claim("tenant_id", request.TenantId.ToString()),
                new Claim("tenant_code", request.TenantCode ?? $"TENANT{request.TenantId:D3}"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            _logger.LogInformation("Token generated successfully for user: {Username}, tenant: {TenantId}, expires: {Expires}",
                request.Username, request.TenantId, token.ValidTo);

            return Ok(new TokenResponse
            {
                Token = tokenString,
                Expires = token.ValidTo,
                TenantId = request.TenantId,
                Username = request.Username
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating token for user: {Username}", request.Username);
            return StatusCode(500, new { error = "An error occurred while generating the token" });
        }
    }

    /// <summary>
    /// Validate the current JWT token
    /// </summary>
    [Authorize]
    [HttpGet("validate")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult ValidateToken()
    {
        var username = User.Identity?.Name;
        var tenantId = User.FindFirst("tenant_id")?.Value;
        var tenantCode = User.FindFirst("tenant_code")?.Value;
        var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();

        return Ok(new
        {
            valid = true,
            username = username,
            tenantId = tenantId,
            tenantCode = tenantCode,
            claims = claims
        });
    }
}
