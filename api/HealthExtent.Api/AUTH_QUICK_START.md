# 🔐 Authentication Quick Start Guide

## Step 1: Generate a Token

### Using curl:
```bash
curl -X POST http://localhost:5000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username": "test-user", "tenantId": 1, "tenantCode": "TENANT001"}'
```

### Using PowerShell:
```powershell
$body = @{
    username = "test-user"
    tenantId = 1
    tenantCode = "TENANT001"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/token" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

### Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires": "2025-10-16T10:30:00Z",
  "tenantId": 1,
  "username": "test-user"
}
```

---

## Step 2: Use the Token

Copy the `token` value from the response and use it in the `Authorization` header:

### Using curl:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:5000/api/patients/upsert \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 1" \
  -d '{
    "tenantKey": 1,
    "patientIdExternal": "PAT001",
    "assigningAuthority": "HOSPITAL_A",
    "familyName": "Doe",
    "givenName": "John"
  }'
```

### Using PowerShell:
```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "X-Tenant-Id" = "1"
}

$body = @{
    tenantKey = 1
    patientIdExternal = "PAT001"
    assigningAuthority = "HOSPITAL_A"
    familyName = "Doe"
    givenName = "John"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/patients/upsert" `
  -Method POST `
  -Headers $headers `
  -Body $body
```

### Using Postman:
1. **Create a new request:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/token`
   - Body (JSON):
     ```json
     {
       "username": "test-user",
       "tenantId": 1,
       "tenantCode": "TENANT001"
     }
     ```
   - Click **Send**

2. **Copy the token** from the response

3. **Create another request:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/patients/upsert`
   - Headers:
     - `Authorization`: `Bearer YOUR_TOKEN_HERE`
     - `Content-Type`: `application/json`
     - `X-Tenant-Id`: `1`
   - Body: Your patient data

---

## Step 3: Validate Your Token

To check if your token is valid:

```bash
curl http://localhost:5000/api/auth/validate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "valid": true,
  "username": "test-user",
  "tenantId": "1",
  "tenantCode": "TENANT001",
  "claims": [
    { "type": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name", "value": "test-user" },
    { "type": "tenant_id", "value": "1" },
    { "type": "tenant_code", "value": "TENANT001" }
  ]
}
```

---

## 🎯 Complete Example Workflow

### 1. Start the API
```bash
cd C:\Users\Edwin Almetes\Projects\healthextent\api\HealthExtent.Api
dotnet run
```

### 2. Generate Token
```bash
curl -X POST http://localhost:5000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"api-user","tenantId":1}'
```

### 3. Save Token to Variable
```bash
# Bash/Linux/Mac
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"api-user","tenantId":1}' | jq -r '.token')

# PowerShell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/token" -Method POST -Body '{"username":"api-user","tenantId":1}' -ContentType "application/json"
$TOKEN = $response.token
```

### 4. Call Protected Endpoints
```bash
# Bash
curl http://localhost:5000/api/patients/tenant/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: 1"

# PowerShell
$headers = @{"Authorization"="Bearer $TOKEN"; "X-Tenant-Id"="1"}
Invoke-RestMethod -Uri "http://localhost:5000/api/patients/tenant/1" -Headers $headers
```

---

## 📌 Important Notes

### Token Expiration
- **Default:** Tokens expire after 24 hours
- **Check expiry:** Look at the `expires` field in the token response
- **Renew:** Simply call `/api/auth/token` again to get a new token

### Multi-Tenant Support
- Each token is tied to a specific `tenantId`
- The `X-Tenant-Id` header should match the `tenantId` in the token
- Use different tokens for different tenants

### Security
- ⚠️ This endpoint is for **development/testing only**
- For production, use a proper identity provider (Azure AD, Auth0, etc.)
- Never commit tokens to source control
- Tokens are stored in memory only (no database persistence)

---

## 🔧 Troubleshooting

### Error: "JWT authentication is not configured"
**Solution:** Ensure JWT secret key is set in User Secrets:
```bash
dotnet user-secrets set "Jwt:SecretKey" "YourSecretKeyHere" --project "C:\Users\Edwin Almetes\Projects\healthextent\api\HealthExtent.Api"
```

### Error: 401 Unauthorized
**Causes:**
1. Token is missing or malformed
2. Token has expired
3. Token signature doesn't match

**Solution:** Generate a fresh token

### Error: 403 Forbidden
**Cause:** CORS policy blocking the request
**Solution:** Ensure your client URL is in the CORS AllowedOrigins

---

## 🌐 Production Deployment

When deploying to production:

1. **Remove or protect the token endpoint:**
   - Option A: Delete `AuthController.cs`
   - Option B: Add authentication to the token endpoint itself
   - Option C: Only enable in Development environment

2. **Use environment variables:**
```bash
# Set in your hosting environment
Jwt__SecretKey=<production-secret-key>
Jwt__Issuer=https://your-production-domain.com
Jwt__Audience=https://your-production-domain.com
```

3. **Integrate with real identity provider** (recommended)

---

## 📖 API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/token` | POST | No | Generate JWT token |
| `/api/auth/validate` | GET | Yes | Validate current token |
| `/api/patients/*` | * | Yes | Patient operations |
| `/api/encounters/*` | * | Yes | Encounter operations |
| `/api/audit/*` | * | Yes | Audit operations |
| `/api/hospitals/*` | * | Yes | Hospital operations |
| `/health` | GET | No | Health check |

---

Need help? Check the full guide at `PRODUCTION_ACCESS_GUIDE.md`
