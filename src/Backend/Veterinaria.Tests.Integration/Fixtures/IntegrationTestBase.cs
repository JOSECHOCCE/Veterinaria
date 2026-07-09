using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;

namespace Veterinaria.Tests.Integration.Fixtures;

/// <summary>
/// Clase base para todas las pruebas de integración.
/// Proporciona HttpClient, acceso al DbContext y helpers de autenticación JWT.
/// Implementa IAsyncLifetime para limpiar la BD con Respawn antes de cada test.
/// </summary>
public abstract class IntegrationTestBase : IClassFixture<VeterinariaWebApplicationFactory>, IAsyncLifetime
{
    protected readonly HttpClient Client;
    protected readonly VeterinariaWebApplicationFactory Factory;

    /// <summary>
    /// Flag para asegurar que el Respawner se inicializa una sola vez por clase de test.
    /// </summary>
    private bool _respawnerInitialized;
    private readonly SemaphoreSlim _initLock = new(1, 1);

    protected IntegrationTestBase(VeterinariaWebApplicationFactory factory)
    {
        Factory = factory;
        Client = factory.CreateClient();
    }

    /// <summary>
    /// Se ejecuta ANTES de cada test.
    /// Limpia todos los datos de la BD para garantizar aislamiento entre tests.
    /// </summary>
    public async Task InitializeAsync()
    {
        // Inicializar el Respawner la primera vez (después de que la BD exista)
        if (!_respawnerInitialized)
        {
            await _initLock.WaitAsync();
            try
            {
                if (!_respawnerInitialized)
                {
                    await Factory.InitializeRespawnerAsync();
                    _respawnerInitialized = true;
                }
            }
            finally
            {
                _initLock.Release();
            }
        }

        // Limpiar todos los datos antes de cada test
        await Factory.ResetDatabaseAsync();

        // Limpiar headers de autorización del test anterior
        Client.DefaultRequestHeaders.Authorization = null;
    }

    /// <summary>
    /// Se ejecuta DESPUÉS de cada test. No necesitamos hacer nada aquí
    /// porque la limpieza ocurre al inicio del siguiente test.
    /// </summary>
    public Task DisposeAsync() => Task.CompletedTask;

    /// <summary>
    /// Obtiene un VeterinariaDbContext fresco para insertar datos de test
    /// o verificar el estado de la BD después de una operación.
    /// </summary>
    protected VeterinariaDbContext GetDbContext()
    {
        var scope = Factory.Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<VeterinariaDbContext>();
    }

    /// <summary>
    /// Crea un usuario de Identity con el rol especificado y devuelve un JWT token.
    /// Esto permite autenticar las peticiones HTTP a endpoints protegidos con [Authorize].
    /// </summary>
    protected async Task AuthenticateAsAsync(string role = "Admin")
    {
        var email = $"test-{role.ToLower()}-{Guid.NewGuid():N}@vetcare.test";
        var password = "TestP@ss1";

        // Crear el usuario en Identity usando los servicios reales
        using var scope = Factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        // Asegurar que el rol exista
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
        }

        // Crear el ApplicationUser
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            NombreCompleto = $"Test User {role}",
            EmailConfirmed = true,
            FechaRegistro = DateTime.UtcNow
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            throw new Exception($"No se pudo crear el usuario de test: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
        }

        await userManager.AddToRoleAsync(user, role);

        // También crear el Usuario en la tabla de dominio (necesario para algunos controllers)
        var dbContext = scope.ServiceProvider.GetRequiredService<VeterinariaDbContext>();
        var usuario = new Usuario
        {
            Nombre = $"Test User {role}",
            Email = email,
            Rol = role,
            Activo = true,
            FechaRegistro = DateTime.UtcNow,
            ApplicationUserId = user.Id
        };
        dbContext.Usuarios.Add(usuario);
        await dbContext.SaveChangesAsync();

