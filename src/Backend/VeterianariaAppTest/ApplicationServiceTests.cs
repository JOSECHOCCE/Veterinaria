using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Veterinaria.Application.Interfaces;
using Veterinaria.Application.Services;
using Veterinaria.Infrastructure.Data;
using Veterinaria.Infrastructure.Persistence;
using Veterinaria.Infrastructure.Repositories;
using Veterinaria.Domain.Contracts;

namespace VeterianariaAppTest
{
    [TestClass]
    public class ApplicationServiceTests
    {
        protected static ServiceProvider _serviceProvider = default!;
        protected static VeterinariaDbContext _dbContext = default!;

        [ClassInitialize]
        public static void Initialize(TestContext context)
        {
            var services = new ServiceCollection();

            // Usar base de datos en memoria para las pruebas
            services.AddDbContext<VeterinariaDbContext>(options =>
                options.UseInMemoryDatabase("VeterinariaTestDb"));

            // Registrar UnitOfWork y Repositorios
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // Registrar Servicios Reales
            services.AddScoped<IMascotaService, Veterinaria.Application.Services.MascotaService>();
            services.AddScoped<ICitaService, Veterinaria.Application.Services.CitaService>();
            services.AddScoped<ITriageService, Veterinaria.Application.Services.TriageService>();

            _serviceProvider = services.BuildServiceProvider();
        }

        [TestInitialize]
        public void Setup()
        {
            // Crear scope por prueba
            var scope = _serviceProvider.CreateScope();
            _dbContext = scope.ServiceProvider.GetRequiredService<VeterinariaDbContext>();

            // Aislamiento de Datos: Destruye y Recrea la base de datos
            _dbContext.Database.EnsureDeleted();
            _dbContext.Database.EnsureCreated();
        }

        [TestMethod]
        public void DatabaseContext_EnsureCreated_Success()
        {
            Assert.IsNotNull(_dbContext);
        }

        [ClassCleanup]
        public static void Cleanup()
        {
            _serviceProvider?.Dispose();
        }
    }
}
