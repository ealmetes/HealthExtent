using Microsoft.EntityFrameworkCore;
using HealthExtent.Api.Data;
using HealthExtent.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure URLs - Bind to all interfaces to allow Mirth Connect access
builder.WebHost.UseUrls("http://0.0.0.0:5000", "https://0.0.0.0:5001");

// Configure Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// Add services to the container
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpLogging(options => {});

// Register tenant provider first
builder.Services.AddScoped<ITenantProvider, TenantProvider>();

// Database context
var connectionString = builder.Configuration.GetConnectionString("HealthExtentDb");
builder.Services.AddDbContext<HealthExtentDbContext>(options =>
{
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
        sqlOptions.CommandTimeout(60);
    });
});

// Register services
builder.Services.AddScoped<IHealthExtentService, HealthExtentService>();

// CORS
builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? new[] { "http://localhost:3000" };

    options.AddPolicy("ApiCorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null; // Keep original casing
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// API Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Health Extent API",
        Version = "v1",
        Description = "Production-ready API for HL7 healthcare data management with multi-tenant support",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Health Extent Team"
        }
    });

    // Add XML comments if available
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }

    // Add tenant header parameter to all operations
    c.OperationFilter<TenantHeaderOperationFilter>();
});

// Health checks
builder.Services.AddHealthChecks();
    //.AddDbContextCheck<HealthExtentDbContext>();  // Disabled due to EF Core version conflict

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseHttpLogging();

// Swagger (only in development environment)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Health Extent API v1");
        c.RoutePrefix = string.Empty; // Serve Swagger UI at root
    });
}

// CORS
app.UseCors("ApiCorsPolicy");

// Security headers
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    await next();
});

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

// Health check endpoint
app.MapHealthChecks("/health");

app.MapControllers();

var logger = app.Services.GetRequiredService<ILogger<Program>>();

try
{
    logger.LogInformation("Starting Health Extent API on http://localhost:5000 and https://localhost:5001");
    app.Run();
    logger.LogInformation("Application stopped gracefully");
}
catch (Exception ex)
{
    logger.LogCritical(ex, "Application terminated unexpectedly");
    Console.WriteLine($"FATAL ERROR: {ex}");
    throw;
}
