using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;
using Veterinaria.Infrastructure.Repositories;

namespace Veterinaria.Tests.Infrastructure;


[TestClass]
public class InfrastructureTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Infra_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
    }

    [TestMethod]
    public async Task GenericRepository_DebeAgregarYRemoverRangosYListar()
    {
        // Arrange
        var servicios = new List<Servicio>
        {
            new Servicio { Id = 101, Nombre = "S1", Precio = 10m, Activo = true },
            new Servicio { Id = 102, Nombre = "S2", Precio = 20m, Activo = true }
        };

        // Act & Assert 1: AddRangeAsync
        await _unitOfWork.Servicios.AddRangeAsync(servicios);
        await _unitOfWork.CommitAsync();
        _context.ChangeTracker.Clear();

        // Act & Assert 2: GetAllAsync
        var list = await _unitOfWork.Servicios.GetAllAsync();
        Assert.AreEqual(2, list.Count());

        // Act & Assert 3: RemoveRange
        _unitOfWork.Servicios.RemoveRange(list);
        await _unitOfWork.CommitAsync();
        _context.ChangeTracker.Clear();

        var listAfter = await _unitOfWork.Servicios.GetAllAsync();
        Assert.AreEqual(0, listAfter.Count());
    }

    [TestMethod]
    public void UnitOfWork_DebeDisponerseCorrectamente()
    {
        // Act
        _unitOfWork.Dispose();
        
        // Assert
        Assert.ThrowsException<ObjectDisposedException>(() => _context.Set<Servicio>().Add(new Servicio()));
    }

    [TestMethod]
    public async Task UnitOfWork_DebeDisponerseAsyncCorrectamente()
    {
        // Act
        await _unitOfWork.DisposeAsync();

        // Assert
        await Assert.ThrowsExceptionAsync<ObjectDisposedException>(async () => await _context.Set<Servicio>().AddAsync(new Servicio()));
    }

    [TestMethod]
    public void Migrations_DebeEjecutarUpDownYDesignerCorrectamente()
    {
        var migrationTypes = typeof(Veterinaria.Infrastructure.Persistence.VeterinariaDbContext).Assembly
            .GetTypes()
            .Where(t => !t.IsAbstract && t.IsSubclassOf(typeof(Microsoft.EntityFrameworkCore.Migrations.Migration)))
            .ToList();

        foreach (var type in migrationTypes)
        {
            var migrationInstance = (Microsoft.EntityFrameworkCore.Migrations.Migration)Activator.CreateInstance(type)!;

            // Cover Up
            var migrationBuilder = new Microsoft.EntityFrameworkCore.Migrations.MigrationBuilder("Microsoft.EntityFrameworkCore.SqlServer");
            var upMethod = type.GetMethod("Up", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            if (upMethod != null)
            {
                upMethod.Invoke(migrationInstance, new object[] { migrationBuilder });
            }

            // Cover Down
            var downMigrationBuilder = new Microsoft.EntityFrameworkCore.Migrations.MigrationBuilder("Microsoft.EntityFrameworkCore.SqlServer");
            var downMethod = type.GetMethod("Down", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            if (downMethod != null)
            {
                downMethod.Invoke(migrationInstance, new object[] { downMigrationBuilder });
            }

            // Cover BuildTargetModel
            var buildTargetModelMethod = type.GetMethod("BuildTargetModel", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            if (buildTargetModelMethod != null)
            {
                var modelBuilder = new ModelBuilder(new Microsoft.EntityFrameworkCore.Metadata.Conventions.ConventionSet());
                buildTargetModelMethod.Invoke(migrationInstance, new object[] { modelBuilder });
            }
        }

        // Cover ModelSnapshot via reflection to avoid CS0122 protection level compilation error
        var snapshotType = typeof(Veterinaria.Infrastructure.Persistence.VeterinariaDbContext).Assembly
            .GetType("Veterinaria.Infrastructure.Migrations.VeterinariaDbContextModelSnapshot");
        if (snapshotType != null)
        {
            var snapshot = Activator.CreateInstance(snapshotType);
            var buildModelMethod = snapshotType.GetMethod("BuildModel", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            
            if (buildModelMethod != null)
            {
                var modelBuilder = new ModelBuilder(new Microsoft.EntityFrameworkCore.Metadata.Conventions.ConventionSet());
                buildModelMethod.Invoke(snapshot, new object[] { modelBuilder });
            }
        }
        
        Assert.IsTrue(migrationTypes.Count > 0);
    }

    [TestMethod]
    public async Task DbSeeder_DebeEjecutarSemilladoCorrectamente()
    {
        // Arrange
        var dbName = "VetCareTestDb_Seeder_" + Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: dbName, inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        // Setup Mock for UserManager
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        var users = new Dictionary<string, ApplicationUser>();
        userManagerMock
            .Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .Callback<ApplicationUser, string>((u, p) =>
            {
                u.Id = Guid.NewGuid().ToString();
                users[u.Email!] = u;
            })
            .ReturnsAsync(IdentityResult.Success);

        userManagerMock
            .Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((string email) => users.TryGetValue(email, out var u) ? u : null!);

        userManagerMock
            .Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        // Setup Mock for RoleManager
        var roleStoreMock = new Mock<IRoleStore<IdentityRole>>();
        var roleManagerMock = new Mock<RoleManager<IdentityRole>>(
            roleStoreMock.Object, null!, null!, null!, null!);

        var roles = new HashSet<string>();
        roleManagerMock
            .Setup(x => x.RoleExistsAsync(It.IsAny<string>()))
            .ReturnsAsync((string roleName) => roles.Contains(roleName));

        roleManagerMock
            .Setup(x => x.CreateAsync(It.IsAny<IdentityRole>()))
            .Callback<IdentityRole>(r => roles.Add(r.Name!))
            .ReturnsAsync(IdentityResult.Success);

        // Act & Assert 1: Seeding empty database
        using (var context = new VeterinariaDbContext(options))
        {
            await Veterinaria.Infrastructure.Data.DbSeeder.SeedAsync(
                context, 
                userManagerMock.Object, 
                roleManagerMock.Object, 
                isDevelopment: false);

            // Verify some entities got added
            Assert.IsTrue(await context.Veterinarios.AnyAsync());
            Assert.IsTrue(await context.Servicios.AnyAsync());
            Assert.IsTrue(await context.Mascotas.AnyAsync());
            Assert.IsTrue(await context.Citas.AnyAsync());
        }

        // Act & Assert 2: Seeding already populated database
        using (var context = new VeterinariaDbContext(options))
        {
            // Also insert some pets without photos to verify photo backfilling logic under isDevelopment: true
            var propietario = await context.Usuarios.FirstOrDefaultAsync(u => u.Email == "usuario@test.com");
            Assert.IsNotNull(propietario);

            var catSinFoto = new Mascota
            {
                Nombre = "Michi Sin Foto",
                Especie = "Gato",
                Raza = "Criollo",
                Activo = true,
                UsuarioId = propietario.Id,
                FotoUrl = null
            };

            var dogSinFoto = new Mascota
            {
                Nombre = "Firulais Sin Foto",
                Especie = "Perro",
                Raza = "Criollo",
                Activo = true,
                UsuarioId = propietario.Id,
                FotoUrl = "  "
            };

            context.Mascotas.Add(catSinFoto);
            context.Mascotas.Add(dogSinFoto);
            await context.SaveChangesAsync();

            // Run seed again with isDevelopment = true
            await Veterinaria.Infrastructure.Data.DbSeeder.SeedAsync(
                context, 
                userManagerMock.Object, 
                roleManagerMock.Object, 
                isDevelopment: true);

            // Verify photos were updated
            var catUpdated = await context.Mascotas.FindAsync(catSinFoto.Id);
            var dogUpdated = await context.Mascotas.FindAsync(dogSinFoto.Id);
            
            Assert.IsNotNull(catUpdated?.FotoUrl);
            Assert.IsNotNull(dogUpdated?.FotoUrl);
            Assert.IsTrue(catUpdated.FotoUrl.Contains("photo"));
            Assert.IsTrue(dogUpdated.FotoUrl.Contains("photo"));
        }
    }
}
