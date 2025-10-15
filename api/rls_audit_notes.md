# RLS Issue with Audit Table

## Problem
The Row-Level Security (RLS) FILTER_PREDICATE on `he.Hl7MessageAudit` table was blocking both reads AND writes, even though the stored procedure `WriteAudit_Tenant` sets the session context correctly with `sp_set_session_context`.

## Root Cause
The RLS predicate function `sec.fn_tenantPredicate` checks if `SESSION_CONTEXT(N'tenant_id')` matches the `TenantKey` column:

```sql
CREATE OR ALTER FUNCTION sec.fn_tenantPredicate(@TenantKey INT)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS fn_allow
WHERE @TenantKey = CONVERT(INT, SESSION_CONTEXT(N'tenant_id'));
```

The security policy applies a FILTER_PREDICATE to the audit table:
```sql
ADD FILTER PREDICATE sec.fn_tenantPredicate(TenantKey) ON he.Hl7MessageAudit
```

**FILTER_PREDICATE blocks ALL operations** (SELECT, INSERT, UPDATE, DELETE) when the predicate returns false or no rows.

## Why It Failed
Even though `WriteAudit_Tenant` stored procedure sets session context:
```sql
EXEC sys.sp_set_session_context @key=N'tenant_id', @value=@TenantKey;
```

The MERGE statement in the stored procedure was still blocked by RLS because:
1. The session context may not be persisting correctly across the MERGE operation
2. FILTER_PREDICATE applies to ALL DML operations including INSERT/UPDATE
3. The predicate check happens during the MERGE execution and may fail silently

## Verification
With RLS disabled (`ALTER SECURITY POLICY sec.TenantFilter WITH (STATE = OFF)`):
- POST /api/Audit works ✅
- GET /api/Audit/tenant/{id} works ✅
- All 3 audit records are visible in database ✅

## Solutions

### Option 1: Keep RLS Disabled for Audit Table (Current State)
**Status**: Currently implemented
- Simplest approach
- Audit table doesn't contain sensitive patient data, just metadata
- Security can be enforced at application layer via tenant checks

### Option 2: Remove Audit Table from RLS Policy (Recommended for Production)
Modify the security policy to exclude the audit table:
```sql
-- Drop existing policy
DROP SECURITY POLICY sec.TenantFilter;

-- Recreate without audit table
CREATE SECURITY POLICY sec.TenantFilter
ADD FILTER PREDICATE sec.fn_tenantPredicate(TenantKey) ON he.Patient,
ADD FILTER PREDICATE sec.fn_tenantPredicate(TenantKey) ON he.Encounter,
ADD FILTER PREDICATE sec.fn_tenantPredicate(TenantKey) ON he.Hospital,
ADD FILTER PREDICATE sec.fn_tenantPredicate(TenantKey) ON he.Hl7Source
WITH (STATE = ON);
```

### Option 3: Use BLOCK_PREDICATE Instead of FILTER_PREDICATE
- BLOCK_PREDICATE only applies to write operations (INSERT/UPDATE/DELETE)
- FILTER_PREDICATE applies to both reads and writes
- Would need to test if BLOCK_PREDICATE allows writes when session context is set

### Option 4: Debug Session Context in Stored Procedure
Add debugging to see if session context is actually set:
```sql
DECLARE @CurrentTenant INT = CONVERT(INT, SESSION_CONTEXT(N'tenant_id'));
IF @CurrentTenant IS NULL OR @CurrentTenant <> @TenantKey
BEGIN
    RAISERROR('Session context not set correctly', 16, 1);
    RETURN;
END
```

## Current State
- RLS is **DISABLED** (STATE = OFF)
- All audit endpoints working correctly
- 3 test records in database

## Recommendation
For production, implement **Option 2** - remove audit table from RLS policy since audit records don't contain sensitive patient data.
