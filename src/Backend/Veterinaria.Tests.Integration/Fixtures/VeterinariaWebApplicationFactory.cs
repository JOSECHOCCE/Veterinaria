using DotNet.Testcontainers.Builders;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Respawn;
using Testcontainers.MsSql;
using Veterinaria.Infrastructure.Persistence;

namespace Veterinaria.Tests.Integration.Fixtures;

/// <summary>
/// Factory personalizada que levanta un contenedor Docker con SQL Server
/// usando Testcontainers. Reemplaza el connection string de producción
/// por el del contenedor temporal para las pruebas de integración.
/// Integra Respawn para limpiar datos entre tests sin recrear la BD.
/// </summary>
public class VeterinariaWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly MsSqlContainer _msSqlContainer = new MsSqlBuilder()
        .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
        .WithPassword("TestP@ssw0rd!")
        .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(1433))
        .Build();

    /// <summary>
    /// Respawn checkpoint configurado para limpiar todas las tablas
    /// excepto las de Identity (__EFMigrationsHistory) y las tablas
    /// del sistema de ASP.NET Identity que contienen roles base.
    /// </summary>
    private Respawner _respawner = default!;
    private bool _respawnerInitialized;
    private readonly SemaphoreSlim _initLock = new(1, 1);

    /// <summary>
    /// Connection string del contenedor Docker, expuesto para que
    /// IntegrationTestBase pueda usarlo para abrir conexiones de Respawn.
    /// </summary>
    public string ConnectionString { get; private set; } = default!;

    /// <summary>
    /// Se ejecuta ANTES de cualquier test.
    /// Arranca el contenedor Docker con SQL Server.
    /// </summary>
    public async Task InitializeAsync()
    {
        await _msSqlContainer.StartAsync();
        ConnectionString = _msSqlContainer.GetConnectionString();
    }

    /// <summary>
    /// Se ejecuta DESPUÉS de todos los tests.
    /// Destruye el contenedor Docker.
    /// </summary>
    public new async Task DisposeAsync()
    {
        await _msSqlContainer.StopAsync();
        await base.DisposeAsync();
    }

    /// <summary>
    /// Inicializa el Respawner después de que la BD haya sido creada.
    /// Debe llamarse una vez después de que EnsureCreated() haya corrido.
    /// </summary>
    public async Task InitializeRespawnerAsync()
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync();

        _respawner = await Respawner.CreateAsync(connection, new RespawnerOptions
        {
            DbAdapter = DbAdapter.SqlServer,
            // Preservar las tablas de Identity que contienen roles y configuración base.
            // También preservar __EFMigrationsHistory para que EF Core no se confunda.
            TablesToIgnore = new Respawn.Graph.Table[]
            {
                "__EFMigrationsHistory",
                "AspNetRoles"
            },
            // Incluir todos los schemas
            SchemasToInclude = new[] { "dbo" }
        });
    }

    /// <summary>
    /// Limpia todos los datos de la BD (excepto las tablas ignoradas)
    /// usando Respawn. Mucho más rápido que recrear la BD completa.
    /// </summary>
    public async Task ResetDatabaseAsync()
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync();
        await _respawner.ResetAsync(connection);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remover el DbContext original que apunta a SQL Server local
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<VeterinariaDbContext>));

            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // También remover el DbContextFactory si existe
            var factoryDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(IDbContextFactory<VeterinariaDbContext>));

            if (factoryDescriptor != null)
            {
                services.Remove(factoryDescriptor);
            }

            // Registrar el DbContext apuntando al SQL Server del contenedor Docker
            services.AddDbContext<VeterinariaDbContext>(options =>
            {
                options.UseSqlServer(_msSqlContainer.GetConnectionString());
            });

            // Construir el service provider para aplicar migraciones
            var serviceProvider = services.BuildServiceProvider();

            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<VeterinariaDbContext>();

            // Crear todas las tablas basándose en el modelo de EF Core
            // (equivalente a aplicar todas las migraciones)
            context.Database.EnsureCreated();
        });

        // Usar el entorno "Testing" para diferenciarlo de Development/Production
        builder.UseEnvironment("Testing");
    }
}
