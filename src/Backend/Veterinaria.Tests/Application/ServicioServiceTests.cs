using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Application.Services;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;
using Veterinaria.Infrastructure.Repositories;

namespace Veterinaria.Tests.Application;

[TestClass]
public class ServicioServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private Mock<IAuditoriaService> _auditoriaServiceMock = null!;
    private ServicioService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Servicio_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        _auditoriaServiceMock = new Mock<IAuditoriaService>();

        _sut = new ServicioService(_unitOfWork, _auditoriaServiceMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task CrearServicioAsync_CuandoNombreExiste_DebeRetornarError()
    {
        // Arrange
        var existente = new Servicio { Id = 1, Nombre = "Vacuna", Activo = true };
        await _context.Servicios.AddAsync(existente);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new CrearServicioDto { Nombre = "Vacuna", Precio = 20m, DuracionMinutos = 15 };

        // Act
        var response = await _sut.CrearServicioAsync(dto, "user-1");

        // Assert
        Assert.IsFalse(response.Success);
        Assert.AreEqual("Ya existe un servicio con este nombre.", response.Message);
    }

    [TestMethod]
    public async Task CrearServicioAsync_CuandoExitoso_DebeGuardarYAuditar()
    {
        // Arrange
        var dto = new CrearServicioDto { Nombre = "Desparasitacion", Precio = 15m, DuracionMinutos = 20 };

        // Act
        var response = await _sut.CrearServicioAsync(dto, "user-1");

        // Assert
        Assert.IsTrue(response.Success);
        Assert.IsNotNull(response.Data);
        var inDb = await _context.Servicios.FirstOrDefaultAsync(s => s.Nombre == "Desparasitacion");
        Assert.IsNotNull(inDb);
        _auditoriaServiceMock.Verify(a => a.RegistrarAccionAsync("Crear", "Servicio", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [TestMethod]
    public async Task EditarServicioAsync_CuandoValido_DebeActualizar()
    {
        // Arrange
        var existente = new Servicio { Id = 10, Nombre = "Consulta", Activo = true };
        await _context.Servicios.AddAsync(existente);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new EditarServicioDto { Nombre = "Consulta Pro", Precio = 40m, DuracionMinutos = 30 };

        // Act
        var response = await _sut.EditarServicioAsync(10, dto, "user-1");

        // Assert
        Assert.IsTrue(response.Success);
        var inDb = await _context.Servicios.FindAsync(10);
        Assert.AreEqual("Consulta Pro", inDb!.Nombre);
    }

    [TestMethod]
    public async Task DeleteServicioAsync_CuandoTieneCitasAsociadas_DebeRetornarError()
    {
        // Arrange
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var client = new Usuario { Id = 1, Rol = "Cliente" };
        var mascota = new Mascota { Id = 1, UsuarioId = 1 };
        var vet = new Veterinario { Id = 1, Activo = true };
        var cita = new Cita { Id = 1, MascotaId = 1, ServicioId = 1, VeterinarioId = 1 };

        await _context.Usuarios.AddAsync(client);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Servicios.AddAsync(servicio);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var response = await _sut.DeleteServicioAsync(1, "user-1");

        // Assert
        Assert.IsFalse(response.Success);
        Assert.IsTrue(response.Message.Contains("tiene citas asociadas"));
    }

    [TestMethod]
    public async Task DeleteServicioAsync_CuandoSinCitas_DebeEliminarFisicamente()
    {
        // Arrange
        var servicio = new Servicio { Id = 5, Nombre = "Peluqueria", Activo = true };
        await _context.Servicios.AddAsync(servicio);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var response = await _sut.DeleteServicioAsync(5, "user-1");

        // Assert
        Assert.IsTrue(response.Success);
        var inDb = await _context.Servicios.FindAsync(5);
        Assert.IsNull(inDb);
    }

    [TestMethod]
    public async Task ToggleActivoAsync_DebeInvertirEstado()
    {
        // Arrange
        var servicio = new Servicio { Id = 8, Nombre = "Baño", Activo = true };
        await _context.Servicios.AddAsync(servicio);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var response1 = await _sut.ToggleActivoAsync(8, "user-1");

        // Assert 1
        Assert.IsTrue(response1.Success);
        Assert.IsFalse(response1.Data); // Debería cambiar a inactivo

        // Act
        var response2 = await _sut.ToggleActivoAsync(8, "user-1");

        // Assert 2
        Assert.IsTrue(response2.Success);
        Assert.IsTrue(response2.Data); // Debería cambiar a activo de nuevo
    }

    [TestMethod]
    public async Task GetServicios_DebeBuscarYFiltrar()
    {
        // Arrange
        var s1 = new Servicio { Id = 1, Nombre = "Consulta General", Activo = true };
        var s2 = new Servicio { Id = 2, Nombre = "Vacunacion Especial", Activo = false };
        await _context.Servicios.AddRangeAsync(s1, s2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var activos = _sut.GetServicios(null, false);
        var todos = _sut.GetServicios(null, true);
        var buscar = _sut.GetServicios("Especial", true);

        // Assert
        Assert.AreEqual(1, activos.Count());
        Assert.AreEqual(2, todos.Count());
        Assert.AreEqual(1, buscar.Count());
        Assert.AreEqual(2, buscar.First().Id);
    }

    [TestMethod]
    public async Task GetServicios_DebeFiltrarPorDescripcion()
    {
        // Arrange
        var s1 = new Servicio { Id = 1, Nombre = "S1", Descripcion = "This is a spec description", Activo = true };
        await _context.Servicios.AddAsync(s1);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = _sut.GetServicios("spec", false).ToList();

        // Assert
        Assert.AreEqual(1, result.Count);
        Assert.AreEqual(1, result[0].Id);
    }

    [TestMethod]
    public async Task GetServicioWithCitasAsync_CuandoNoExiste_DebeRetornarNull()
    {
        // Act
        var result = await _sut.GetServicioWithCitasAsync(999);

        // Assert
        Assert.IsNull(result);
    }

    [TestMethod]
    public async Task GetServicioByIdAsync_DebeRetornarCorrectamente()
    {
        // Arrange
        var s1 = new Servicio { Id = 15, Nombre = "S15", Activo = true };
        await _context.Servicios.AddAsync(s1);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act & Assert
        var result = await _sut.GetServicioByIdAsync(15);
        Assert.IsNotNull(result);
        Assert.AreEqual("S15", result.Nombre);

        var nullResult = await _sut.GetServicioByIdAsync(999);
        Assert.IsNull(nullResult);
    }

    [TestMethod]
    public async Task EditarServicioAsync_CuandoNoExiste_DebeRetornarError()
    {
        // Act
        var response = await _sut.EditarServicioAsync(999, new EditarServicioDto { Nombre = "New" }, "user-1");

        // Assert
        Assert.IsFalse(response.Success);
        Assert.AreEqual("Servicio no encontrado.", response.Message);
    }

    [TestMethod]
    public async Task EditarServicioAsync_CuandoNombreDuplicado_DebeRetornarError()
    {
        // Arrange
        var s1 = new Servicio { Id = 1, Nombre = "Name1", Activo = true };
        var s2 = new Servicio { Id = 2, Nombre = "Name2", Activo = true };
        await _context.Servicios.AddRangeAsync(s1, s2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act: Edit service 1 to have name "Name2"
        var response = await _sut.EditarServicioAsync(1, new EditarServicioDto { Nombre = "Name2" }, "user-1");

        // Assert
        Assert.IsFalse(response.Success);
        Assert.AreEqual("Ya existe un servicio con este nombre.", response.Message);
    }

    [TestMethod]
    public async Task DeleteServicioAsync_CuandoNoExiste_DebeRetornarError()
    {
        // Act
        var response = await _sut.DeleteServicioAsync(999, "user-1");

        // Assert
        Assert.IsFalse(response.Success);
        Assert.AreEqual("Servicio no encontrado.", response.Message);
    }

    [TestMethod]
    public async Task ToggleActivoAsync_CuandoNoExiste_DebeRetornarError()
    {
        // Act
        var response = await _sut.ToggleActivoAsync(999, "user-1");

        // Assert
        Assert.IsFalse(response.Success);
        Assert.AreEqual("Servicio no encontrado.", response.Message);
    }
}
