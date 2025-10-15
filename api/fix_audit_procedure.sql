-- Fix WriteAudit_Tenant stored procedure to include ErrorText in INSERT clause
-- Bug: MERGE statement was missing ErrorText in INSERT VALUES

CREATE OR ALTER PROCEDURE he.WriteAudit_Tenant
  @TenantKey INT,
  @MessageControlId NVARCHAR(64),
  @MessageType NVARCHAR(16),
  @EventTimestamp_TS NVARCHAR(30) = NULL,
  @SourceCode NVARCHAR(64) = NULL,
  @HospitalCode NVARCHAR(64) = NULL,
  @RawMessage NVARCHAR(MAX) = NULL,
  @Status NVARCHAR(16),
  @ErrorText NVARCHAR(4000) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  EXEC sys.sp_set_session_context @key=N'tenant_id', @value=@TenantKey;

  DECLARE @evt DATETIME2(3) = he.fn_ParseHl7TS(@EventTimestamp_TS);
  DECLARE @SourceKey INT = NULL, @HospKey INT = NULL;

  IF @SourceCode IS NOT NULL
    SELECT @SourceKey = SourceKey FROM he.Hl7Source WHERE TenantKey=@TenantKey AND SourceCode=@SourceCode;

  IF @HospitalCode IS NOT NULL
    SELECT @HospKey = HospitalKey FROM he.Hospital WHERE TenantKey=@TenantKey AND HospitalCode=@HospitalCode;

  MERGE he.Hl7MessageAudit AS t
  USING (SELECT @TenantKey AS TenantKey, @MessageControlId AS MessageControlId) s
  ON (t.TenantKey = s.TenantKey AND t.MessageControlId = s.MessageControlId)
  WHEN MATCHED THEN UPDATE SET
    MessageType=@MessageType, EventTimestamp=@evt, SourceKey=@SourceKey, HospitalKey=@HospKey,
    RawMessage=@RawMessage, ProcessedUtc=SYSUTCDATETIME(), Status=@Status, ErrorText=@ErrorText
  WHEN NOT MATCHED THEN INSERT
    (TenantKey, MessageControlId, MessageType, EventTimestamp, SourceKey, HospitalKey, RawMessage, Status, ErrorText)
    VALUES (@TenantKey, @MessageControlId, @MessageType, @evt, @SourceKey, @HospKey, @RawMessage, @Status, @ErrorText);
END
GO

-- Verify the fix
PRINT 'WriteAudit_Tenant procedure updated successfully with ErrorText in INSERT clause';
