using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealthExtent.Api.DTOs;
using HealthExtent.Api.Services;

namespace HealthExtent.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuditController : ControllerBase
{
    private readonly IHealthExtentService _service;
    private readonly ILogger<AuditController> _logger;

    public AuditController(IHealthExtentService service, ILogger<AuditController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Write an HL7 message audit record
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(WriteAuditResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<WriteAuditResponse>> WriteAudit([FromBody] WriteAuditRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _service.WriteAuditAsync(request);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Get audit records for a tenant with pagination
    /// </summary>
    [HttpGet("tenant/{tenantKey}")]
    [ProducesResponseType(typeof(IEnumerable<Hl7MessageAuditDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<Hl7MessageAuditDto>>> GetAuditsByTenant(
        int tenantKey,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 100)
    {
        var audits = await _service.GetAuditsByTenantAsync(tenantKey, skip, take);
        return Ok(audits);
    }
}
