-- Alter Encounter table to add new doctor fields and notes
-- Changes:
-- 1. Rename AttendingDoctorId to AttendingDoctor (change from NVARCHAR(64) to NVARCHAR(200))
-- 2. Add PrimaryDoctor NVARCHAR(200)
-- 3. Add AdmittingDoctor NVARCHAR(200)
-- 4. Add Notes NVARCHAR(MAX) for discharge notes from OBX section
-- 5. Add AdmitMessageId NVARCHAR(64)
-- 6. Add DischargeMessageId NVARCHAR(64)

USE [he-healthcare-db];
GO

-- Step 1: Rename AttendingDoctorId column to AttendingDoctor
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[he].[Encounter]') AND name = 'AttendingDoctorId')
BEGIN
    EXEC sp_rename 'he.Encounter.AttendingDoctorId', 'AttendingDoctor', 'COLUMN';
    PRINT 'Renamed AttendingDoctorId to AttendingDoctor';
END
GO

-- Step 2: Increase AttendingDoctor length if needed (from 64 to 200)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[he].[Encounter]') AND name = 'AttendingDoctor')
BEGIN
    ALTER TABLE he.Encounter ALTER COLUMN AttendingDoctor NVARCHAR(200) NULL;
    PRINT 'Updated AttendingDoctor column to NVARCHAR(200)';
END
GO

-- Step 3: Add PrimaryDoctor column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[he].[Encounter]') AND name = 'PrimaryDoctor')
BEGIN
    ALTER TABLE he.Encounter ADD PrimaryDoctor NVARCHAR(200) NULL;
    PRINT 'Added PrimaryDoctor column';
END
GO

-- Step 4: Add AdmittingDoctor column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[he].[Encounter]') AND name = 'AdmittingDoctor')
BEGIN
    ALTER TABLE he.Encounter ADD AdmittingDoctor NVARCHAR(200) NULL;
    PRINT 'Added AdmittingDoctor column';
END
GO

-- Step 5: Add Notes column (for discharge notes from OBX section)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[he].[Encounter]') AND name = 'Notes')
BEGIN
    ALTER TABLE he.Encounter ADD Notes NVARCHAR(MAX) NULL;
    PRINT 'Added Notes column';
END
GO

-- Step 6: Add AdmitMessageId column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[he].[Encounter]') AND name = 'AdmitMessageId')
BEGIN
    ALTER TABLE he.Encounter ADD AdmitMessageId NVARCHAR(64) NULL;
    PRINT 'Added AdmitMessageId column';
END
GO

-- Step 7: Add DischargeMessageId column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[he].[Encounter]') AND name = 'DischargeMessageId')
BEGIN
    ALTER TABLE he.Encounter ADD DischargeMessageId NVARCHAR(64) NULL;
    PRINT 'Added DischargeMessageId column';
END
GO

-- Verify the changes
SELECT
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM sys.columns c
JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID(N'[he].[Encounter]')
ORDER BY c.column_id;
GO

PRINT 'Encounter table alterations completed successfully';
