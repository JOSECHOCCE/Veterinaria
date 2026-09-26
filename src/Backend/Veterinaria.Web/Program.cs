using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Data;
using Veterinaria.Infrastructure.Persistence;
using Veterinaria.Infrastructure.Repositories;
using Veterinaria.Web.Hubs;
using Veterinaria.Web.Services;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.HttpOverrides;
// Habilitar compatibilidad de timestamps para PostgreSQL / Npgsql
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Veterinaria API", Version = "v1" });

    // Configurar Swagger para que acepte un Token de Autenticación (JWT)
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "Autorización JWT usando el esquema Bearer. \r\n\r\n Escribe 'Bearer' [espacio] y luego tu token en el campo de texto.\r\n\r\nEjemplo: \"Bearer 12345abcdef\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header
            },
            new List<string>()
        }
    });
});

// Configurar CORS para el frontend en React
var rawOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                 ?? new string[] { "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000" };

var allowedOrigins = rawOrigins
    .SelectMany(o => o.StartsWith("http", StringComparison.OrdinalIgnoreCase) 
        ? new[] { o } 
        : new[] { $"https://{o}", $"http://{o}" })
    .Distinct()
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
               {
                   if (string.IsNullOrWhiteSpace(origin)) return false;
                   try
                   {
                       var uri = new Uri(origin);
                       var host = uri.Host;
                       if (host.Equals("localhost", StringComparison.OrdinalIgnoreCase) || host == "127.0.0.1")
                           return true;
                       if (host.EndsWith(".onrender.com", StringComparison.OrdinalIgnoreCase))
                           return true;
                       return allowedOrigins.Any(o => o.Contains(host, StringComparison.OrdinalIgnoreCase));
                   }
                   catch
                   {
                       return false;
                   }
               })
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

// Configurar SignalR para notificaciones en tiempo real
builder.Services.AddSignalR();

// Configurar Entity Framework Core con PostgreSQL / Supabase
var rawConnectionString = builder.Configuration.GetConnectionString("VeterinariaDb")
    ?? builder.Configuration["DATABASE_URL"]
    ?? Environment.GetEnvironmentVariable("DATABASE_URL");

var connectionString = ParsePostgreSqlConnectionString(rawConnectionString);

builder.Services.AddDbContext<VeterinariaDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(connectionString))
    {
        options.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
        });
    }
});

// Configurar ASP.NET Core Identity
builder.Services.AddDefaultIdentity<ApplicationUser>(options =>
{
    // Configuración de contraseña
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    options.Password.RequiredUniqueChars = 1;

    // Configuración de bloqueo
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // Configuración de usuario
    options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
    options.User.RequireUniqueEmail = true;

    // Configuración de sign in
    options.SignIn.RequireConfirmedAccount = false;
    options.SignIn.RequireConfirmedEmail = false;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<VeterinariaDbContext>()
.AddDefaultTokenProviders();

// Obtener clave JWT desde configuración o variable de entorno (Jwt__Key)
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    if (builder.Environment.IsDevelopment())
    {
        jwtKey = "DevOnlySecretKey_ForLocalDevelopment_MinLength32Chars!";
    }
    else
    {
        throw new InvalidOperationException("La clave secreta JWT ('Jwt:Key' o la variable de entorno 'Jwt__Key') no ha sido configurada.");
    }
}

// Configurar Autenticación JWT en lugar de cookies
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };

    // Permitir que SignalR autentique usando access_token del query string
    // (los WebSockets no pueden enviar el header Authorization personalizado)
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) &&
                path.StartsWithSegments("/notificacionHub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Configurar AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Configurar Unit of Work
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Configurar HttpContextAccessor para obtener el usuario autenticado en servicios core
builder.Services.AddHttpContextAccessor();

// Configurar Servicios de Aplicación (Arquitectura Cebolla)
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IAuditoriaService, Veterinaria.Application.Services.AuditoriaService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IAnonymizationService, Veterinaria.Application.Services.AnonymizationService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IClienteService, Veterinaria.Application.Services.ClienteService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IMascotaService, Veterinaria.Application.Services.MascotaService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IServicioService, Veterinaria.Application.Services.ServicioService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IVeterinarioService, Veterinaria.Application.Services.VeterinarioService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IDashboardService, Veterinaria.Application.Services.DashboardService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IPagoService, Veterinaria.Application.Services.PagoService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.ICitaService, Veterinaria.Application.Services.CitaService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IAgendaService, Veterinaria.Application.Services.AgendaService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IHistorialClinicoService, Veterinaria.Application.Services.HistorialClinicoService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.ITriageService, Veterinaria.Application.Services.TriageService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IConsentimientoService, Veterinaria.Application.Services.ConsentimientoService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.INotificacionService, Veterinaria.Application.Services.NotificacionService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IPostAtencionService, Veterinaria.Application.Services.PostAtencionService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IRealTimeNotificationService, Veterinaria.Web.Services.RealTimeNotificationService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IProductoService, Veterinaria.Application.Services.ProductoService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IVentaService, Veterinaria.Application.Services.VentaService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IAuthService, Veterinaria.Application.Services.AuthService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IUsuarioService, Veterinaria.Application.Services.UsuarioService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.ICorreoService, Veterinaria.Web.Services.CorreoService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IPortalClienteService, Veterinaria.Application.Services.PortalClienteService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IReporteService, Veterinaria.Application.Services.ReporteService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IConsultorioService, Veterinaria.Application.Services.ConsultorioService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IPresupuestoService, Veterinaria.Application.Services.PresupuestoService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IRecetaService, Veterinaria.Application.Services.RecetaService>();

// Configurar Servicio de generación de PDFs (Sigue en Web por ser infraestructura visual o si se desea se puede mover después)
builder.Services.AddScoped<PdfService>();

// Servicio en segundo plano para actualizar estados de citas automáticamente
builder.Services.AddHostedService<CitaStatusService>();

// Servicio de respaldo automático de base de datos
builder.Services.AddSingleton<Veterinaria.Application.Services.DatabaseBackupService>();
builder.Services.AddSingleton<Veterinaria.Application.Interfaces.IDatabaseBackupService>(sp => sp.GetRequiredService<Veterinaria.Application.Services.DatabaseBackupService>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<Veterinaria.Application.Services.DatabaseBackupService>());

// Agregar Razor Pages para Identity
// builder.Services.AddRazorPages();

// Configurar Forwarded Headers para proxies / AWS App Runner
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

// Seed de datos iniciales (roles, usuarios, veterinarios, servicios, mascotas)
try
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<VeterinariaDbContext>();
        
        // Aplicar migraciones automáticamente en producción al iniciar
        Console.WriteLine("Aplicando migraciones de base de datos...");
        context.Database.SetCommandTimeout(180);
        await context.Database.MigrateAsync();
        Console.WriteLine("Migraciones aplicadas con éxito.");

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        await DbSeeder.SeedAsync(context, userManager, roleManager, app.Environment.IsDevelopment());
    }
}
catch (Exception ex)
{
    Console.WriteLine("==========================================================================");
    Console.WriteLine($"⚠️ ADVERTENCIA: No se pudo conectar o migrar la Base de Datos (PostgreSQL / Supabase).");
    Console.WriteLine($"Detalle: {ex.Message}");
    Console.WriteLine("Verifica que las credenciales de Supabase / PostgreSQL o el servicio local");
    Console.WriteLine("estén activos y que la cadena de conexión sea válida.");
    Console.WriteLine("==========================================================================");
}

