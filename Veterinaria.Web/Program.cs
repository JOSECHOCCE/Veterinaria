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
builder.Services.AddControllersWithViews();

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

// Configurar Servicios de Validación
builder.Services.AddScoped<ICitaValidationService, CitaValidationService>();

// Configurar Servicio de generación de PDFs
builder.Services.AddScoped<PdfService>();

// Configurar Servicio de Notificaciones
builder.Services.AddScoped<INotificacionService, NotificacionService>();

// Servicio en segundo plano para actualizar estados de citas automáticamente
builder.Services.AddHostedService<CitaStatusService>();

// Agregar Razor Pages para Identity
builder.Services.AddRazorPages();

var app = builder.Build();

// Seed de datos iniciales (roles, usuarios, veterinarios, servicios, mascotas)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<VeterinariaDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

    await DbSeeder.SeedAsync(context, userManager, roleManager);
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapRazorPages();

// Mapear Hub de SignalR para notificaciones
app.MapHub<NotificacionHub>("/notificacionHub");

app.Run();
