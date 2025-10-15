using Microsoft.AspNetCore.Mvc;
using HealthExtent.Api.Models;
using HealthExtent.Api.Services;

namespace HealthExtent.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class HospitalsController : ControllerBase
{
    private readonly IHealthExtentService _service;
    private readonly ILogger<HospitalsController> _logger;

    public HospitalsController(IHealthExtentService service, ILogger<HospitalsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all hospitals for a tenant
    /// </summary>
    [HttpGet("tenant/{tenantKey}")]
    [ProducesResponseType(typeof(IEnumerable<Hospital>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<Hospital>>> GetHospitalsByTenant(int tenantKey)
    {
        var hospitals = await _service.GetHospitalsByTenantAsync(tenantKey);
        return Ok(hospitals);
    }
}
