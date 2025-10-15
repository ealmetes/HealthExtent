-- Update UpsertEncounter_Tenant stored procedure to include new fields
-- Changes:
-- 1. Rename @AttendingDoctorId to @AttendingDoctor
-- 2. Add @PrimaryDoctor parameter
-- 3. Add @AdmittingDoctor parameter
-- 4. Add @Notes parameter (for discharge notes from OBX)
-- 5. Add @AdmitMessageId parameter
-- 6. Add @DischargeMessageId parameter

USE [he-healthcare-db];
GO

CREATE OR ALTER PROCEDURE he.UpsertEncounter_Tenant
  @TenantKey         INT,
  @HospitalCode      NVARCHAR(64),
  @VisitNumber       NVARCHAR(64),
  @PatientKey        BIGINT,
  @Admit_TS          NVARCHAR(30) = NULL,
  @Discharge_TS      NVARCHAR(30) = NULL,
  @PatientClass      NVARCHAR(10) = NULL,
  @Location          NVARCHAR(100) = NULL,
  @AttendingDoctor   NVARCHAR(200) = NULL,
  @PrimaryDoctor     NVARCHAR(200) = NULL,
  @AdmittingDoctor   NVARCHAR(200) = NULL,
  @AdmitSource       NVARCHAR(64) = NULL,
  @VisitStatus       NVARCHAR(32) = NULL,
  @Notes             NVARCHAR(MAX) = NULL,
  @AdmitMessageId    NVARCHAR(64) = NULL,
  @DischargeMessageId NVARCHAR(64) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  -- Set RLS session context
  EXEC sys.sp_set_session_context @key=N'tenant_id', @value=@TenantKey;

  -- Parse HL7 timestamps
  DECLARE @admitDt DATETIME2(3) = he.fn_ParseHl7TS(@Admit_TS);
  DECLARE @dischargeDt DATETIME2(3) = he.fn_ParseHl7TS(@Discharge_TS);

  -- Lookup HospitalKey
  DECLARE @HospKey INT = NULL;
  SELECT @HospKey = HospitalKey
  FROM he.Hospital
  WHERE TenantKey = @TenantKey AND HospitalCode = @HospitalCode;

  IF @HospKey IS NULL
  BEGIN
    RAISERROR('Hospital not found for TenantKey=%d, HospitalCode=%s', 16, 1, @TenantKey, @HospitalCode);
    RETURN;
  END

  -- Upsert encounter
  DECLARE @EncKey BIGINT;

  MERGE he.Encounter AS target
  USING (SELECT @TenantKey AS TenantKey, @HospKey AS HospitalKey, @VisitNumber AS VisitNumber) AS source
  ON (target.TenantKey = source.TenantKey
      AND target.HospitalKey = source.HospitalKey
      AND target.VisitNumber = source.VisitNumber)
  WHEN MATCHED THEN UPDATE SET
    PatientKey = @PatientKey,
    AdmitDateTime = @admitDt,
    DischargeDateTime = @dischargeDt,
    PatientClass = @PatientClass,
    Location = @Location,
    AttendingDoctor = @AttendingDoctor,
    PrimaryDoctor = @PrimaryDoctor,
    AdmittingDoctor = @AdmittingDoctor,
    AdmitSource = @AdmitSource,
    VisitStatus = @VisitStatus,
    Notes = @Notes,
    AdmitMessageId = @AdmitMessageId,
    DischargeMessageId = @DischargeMessageId,
    LastUpdatedUtc = SYSUTCDATETIME()
  WHEN NOT MATCHED THEN INSERT (
    TenantKey, HospitalKey, PatientKey, VisitNumber,
    AdmitDateTime, DischargeDateTime, PatientClass, Location,
    AttendingDoctor, PrimaryDoctor, AdmittingDoctor,
    AdmitSource, VisitStatus, Notes,
    AdmitMessageId, DischargeMessageId, LastUpdatedUtc
  )
  VALUES (
    @TenantKey, @HospKey, @PatientKey, @VisitNumber,
    @admitDt, @dischargeDt, @PatientClass, @Location,
    @AttendingDoctor, @PrimaryDoctor, @AdmittingDoctor,
    @AdmitSource, @VisitStatus, @Notes,
    @AdmitMessageId, @DischargeMessageId, SYSUTCDATETIME()
  );

  -- Get the EncounterKey
  SELECT @EncKey = EncounterKey
  FROM he.Encounter
  WHERE TenantKey = @TenantKey
    AND HospitalKey = @HospKey
    AND VisitNumber = @VisitNumber;

  -- Return the key
  SELECT @EncKey AS EncounterKey;
END
GO

PRINT 'UpsertEncounter_Tenant procedure updated successfully with new doctor fields and notes';
