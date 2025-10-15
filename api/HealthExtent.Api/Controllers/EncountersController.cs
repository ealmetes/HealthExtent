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
public class EncountersController : ControllerBase
{
    private readonly IHealthExtentService _service;
    private readonly ILogger<EncountersController> _logger;
    private readonly IValidator<UpsertEncounterRequest> _validator;

    public EncountersController(
        IHealthExtentService service,
        ILogger<EncountersController> logger,
        IValidator<UpsertEncounterRequest> validator)
    {
        _service = service;
        _logger = logger;
        _validator = validator;
    }

    /// <summary>
    /// Upsert (create or update) an encounter
    /// </summary>
    [HttpPost("upsert")]
    [ProducesResponseType(typeof(UpsertEncounterResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UpsertEncounterResponse>> UpsertEncounter([FromBody] UpsertEncounterRequest request)
    {
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        var result = await _service.UpsertEncounterAsync(request);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Get encounter by key
    /// </summary>
    [HttpGet("{encounterKey}")]
    [ProducesResponseType(typeof(EncounterDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EncounterDto>> GetEncounter(long encounterKey, [FromQuery] int tenantKey)
    {
        var encounter = await _service.GetEncounterByKeyAsync(encounterKey, tenantKey);

        if (encounter == null)
            return NotFound();

        return Ok(encounter);
    }

    /// <summary>
    /// Get all encounters for a patient
    /// </summary>
    [HttpGet("patient/{patientKey}")]
    [ProducesResponseType(typeof(IEnumerable<EncounterDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EncounterDto>>> GetEncountersByPatient(
        long patientKey,
        [FromQuery] int tenantKey)
    {
        var encounters = await _service.GetEncountersByPatientAsync(patientKey, tenantKey);
        return Ok(encounters);
    }

    /// <summary>
    /// Get all encounters for a tenant with pagination
    /// </summary>
    [HttpGet("tenant/{tenantKey}")]
    [ProducesResponseType(typeof(IEnumerable<EncounterDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EncounterDto>>> GetEncountersByTenant(
        int tenantKey,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 100)
    {
        var encounters = await _service.GetEncountersByTenantAsync(tenantKey, skip, take);
        return Ok(encounters);
    }
}