app.UseForwardedHeaders();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();

// Servir el frontend compilado (Vite build) desde wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Mapear Hub de SignalR para notificaciones
app.MapHub<NotificacionHub>("/notificacionHub");

// Fallback SPA: todas las rutas del frontend sirven index.html
app.MapFallbackToFile("index.html");

app.Run();

static string ParsePostgreSqlConnectionString(string? connectionString)
{
    if (string.IsNullOrWhiteSpace(connectionString))
        return string.Empty;

    connectionString = connectionString.Trim().Trim('"', '\'');

    // Si ya viene en formato estándar ADO.NET (Host=... o Server=...)
    if (connectionString.Contains("Host=", StringComparison.OrdinalIgnoreCase) ||
        connectionString.Contains("Server=", StringComparison.OrdinalIgnoreCase))
    {
        if (!connectionString.Contains("SSL Mode=", StringComparison.OrdinalIgnoreCase))
        {
            connectionString = connectionString.TrimEnd(';') + ";SSL Mode=Require;Trust Server Certificate=true;";
        }
        return connectionString;
    }

    // Si viene en formato URI (postgres:// o postgresql://)
    if (connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        try
        {
            var schemeEnd = connectionString.IndexOf("://", StringComparison.Ordinal);
            var withoutScheme = connectionString.Substring(schemeEnd + 3);

            // Separar credenciales de host/db usando el último '@' antes de la primera '/'
            var slashIndex = withoutScheme.IndexOf('/');
            var atIndex = slashIndex >= 0 
                ? withoutScheme.LastIndexOf('@', slashIndex) 
                : withoutScheme.LastIndexOf('@');

            if (atIndex > 0)
            {
                var userInfo = withoutScheme.Substring(0, atIndex);
                var hostAndRest = withoutScheme.Substring(atIndex + 1);

                var userColon = userInfo.IndexOf(':');
                var username = userColon >= 0 ? userInfo.Substring(0, userColon) : userInfo;
                var password = userColon >= 0 ? userInfo.Substring(userColon + 1) : "";

                string hostPort;
                string database = "postgres";

                var restSlash = hostAndRest.IndexOf('/');
                if (restSlash >= 0)
                {
                    hostPort = hostAndRest.Substring(0, restSlash);
                    var dbPart = hostAndRest.Substring(restSlash + 1);
                    var questionIndex = dbPart.IndexOf('?');
                    database = questionIndex >= 0 ? dbPart.Substring(0, questionIndex) : dbPart;
                }
                else
                {
                    hostPort = hostAndRest;
                }

                var portColon = hostPort.IndexOf(':');
                var host = portColon >= 0 ? hostPort.Substring(0, portColon) : hostPort;
                var port = portColon >= 0 ? hostPort.Substring(portColon + 1) : "5432";

                return $"Host={host};Port={port};Database={database};Username={Uri.UnescapeDataString(username)};Password={Uri.UnescapeDataString(password)};SSL Mode=Require;Trust Server Certificate=true;";
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error parseando URI postgres: {ex.Message}");
        }
    }

    return connectionString;
}

public partial class Program { }