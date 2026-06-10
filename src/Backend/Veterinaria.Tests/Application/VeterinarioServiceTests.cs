using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Veterinaria.Application.Services;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;
using Veterinaria.Infrastructure.Repositories;

namespace Veterinaria.Tests.Application;

[TestClass]
public class VeterinarioServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private VeterinarioService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Veterinario_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);

        _sut = new VeterinarioService(_unitOfWork);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task AddVeterinarioAsync_DebeGuardarVeterinario()
    {
        // Arrange
        var v = new Veterinario { Id = 1, Nombre = "Dr. Smith", Activo = true, Especialidad = "General" };

        // Act
        await _sut.AddVeterinarioAsync(v);

        // Assert
        var inDb = await _context.Veterinarios.FindAsync(1);
        Assert.IsNotNull(inDb);
        Assert.AreEqual("Dr. Smith", inDb!.Nombre);
    }

    [TestMethod]
    public async Task DeleteVeterinarioAsync_DebeHacerSoftDelete()
    {
        // Arrange
        var v = new Veterinario { Id = 1, Nombre = "Dr. Smith", Activo = true };
        await _context.Veterinarios.AddAsync(v);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var success = await _sut.DeleteVeterinarioAsync(1);

        // Assert
        Assert.IsTrue(success);
        var inDb = await _context.Veterinarios.FindAsync(1);
        Assert.IsNotNull(inDb);
        Assert.IsFalse(inDb!.Activo); // Should be soft deleted
    }

    [TestMethod]
    public async Task DeleteVeterinarioAsync_CuandoNoExiste_DebeRetornarFalse()
    {
        // Act
        var success = await _sut.DeleteVeterinarioAsync(99);

        // Assert
        Assert.IsFalse(success);
    }

    [TestMethod]
    public async Task GetVeterinarios_DebeFiltrarPorNombreYEspecialidad()
    {
        // Arrange
        var v1 = new Veterinario { Id = 1, Nombre = "Dr. Alice", Especialidad = "Cirugia", Activo = true };
        var v2 = new Veterinario { Id = 2, Nombre = "Dr. Bob", Especialidad = "Dermatologia", Activo = true };
        var v3 = new Veterinario { Id = 3, Nombre = "Dr. Charlie", Especialidad = "Cirugia", Activo = false }; // Inactive

        await _context.Veterinarios.AddRangeAsync(v1, v2, v3);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var allActive = _sut.GetVeterinarios(null, null);
        var cirujanos = _sut.GetVeterinarios("Cirugia", null);
        var buscarBob = _sut.GetVeterinarios(null, "bob");

        // Assert
        Assert.AreEqual(2, allActive.Count()); // Alice and Bob
        Assert.AreEqual(1, cirujanos.Count());
        Assert.AreEqual(1, cirujanos.First().Id); // Alice
        Assert.AreEqual(1, buscarBob.Count());
        Assert.AreEqual(2, buscarBob.First().Id); // Bob
    }

    [TestMethod]
    public async Task GetEspecialidades_DebeRetornarEspecialidadesDistinctOrdenadas()
    {
        // Arrange
        var v1 = new Veterinario { Id = 1, Nombre = "V1", Especialidad = "Cardiologia", Activo = true };
        var v2 = new Veterinario { Id = 2, Nombre = "V2", Especialidad = "Anestesiologia", Activo = true };
        var v3 = new Veterinario { Id = 3, Nombre = "V3", Especialidad = "Cardiologia", Activo = true };
        var v4 = new Veterinario { Id = 4, Nombre = "V4", Especialidad = "Dermatologia", Activo = false }; // Inactive

        await _context.Veterinarios.AddRangeAsync(v1, v2, v3, v4);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = _sut.GetEspecialidades().ToList();

        // Assert
        Assert.AreEqual(2, result.Count);
        Assert.AreEqual("Anestesiologia", result[0]);
        Assert.AreEqual("Cardiologia", result[1]);
    }

    [TestMethod]
    public async Task GetVeterinarioWithCitasAsync_DebeRetornarCorrecto()
    {
        // Arrange
        var vet = new Veterinario { Id = 10, Nombre = "Dr. House", Activo = true };
        var client = new Usuario { Id = 1, Rol = "Cliente" };
        var mascota = new Mascota { Id = 1, UsuarioId = 1 };
        var servicio = new Servicio { Id = 1 };
        var cita = new Cita { Id = 1, MascotaId = 1, ServicioId = 1, VeterinarioId = 10 };

        await _context.Usuarios.AddAsync(client);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetVeterinarioWithCitasAsync(10);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(1, result!.Citas.Count);
        Assert.IsNotNull(result.Citas.First().Mascota);
        Assert.IsNotNull(result.Citas.First().Mascota.Usuario);
    }

    [TestMethod]
    public async Task GetVeterinarioByIdAsync_DebeRetornarVeterinarioCuandoExiste()
    {
        // Arrange
        var v = new Veterinario { Id = 20, Nombre = "Dr. Strange", Activo = true };
        await _context.Veterinarios.AddAsync(v);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetVeterinarioByIdAsync(20);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("Dr. Strange", result.Nombre);
    }

    [TestMethod]
    public async Task GetVeterinarioByIdAsync_DebeRetornarNullCuandoNoExiste()
    {
        // Act
        var result = await _sut.GetVeterinarioByIdAsync(999);

        // Assert
        Assert.IsNull(result);
    }

    [TestMethod]
    public async Task UpdateVeterinarioAsync_DebeActualizarVeterinario()
    {
        // Arrange
        var v = new Veterinario { Id = 21, Nombre = "Dr. Strange", Activo = true };
        await _context.Veterinarios.AddAsync(v);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        v.Nombre = "Dr. Fate";

        // Act
        await _sut.UpdateVeterinarioAsync(v);

        // Assert
        var inDb = await _context.Veterinarios.FindAsync(21);
        Assert.IsNotNull(inDb);
        Assert.AreEqual("Dr. Fate", inDb!.Nombre);
    }

    [TestMethod]
    public async Task GetVeterinarioWithCitasAsync_DebeRetornarNullCuandoNoExiste()
    {
        // Act
        var result = await _sut.GetVeterinarioWithCitasAsync(999);

        // Assert
        Assert.IsNull(result);
    }

    [TestMethod]
    public async Task GetVeterinarios_DebeFiltrarPorEmail()
    {
        // Arrange
        var v1 = new Veterinario { Id = 1, Nombre = "V1", Email = "specialist@test.com", Activo = true };
        await _context.Veterinarios.AddAsync(v1);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = _sut.GetVeterinarios(null, "specialist");

        // Assert
        Assert.AreEqual(1, result.Count());
        Assert.AreEqual(1, result.First().Id);
    }
}
