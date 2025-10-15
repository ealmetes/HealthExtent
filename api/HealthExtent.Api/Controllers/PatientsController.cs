using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HealthExtent.Api.DTOs;
using HealthExtent.Api.Services;
using FluentValidation;

namespace HealthExtent.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PatientsController : ControllerBase
{
    private readonly IHealthExtentService _service;
    private readonly ILogger<PatientsController> _logger;
    private readonly ITenantProvider _tenantProvider;
    private readonly IValidator<UpsertPatientRequest> _validator;

    public PatientsController(
        IHealthExtentService service,
        ILogger<PatientsController> logger,
        ITenantProvider tenantProvider,
        IValidator<UpsertPatientRequest> validator)
    {
        _service = service;
        _logger = logger;
        _tenantProvider = tenantProvider;
        _validator = validator;
    }

    /// <summary>
    /// Upsert (create or update) a patient
    /// </summary>
    [HttpPost("upsert")]
    [ProducesResponseType(typeof(UpsertPatientResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UpsertPatientResponse>> UpsertPatient([FromBody] UpsertPatientRequest request)
    {
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        var result = await _service.UpsertPatientAsync(request);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Get patient by key (uses X-Tenant-Id header or optional tenantKey query parameter)
    /// </summary>
    [HttpGet("{patientKey}")]
    [ProducesResponseType(typeof(PatientDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PatientDto>> GetPatient(long patientKey, [FromQuery] int? tenantKey = null)
    {
        // Use query parameter if provided, otherwise get from header via tenant provider
        int resolvedTenantKey = tenantKey ?? _tenantProvider.GetTenantId() ?? 0;

        if (resolvedTenantKey == 0)
            return BadRequest(new { error = "Tenant not specified. Provide X-Tenant-Id header or tenantKey query parameter." });

        var patient = await _service.GetPatientByKeyAsync(patientKey, resolvedTenantKey);

        if (patient == null)
            return NotFound();

        return Ok(patient);
    }

    /// <summary>
    /// Get all patients for a tenant with pagination
    /// </summary>
    [HttpGet("tenant/{tenantKey}")]
    [ProducesResponseType(typeof(IEnumerable<PatientDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PatientDto>>> GetPatientsByTenant(
        int tenantKey,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 100)
    {
        var patients = await _service.GetPatientsByTenantAsync(tenantKey, skip, take);
        return Ok(patients);
    }
}
