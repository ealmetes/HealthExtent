using FluentValidation;
using HealthExtent.Api.DTOs;

namespace HealthExtent.Api.Validators;

public class UpsertEncounterRequestValidator : AbstractValidator<UpsertEncounterRequest>
{
    public UpsertEncounterRequestValidator()
    {
        RuleFor(x => x.TenantKey)
            .GreaterThan(0)
            .WithMessage("TenantKey must be greater than 0");

        RuleFor(x => x.HospitalCode)
            .NotEmpty()
            .WithMessage("HospitalCode is required")
            .MaximumLength(64)
            .WithMessage("HospitalCode cannot exceed 64 characters");

        RuleFor(x => x.VisitNumber)
            .NotEmpty()
            .WithMessage("VisitNumber is required")
            .MaximumLength(64)
            .WithMessage("VisitNumber cannot exceed 64 characters");

        RuleFor(x => x.PatientKey)
            .GreaterThan(0)
            .WithMessage("PatientKey must be greater than 0");

        RuleFor(x => x.PatientClass)
            .MaximumLength(16)
            .WithMessage("PatientClass cannot exceed 16 characters")
            .When(x => !string.IsNullOrEmpty(x.PatientClass));

        RuleFor(x => x.Location)
            .MaximumLength(256)
            .WithMessage("Location cannot exceed 256 characters")
            .When(x => !string.IsNullOrEmpty(x.Location));

        RuleFor(x => x.AttendingDoctor)
            .MaximumLength(256)
            .WithMessage("AttendingDoctor cannot exceed 256 characters")
            .When(x => !string.IsNullOrEmpty(x.AttendingDoctor));
    }
}
