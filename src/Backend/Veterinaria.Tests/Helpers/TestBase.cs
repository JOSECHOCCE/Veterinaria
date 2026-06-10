using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Veterinaria.Domain.Contracts;
using Veterinaria.Infrastructure.Persistence;
using Veterinaria.Infrastructure.Repositories;
using Veterinaria.Application.Interfaces;
using Veterinaria.Application.Services;
using Moq;

namespace Veterinaria.Tests.Helpers;

[TestClass]
public abstract class TestBase
{
    protected static IServiceScopeFactory ScopeFactory = null!;

    [AssemblyInitialize]
    public static void InitializeAssembly(TestContext context)
    {
        var services = new ServiceCollection();
        
        // Registrar base de datos en memoria para los tests
        services.AddDbContext<VeterinariaDbContext>(options => 
            options.UseInMemoryDatabase("VetCareTestDb_" + Guid.NewGuid().ToString()));
        
        // Registrar infraestructura
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        
        // Registrar mocks compartidos
        var auditoriaServiceMock = new Mock<IAuditoriaService>();
        services.AddSingleton(auditoriaServiceMock.Object);

        // Registrar servicios de aplicación a testear
        services.AddScoped<ICitaService, CitaService>();
        // services.AddScoped<IAuthService, AuthService>(); // Requiere dependencias de Identity
        services.AddScoped<IUsuarioService, UsuarioService>();
        services.AddScoped<IPagoService, PagoService>();
        services.AddScoped<INotificacionService, NotificacionService>();
        services.AddScoped<IMascotaService, MascotaService>();
        services.AddScoped<IHistorialClinicoService, HistorialClinicoService>();

        var serviceProvider = services.BuildServiceProvider();
        ScopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();
    }
}