        // Hacer login vía la API para obtener el JWT token
        var loginResponse = await Client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = email,
            Password = password
        });

        loginResponse.EnsureSuccessStatusCode();

        var loginResult = await loginResponse.Content.ReadFromJsonAsync<LoginApiResponse>();

        if (loginResult?.Data?.Token == null)
        {
            throw new Exception("No se recibió el token JWT del login.");
        }

        // Configurar el header Authorization para todas las peticiones siguientes
        Client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", loginResult.Data.Token);
    }

    /// <summary>
    /// Inserta un Usuario de dominio directamente en la BD para datos de prueba.
    /// </summary>
    protected async Task<Usuario> SeedUsuarioAsync(string nombre = "Cliente Test", string email = null!, string rol = "Cliente")
    {
        email ??= $"cliente-{Guid.NewGuid():N}@vetcare.test";

        await using var context = GetDbContext();
        var usuario = new Usuario
        {
            Nombre = nombre,
            Email = email,
            Rol = rol,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };
        context.Usuarios.Add(usuario);
        await context.SaveChangesAsync();
        return usuario;
    }

    protected async Task<Servicio> SeedServicioAsync(string nombre = "Servicio", int duracion = 30, decimal precio = 50.00m)
    {
        await using var context = GetDbContext();
        var servicio = new Servicio
        {
            Nombre = $"{nombre} {Guid.NewGuid():N}",
            Descripcion = "Descripción de test",
            DuracionMinutos = duracion,
            Precio = precio,
            Activo = true
        };
        context.Servicios.Add(servicio);
        await context.SaveChangesAsync();
        return servicio;
    }

    protected async Task<Veterinario> SeedVeterinarioAsync(string nombre = "Veterinario", string especialidad = "General")
    {
        await using var context = GetDbContext();
        var veterinario = new Veterinario
        {
            Nombre = nombre,
            Especialidad = especialidad,
            Email = $"vet-{Guid.NewGuid():N}@vetcare.test",
            Telefono = "999888777",
            HorarioInicio = new TimeSpan(8, 0, 0),
            HorarioFin = new TimeSpan(18, 0, 0),
            Activo = true
        };
        context.Veterinarios.Add(veterinario);
        await context.SaveChangesAsync();
        return veterinario;
    }

    protected async Task<Mascota> SeedMascotaAsync(int usuarioId, string nombre = "Mascota", string especie = "Perro")
    {
        await using var context = GetDbContext();
        var mascota = new Mascota
        {
            Nombre = nombre,
            Especie = especie,
            Raza = "Raza Test",
            UsuarioId = usuarioId,
            Activo = true,
            FechaNacimiento = DateTime.UtcNow.AddYears(-3),
            Peso = 10.5m,
            Color = "Marrón",
            Sexo = "Macho"
        };
        context.Mascotas.Add(mascota);
        await context.SaveChangesAsync();
        return mascota;
    }

    protected async Task<Cita> SeedCitaAsync(int mascotaId, int veterinarioId, int servicioId, DateTime? fechaHora = null, string estado = "Pendiente", string estadoPago = "Pendiente")
    {
        await using var context = GetDbContext();
        var cita = new Cita
        {
            MascotaId = mascotaId,
            VeterinarioId = veterinarioId,
            ServicioId = servicioId,
            FechaHora = fechaHora ?? DateTime.UtcNow.AddDays(1),
            Estado = estado,
            EstadoPago = estadoPago,
            MontoTotal = 100.00m,
            MontoPagado = estadoPago == "Pagado" ? 100.00m : (estadoPago == "Parcial" ? 50.00m : 0m),
            TipoPago = "Completo",
            FechaCreacion = DateTime.UtcNow
        };
        context.Citas.Add(cita);
        await context.SaveChangesAsync();
        return cita;
    }

    // DTOs internos para deserializar la respuesta del login
    private sealed class LoginApiResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public LoginData? Data { get; set; }
    }

    private sealed class LoginData
    {
        public string Token { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string NombreCompleto { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
