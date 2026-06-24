using DotNet.Testcontainers.Builders;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.MsSql;
using Veterinaria.Infrastructure.Persistence;

namespace Veterinaria.Tests.Integration.Fixtures;

/// <summary>
/// Factory personalizada que levanta un contenedor Docker con SQL Server
/// usando Testcontainers. Reemplaza el connection string de producción
/// por el del contenedor temporal para las pruebas de integración.
/// </summary>
public class VeterinariaWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly MsSqlContainer _msSqlContainer = new MsSqlBuilder()
        .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
        .WithPassword("TestP@ssw0rd!")
        .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(1433))
        .Build();

    /// <summary>
    /// Se ejecuta ANTES de cualquier test.
    /// Arranca el contenedor Docker con SQL Server.
    /// </summary>
    public async Task InitializeAsync()
    {
        await _msSqlContainer.StartAsync();
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
