using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Data;
using Veterinaria.Infrastructure.Persistence;
using Veterinaria.Infrastructure.Repositories;
using Veterinaria.Web.Hubs;
using Veterinaria.Web.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configurar CORS para el frontend en React
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", builder =>
    {
        builder.WithOrigins("http://localhost:5173") // Vite default port
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

// Configurar SignalR para notificaciones en tiempo real
builder.Services.AddSignalR();

// Configurar Entity Framework Core con SQL Server
builder.Services.AddDbContext<VeterinariaDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("VeterinariaDb")));

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

// Configurar Cookie de autenticación
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Identity/Account/Login";
    options.LogoutPath = "/Identity/Account/Logout";
    options.AccessDeniedPath = "/Identity/Account/AccessDenied";
    options.ExpireTimeSpan = TimeSpan.FromHours(24);
    options.SlidingExpiration = true;
});

// Configurar AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Configurar Unit of Work
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Configurar Servicios de Aplicación (Arquitectura Cebolla)
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IClienteService, Veterinaria.Application.Services.ClienteService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IMascotaService, Veterinaria.Application.Services.MascotaService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IServicioService, Veterinaria.Application.Services.ServicioService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IVeterinarioService, Veterinaria.Application.Services.VeterinarioService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IDashboardService, Veterinaria.Application.Services.DashboardService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IPagoService, Veterinaria.Application.Services.PagoService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.ICitaService, Veterinaria.Application.Services.CitaService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IHistorialClinicoService, Veterinaria.Application.Services.HistorialClinicoService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.ITriageService, Veterinaria.Application.Services.TriageService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IConsentimientoService, Veterinaria.Application.Services.ConsentimientoService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.INotificacionService, Veterinaria.Application.Services.NotificacionService>();
builder.Services.AddScoped<Veterinaria.Application.Interfaces.IRealTimeNotificationService, Veterinaria.Web.Services.RealTimeNotificationService>();

// Configurar Servicio de generación de PDFs (Sigue en Web por ser infraestructura visual o si se desea se puede mover después)
builder.Services.AddScoped<PdfService>();

// Servicio en segundo plano para actualizar estados de citas automáticamente
builder.Services.AddHostedService<CitaStatusService>();

// Agregar Razor Pages para Identity
// builder.Services.AddRazorPages();

var app = builder.Build();

// Seed de datos iniciales (roles, usuarios, veterinarios, servicios, mascotas)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<VeterinariaDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

    await DbSeeder.SeedAsync(context, userManager, roleManager, app.Environment.IsDevelopment());
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
// app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.UseCors("CorsPolicy");

app.MapControllers();
// app.MapRazorPages();

// Mapear Hub de SignalR para notificaciones
app.MapHub<NotificacionHub>("/notificacionHub");

app.Run();
