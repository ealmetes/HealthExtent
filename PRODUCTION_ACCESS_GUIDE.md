# Production API Access Guide

## 🔐 Current Security Requirements

Your API now requires **JWT Bearer Token authentication** for all endpoints. Here's how to access it:

---

## Option 1: Temporarily Disable Authentication (Testing Only)

### ⚠️ WARNING: Only for testing/development purposes!

If you need to quickly test the API without authentication, you can temporarily allow anonymous access:

**Modify each controller by adding `[AllowAnonymous]` to specific endpoints:**

```csharp
[Authorize]
[ApiController]
public class PatientsController : ControllerBase
{
    [AllowAnonymous]  // Add this temporarily for testing
    [HttpPost("upsert")]
    public async Task<ActionResult<UpsertPatientResponse>> UpsertPatient(...)
    {
        // ...
    }
}
```

**Or temporarily disable authorization globally in Program.cs:**
```csharp
// Comment out these lines in Program.cs
// app.UseAuthentication();
// app.UseAuthorization();
```

---

## Option 2: Use JWT Token Authentication (Recommended)

### Step 1: Generate a JWT Token

You have two options:

#### **A. Create a Token Generation Endpoint (Quick)**

Add this controller to generate test tokens:

**File: `Controllers/AuthController.cs`**
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HealthExtent.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public AuthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [AllowAnonymous]
    [HttpPost("token")]
    public IActionResult GenerateToken([FromBody] TokenRequest request)
    {
        var jwtSecretKey = _configuration["Jwt:SecretKey"];
        var jwtIssuer = _configuration["Jwt:Issuer"];
        var jwtAudience = _configuration["Jwt:Audience"];

        if (string.IsNullOrEmpty(jwtSecretKey) || jwtSecretKey == "REPLACE_WITH_SECRET_KEY_FROM_USER_SECRETS")
        {
            return BadRequest(new { error = "JWT not configured" });
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, request.Username),
            new Claim(ClaimTypes.NameIdentifier, request.Username),
            new Claim("tenant_id", request.TenantId.ToString()),
            new Claim("tenant_code", request.TenantCode ?? "")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new
        {
            token = tokenString,
            expires = token.ValidTo,
            tenant_id = request.TenantId,
            username = request.Username
        });
    }
}

public class TokenRequest
{
    public string Username { get; set; } = "api-user";
    public int TenantId { get; set; } = 1;
    public string? TenantCode { get; set; }
}
```

#### **B. Use External JWT Token Generator**

Visit: https://jwt.io/

**Payload Example:**
```json
{
  "sub": "api-user",
  "name": "API User",
  "tenant_id": "1",
  "tenant_code": "TENANT001",
  "exp": 1735689600
}
```

**Secret:** Use the same key from your User Secrets (retrieve it with `dotnet user-secrets list`)

---

### Step 2: Access API with Token

#### **Using Postman:**
1. Set Method: `POST`
2. URL: `https://your-api-url.com/api/patients/upsert`
3. Headers:
   ```
   Authorization: Bearer <your-jwt-token>
   Content-Type: application/json
   X-Tenant-Id: 1
   ```
4. Body (JSON):
   ```json
   {
     "tenantKey": 1,
     "patientIdExternal": "PAT001",
     "assigningAuthority": "HOSPITAL_A",
     "familyName": "Doe",
     "givenName": "John"
   }
   ```

#### **Using curl:**
```bash
curl -X POST https://your-api-url.com/api/patients/upsert \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
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

#### **Using C# HttpClient:**
```csharp
using System.Net.Http.Headers;

var client = new HttpClient();
client.BaseAddress = new Uri("https://your-api-url.com");
client.DefaultRequestHeaders.Authorization =
    new AuthenticationHeaderValue("Bearer", "YOUR_JWT_TOKEN");
client.DefaultRequestHeaders.Add("X-Tenant-Id", "1");

var content = new StringContent(
    JsonSerializer.Serialize(new {
        tenantKey = 1,
        patientIdExternal = "PAT001",
        assigningAuthority = "HOSPITAL_A",
        familyName = "Doe",
        givenName = "John"
    }),
    Encoding.UTF8,
    "application/json"
);

