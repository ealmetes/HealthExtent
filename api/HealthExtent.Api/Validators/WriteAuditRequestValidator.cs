using FluentValidation;
using HealthExtent.Api.DTOs;

namespace HealthExtent.Api.Validators;

public class WriteAuditRequestValidator : AbstractValidator<WriteAuditRequest>
{
    public WriteAuditRequestValidator()
    {
        RuleFor(x => x.TenantKey)
            .GreaterThan(0)
            .WithMessage("TenantKey must be greater than 0");

        RuleFor(x => x.MessageControlId)
            .NotEmpty()
            .WithMessage("MessageControlId is required")
            .MaximumLength(256)
            .WithMessage("MessageControlId cannot exceed 256 characters");

        RuleFor(x => x.MessageType)
            .NotEmpty()
            .WithMessage("MessageType is required")
            .MaximumLength(16)
            .WithMessage("MessageType cannot exceed 16 characters");

        RuleFor(x => x.Status)
            .NotEmpty()
            .WithMessage("Status is required")
            .MaximumLength(32)
            .WithMessage("Status cannot exceed 32 characters");

        RuleFor(x => x.SourceCode)
            .MaximumLength(64)
            .WithMessage("SourceCode cannot exceed 64 characters")
            .When(x => !string.IsNullOrEmpty(x.SourceCode));

        RuleFor(x => x.HospitalCode)
            .MaximumLength(64)
            .WithMessage("HospitalCode cannot exceed 64 characters")
            .When(x => !string.IsNullOrEmpty(x.HospitalCode));
    }
}
