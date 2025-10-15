# Health Extent API

Production-ready ASP.NET Core 8 API for HL7 healthcare data management with multi-tenant support and Azure SQL backend.

## Features

- **Multi-Tenant Architecture**: Secure tenant isolation using Row-Level Security (RLS)
- **HL7 Message Processing**: Parse and store ADT (Admit/Discharge/Transfer) messages
- **Patient Management**: CRUD operations for patient demographics
- **Encounter Tracking**: Hospital visit management with detailed doctor assignments
- **Audit Trail**: Complete message audit history with idempotency support
- **RESTful API**: Clean REST endpoints with Swagger documentation
- **Azure SQL Integration**: Optimized stored procedures with connection resilience

## Tech Stack

- **.NET 8.0** - Latest LTS framework
- **Entity Framework Core 8** - ORM with SQL Server provider
- **Azure SQL Database** - Cloud-hosted relational database
- **Swagger/OpenAPI** - Interactive API documentation
- **Multi-tenant RLS** - Database-level security

## Project Structure

```
healthextent/
├── api/
│   ├── HealthExtent.Api/
│   │   ├── Controllers/       # API endpoints
│   │   ├── Models/            # EF Core entities
│   │   ├── DTOs/              # Data transfer objects
│   │   ├── Services/          # Business logic layer
│   │   ├── Data/              # DbContext
│   │   └── Middleware/        # Tenant provider
│   ├── alter_encounter_table.sql
│   ├── update_upsert_encounter_procedure.sql
│   └── fix_audit_procedure.sql
└── README.md
```

## Database Schema

### Core Tables
- **Tenant**: Multi-tenant organizations
- **Hospital**: Healthcare facilities per tenant
- **Hl7Source**: Message sources (interfaces, systems)
- **Patient**: Patient demographics with MRN
- **Encounter**: Hospital visits with doctor assignments
- **Hl7MessageAudit**: Message processing audit trail

### Key Features
- Natural key constraints for idempotency
- Computed columns for normalized searching
- RLS policies for tenant isolation
- Stored procedures for complex operations

## Getting Started

### Prerequisites
- .NET 8.0 SDK
- Azure SQL Database
- SQL Server Management Studio (optional)

### Configuration

1. Copy the appsettings template:
```bash
cp api/HealthExtent.Api/appsettings.Development.json.template api/HealthExtent.Api/appsettings.json
```

2. Update connection string in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "HealthExtentDb": "Server=tcp:YOUR-SERVER.database.windows.net,1433;Database=YOUR-DB;Authentication=SqlPassword;User ID=YOUR-USER;Password=YOUR-PASSWORD;Encrypt=True;TrustServerCertificate=True;Connection Timeout=30;"
  }
}
```

3. Run database migrations (if using EF migrations) or execute the schema SQL scripts.

### Running the API

```bash
cd api/HealthExtent.Api
dotnet restore
dotnet build
dotnet run
```

The API will be available at:
- HTTP: http://localhost:5000
- HTTPS: https://localhost:5001
- Swagger UI: https://localhost:5001

## API Endpoints

### Tenants
- `GET /api/Tenants` - List all tenants

### Hospitals
- `GET /api/Hospitals/tenant/{tenantKey}` - Get hospitals by tenant

### Patients
- `POST /api/Patients/upsert` - Create/update patient
- `GET /api/Patients/{patientKey}` - Get patient (supports X-Tenant-Id header)
- `GET /api/Patients/tenant/{tenantKey}` - List patients

### Encounters
- `POST /api/Encounters/upsert` - Create/update encounter
- `GET /api/Encounters/{encounterKey}` - Get encounter
- `GET /api/Encounters/patient/{patientKey}` - Get patient encounters

### Audit
- `POST /api/Audit` - Write audit record
- `GET /api/Audit/tenant/{tenantKey}` - Get audit history

## Multi-Tenant Support

The API uses the `X-Tenant-Id` header for tenant identification:

```bash
curl -H "X-Tenant-Id: 1" https://localhost:5001/api/Patients/4
```

Alternatively, use the `tenantKey` query parameter:

```bash
curl https://localhost:5001/api/Patients/4?tenantKey=1
```

## Encounter Fields

The Encounter entity tracks detailed visit information:

### Doctor Assignments
- **AttendingDoctor**: Primary physician responsible for care
- **PrimaryDoctor**: Patient's primary care physician
- **AdmittingDoctor**: Physician who admitted the patient

### Message Tracking
- **AdmitMessageId**: HL7 message control ID for admission
- **DischargeMessageId**: HL7 message control ID for discharge
- **Notes**: Discharge notes from OBX segments

## Security Notes

- ⚠️ **Never commit** `appsettings.json` with real credentials
- ⚠️ Use Azure Key Vault for production secrets
- ⚠️ RLS is currently disabled for Hl7MessageAudit table (see `rls_audit_notes.md`)
- ✅ All endpoints validate tenant context
- ✅ SQL injection protected via parameterized queries

## Development

### Adding a New Entity

1. Create model in `Models/`
2. Add DbSet to `HealthExtentDbContext`
3. Create DTOs in `DTOs/`
4. Implement service methods in `Services/`
5. Add controller endpoints
6. Create database migrations

### Database Updates

After schema changes, update stored procedures:
```bash
sqlcmd -S your-server.database.windows.net -d your-db -U username -P password -i script.sql
```

## Production Deployment

1. Set up Azure SQL Database
2. Configure connection strings via Azure App Configuration or Key Vault
3. Enable HTTPS enforcement
4. Configure CORS for allowed origins
5. Set up Application Insights for monitoring
6. Review and enable RLS policies as needed

## License

[Specify your license]

## Contributing

[Specify contribution guidelines]