var response = await client.PostAsync("/api/patients/upsert", content);
var result = await response.Content.ReadAsStringAsync();
```

#### **Using JavaScript (Fetch):**
```javascript
const token = 'YOUR_JWT_TOKEN';
const response = await fetch('https://your-api-url.com/api/patients/upsert', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Tenant-Id': '1'
  },
  body: JSON.stringify({
    tenantKey: 1,
    patientIdExternal: 'PAT001',
    assigningAuthority: 'HOSPITAL_A',
    familyName: 'Doe',
    givenName: 'John'
  })
});

const data = await response.json();
console.log(data);
```

---

## Option 3: Integrate with Identity Provider

### For Production, integrate with:

#### **Azure AD / Entra ID:**
```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));
```

#### **Auth0:**
```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://YOUR_DOMAIN.auth0.com/";
        options.Audience = "YOUR_API_IDENTIFIER";
    });
```

#### **IdentityServer:**
```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://your-identityserver.com";
        options.Audience = "health-extent-api";
    });
```

---

## 🌐 Production Deployment Checklist

### 1. **Configure Environment Variables**

Set these in your hosting environment (Azure App Service, IIS, Docker, etc.):

```bash
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__HealthExtentDb=<your-azure-sql-connection-string>
Jwt__SecretKey=<your-secure-jwt-secret-key>
Jwt__Issuer=https://healthextent.com
Jwt__Audience=https://healthextent.com
```

### 2. **Update CORS Origins**

Edit `appsettings.Production.json`:
```json
{
  "Cors": {
    "AllowedOrigins": [
      "https://your-actual-frontend.com",
      "https://mirth-server-domain.com"
    ]
  }
}
```

### 3. **SSL/TLS Certificate**

Ensure HTTPS is properly configured:
- Azure App Service: Automatically handled
- IIS: Install SSL certificate and bind to site
- Docker/Kubernetes: Configure ingress/load balancer

### 4. **API Base URLs**

Your API will be accessible at:
- **Azure App Service:** `https://your-app-name.azurewebsites.net`
- **Custom Domain:** `https://api.healthextent.com`
- **IIS:** `https://your-server.com/healthextent-api`

### 5. **Health Check**

Test the health endpoint (does NOT require auth):
```bash
curl https://your-api-url.com/health
```

Expected response: `Healthy`

---

## 🚀 Quick Start for Testing

### If you want to test RIGHT NOW without JWT setup:

1. **Comment out authentication in Program.cs:**
```csharp
// app.UseAuthentication();  // Comment this out
app.UseAuthorization();
```

2. **Redeploy or restart the API**

3. **Test immediately:**
```bash
curl -X POST http://localhost:5000/api/patients/upsert \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 1" \
  -d '{
    "tenantKey": 1,
    "patientIdExternal": "TEST001",
    "familyName": "Test",
    "givenName": "User"
  }'
```

4. **Re-enable authentication before production deployment!**

---

## 📞 Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Cause:** Missing or invalid JWT token
**Solution:** Ensure `Authorization: Bearer <token>` header is present and token is valid

### Issue 2: 403 Forbidden
**Cause:** CORS policy blocking request
**Solution:** Add your client domain to `Cors:AllowedOrigins` in appsettings

### Issue 3: Swagger Not Loading
**Expected:** Swagger is disabled in Production (only available in Development)
**Solution:** Run locally with `ASPNETCORE_ENVIRONMENT=Development`

### Issue 4: Connection String Not Found
**Cause:** Environment variable not set
**Solution:** Set `ConnectionStrings__HealthExtentDb` in hosting environment

---

## 🔑 Retrieve Your JWT Secret Key

To get the secret key stored in User Secrets:

```bash
dotnet user-secrets list --project "C:\Users\Edwin Almetes\Projects\healthextent\api\HealthExtent.Api"
```

Copy the `Jwt:SecretKey` value for token generation.

---

## 📖 Additional Resources

- **JWT Token Decoder:** https://jwt.io/
- **Postman Collections:** Create a collection with pre-configured auth
- **Swagger (Dev):** http://localhost:5000 (when running in Development mode)

---

## Need Help?

Let me know which authentication method you'd like to use:
1. Token generation endpoint (quick setup)
2. External identity provider (Auth0, Azure AD)
3. Custom authentication service

I can help implement any of these!
