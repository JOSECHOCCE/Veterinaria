using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Services;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;
using Veterinaria.Infrastructure.Repositories;

namespace Veterinaria.Tests.Application;

[TestClass]
public class ConsultorioServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private ConsultorioService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Consultorio_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        _sut = new ConsultorioService(_unitOfWork);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task CrearConsultorioAsync_DebeCrearYRetornarDto()
    {
        // Arrange
        var dto = new CrearConsultorioDto
        {
            Nombre = "Consultorio 1",
            TipoEspacio = "Consultorio",
            Capacidad = 1
        };

        // Act
        var result = await _sut.CrearConsultorioAsync(dto);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("Consultorio 1", result.Nombre);
        Assert.AreEqual("Consultorio", result.TipoEspacio);
        Assert.IsTrue(result.Activo);
    }

    [TestMethod]
    public async Task GetConsultoriosAsync_DebeFiltrarInactivosPorDefecto()
    {
        // Arrange
        await _context.Consultorios.AddRangeAsync(
            new Consultorio { Id = 1, Nombre = "Sala A", TipoEspacio = "Consultorio", Activo = true },
            new Consultorio { Id = 2, Nombre = "Sala B", TipoEspacio = "Consultorio", Activo = false }
        );
        await _context.SaveChangesAsync();

        // Act
        var activos = await _sut.GetConsultoriosAsync(incluirInactivos: false);
        var todos = await _sut.GetConsultoriosAsync(incluirInactivos: true);

        // Assert
        Assert.AreEqual(1, activos.Count());
        Assert.AreEqual(2, todos.Count());
    }

    [TestMethod]
    public async Task GetConsultorioByIdAsync_DebeRetornarNullSiNoExiste()
    {
        // Act
        var result = await _sut.GetConsultorioByIdAsync(999);

        // Assert
        Assert.IsNull(result);
    }

    [TestMethod]
    public async Task ActualizarConsultorioAsync_DebeModificarPropiedades()
    {
        // Arrange
        var entity = new Consultorio { Id = 1, Nombre = "Consultorio Antiguo", TipoEspacio = "Consultorio", Capacidad = 1, Activo = true };
        await _context.Consultorios.AddAsync(entity);
        await _context.SaveChangesAsync();

        var dto = new CrearConsultorioDto { Nombre = "Consultorio Renovado", TipoEspacio = "SalaProcedimientos", Capacidad = 2 };

        // Act
        var result = await _sut.ActualizarConsultorioAsync(1, dto);
        var actualizado = await _sut.GetConsultorioByIdAsync(1);

        // Assert
        Assert.IsTrue(result);
        Assert.IsNotNull(actualizado);
        Assert.AreEqual("Consultorio Renovado", actualizado.Nombre);
        Assert.AreEqual("SalaProcedimientos", actualizado.TipoEspacio);
    }

    [TestMethod]
    public async Task ToggleActivoAsync_DebeAlternarEstadoActivo()
    {
        // Arrange
        var entity = new Consultorio { Id = 1, Nombre = "Consultorio 1", TipoEspacio = "Consultorio", Activo = true };
        await _context.Consultorios.AddAsync(entity);
        await _context.SaveChangesAsync();

        // Act
        var res1 = await _sut.ToggleActivoAsync(1);
        var c1 = await _sut.GetConsultorioByIdAsync(1);

        // Assert
        Assert.IsTrue(res1);
        Assert.IsFalse(c1!.Activo);
    }

    [TestMethod]
    public async Task GetOcupacionRealTimeAsync_DebeRetornarEstadoCorrecto()
    {
        // Arrange
        var consultorio = new Consultorio { Id = 1, Nombre = "Consultorio 1", TipoEspacio = "Consultorio", Activo = true };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta General", DuracionMinutos = 30, Activo = true };
        var cliente = new Usuario { Id = 1, Nombre = "Juan", Email = "juan@test.com" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", Especie = "Perro", UsuarioId = 1 };
        var vet = new Veterinario { Id = 1, Nombre = "Dr. Perez", Activo = true };

        var hoy = DateTime.Today;
        var cita = new Cita
        {
            Id = 1,
            MascotaId = 1,
            ServicioId = 1,
            VeterinarioId = 1,
            ConsultorioId = 1,
            FechaHora = hoy.AddHours(10),
            Estado = "Confirmada"
        };

        await _context.Consultorios.AddAsync(consultorio);
        await _context.Servicios.AddAsync(servicio);
        await _context.Usuarios.AddAsync(cliente);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();

        // Act
        var ocupaciones = await _sut.GetOcupacionRealTimeAsync(hoy);

        // Assert
        Assert.AreEqual(1, ocupaciones.Count());
        var o = ocupaciones.First();
        Assert.AreEqual("Consultorio 1", o.Nombre);
        Assert.AreEqual("Ocupado", o.Estado);
        Assert.AreEqual("Fido", o.MascotaNombre);
    }
}
