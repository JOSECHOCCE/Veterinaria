using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using Veterinaria.Application.Interfaces;
using Veterinaria.Application.Services;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;
using Veterinaria.Infrastructure.Repositories;

namespace Veterinaria.Tests.Application;

[TestClass]
public class ConsentimientoServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private ConsentimientoService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Consentimiento_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);

        _sut = new ConsentimientoService(_unitOfWork);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task AddConsentimientoAsync_DebeGuardarEnBaseDatos()
    {
        // Arrange
        var con = new Consentimiento
        {
            Id = 1,
            TipoConsentimiento = "Cirugía",
            NombrePropietario = "Juan",
            Aceptado = true,
            FechaAceptacion = DateTime.Today,
            Observaciones = "Contenido de prueba"
        };

        // Act
        await _sut.AddConsentimientoAsync(con);

        // Assert
        var inDb = await _context.Consentimientos.FindAsync(1);
        Assert.IsNotNull(inDb);
        Assert.AreEqual("Cirugía", inDb!.TipoConsentimiento);
    }

    [TestMethod]
    public async Task GetConsentimientoByIdAsync_CuandoExiste_DebeRetornarConRelaciones()
    {
        // Arrange
        var user = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente", Email = "j@t.com" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1 };
        var con = new Consentimiento
        {
            Id = 5,
            TipoConsentimiento = "Vacuna",
            NombrePropietario = "Juan",
            UsuarioId = 1,
            MascotaId = 1
        };
        await _context.Usuarios.AddAsync(user);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Consentimientos.AddAsync(con);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetConsentimientoByIdAsync(5);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("Vacuna", result!.TipoConsentimiento);
        Assert.IsNotNull(result.Usuario);
        Assert.IsNotNull(result.Mascota);
    }

    [TestMethod]
    public async Task GetConsentimientosAsync_DebeFiltrarPorUsuario()
    {
        // Arrange
        var user1 = new Usuario { Id = 10, Nombre = "Juan", Rol = "Cliente", Email = "j1@t.com" };
        var user2 = new Usuario { Id = 20, Nombre = "Pedro", Rol = "Cliente", Email = "j2@t.com" };
        await _context.Usuarios.AddRangeAsync(user1, user2);

        var con1 = new Consentimiento { Id = 1, TipoConsentimiento = "A", NombrePropietario = "Juan", UsuarioId = 10 };
        var con2 = new Consentimiento { Id = 2, TipoConsentimiento = "B", NombrePropietario = "Juan", UsuarioId = 20 };
        await _context.Consentimientos.AddRangeAsync(con1, con2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var all = await _sut.GetConsentimientosAsync(null);
        var filtered = await _sut.GetConsentimientosAsync(10);

        // Assert
        Assert.AreEqual(2, all.Count);
        Assert.AreEqual(1, filtered.Count);
        Assert.AreEqual(1, filtered.First().Id);
    }

    [TestMethod]
    public async Task GetUsuarioByApplicationUserIdAsync_DebeRetornarCorrecto()
    {
        // Arrange
        var user = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente", Email = "j@t.com", ApplicationUserId = "app-user-1" };
        await _context.Usuarios.AddAsync(user);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetUsuarioByApplicationUserIdAsync("app-user-1");

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(1, result!.Id);
    }
}
