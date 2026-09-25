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
public class TriageServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private Mock<IRealTimeNotificationService> _realTimeMock = null!;
    private TriageService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Triage_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        _realTimeMock = new Mock<IRealTimeNotificationService>();
        _sut = new TriageService(_unitOfWork, _realTimeMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task AddTriageAsync_DebeGuardarTriage()
    {
        // Arrange
        var t = new Triage { Id = 1, Nivel = "N2", Estado = "EnEspera" };

        // Act
        await _sut.AddTriageAsync(t);

        // Assert
        var inDb = await _context.Triages.FindAsync(1);
        Assert.IsNotNull(inDb);
        Assert.AreEqual("N2", inDb!.Nivel);
    }

    [TestMethod]
    public async Task GetTriageByIdAsync_DebeRetornarCorrecto()
    {
        // Arrange
        var t = new Triage { Id = 10, Nivel = "N1", Estado = "EnEspera" };
        await _context.Triages.AddAsync(t);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetTriageByIdAsync(10);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("N1", result!.Nivel);
    }

    [TestMethod]
    public async Task UpdateTriageAsync_DebeModificarEntidad()
    {
        // Arrange
        var t = new Triage { Id = 1, Nivel = "N3", Estado = "EnEspera" };
        await _context.Triages.AddAsync(t);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        t.Estado = "EnAtencion";
        await _sut.UpdateTriageAsync(t);

        // Assert
        var inDb = await _context.Triages.FindAsync(1);
        Assert.AreEqual("EnAtencion", inDb!.Estado);
    }

    [TestMethod]
    public async Task GetColaTriageAsync_DebeOrdenarPorNivelYFecha()
    {
        // Arrange
        var user = new Usuario { Id = 1, Rol = "Cliente" };
        var m1 = new Mascota { Id = 1, Nombre = "F1", UsuarioId = 1 };
        var m2 = new Mascota { Id = 2, Nombre = "F2", UsuarioId = 1 };
        var m3 = new Mascota { Id = 3, Nombre = "F3", UsuarioId = 1 };

        // t1 is N2 (registered early)
        var t1 = new Triage { Id = 1, MascotaId = 1, Nivel = "N2", Estado = "EnEspera", FechaRegistro = DateTime.Today.AddHours(9) };
        // t2 is N1 (registered late)
        var t2 = new Triage { Id = 2, MascotaId = 2, Nivel = "N1", Estado = "EnEspera", FechaRegistro = DateTime.Today.AddHours(10) };
        // t3 is N2 (registered late)
        var t3 = new Triage { Id = 3, MascotaId = 3, Nivel = "N2", Estado = "EnEspera", FechaRegistro = DateTime.Today.AddHours(11) };
        // t4 is Atendido (should not be in queue)
        var t4 = new Triage { Id = 4, MascotaId = 1, Nivel = "N1", Estado = "Atendido" };

        await _context.Usuarios.AddAsync(user);
        await _context.Mascotas.AddRangeAsync(m1, m2, m3);
        await _context.Triages.AddRangeAsync(t1, t2, t3, t4);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var queue = await _sut.GetColaTriageAsync();

        // Assert
        Assert.AreEqual(3, queue.Count);
        // Order should be: N1 (t2) -> N2 early (t1) -> N2 late (t3)
        Assert.AreEqual(2, queue[0].Id); // N1
        Assert.AreEqual(1, queue[1].Id); // N2 early
        Assert.AreEqual(3, queue[2].Id); // N2 late
        Assert.IsNotNull(queue[0].Mascota);
        Assert.IsNotNull(queue[0].Mascota.Usuario);
    }

    [TestMethod]
    public async Task GetMascotasActivasConUsuarioAsync_DebeRetornarSoloActivasOrdenadas()
    {
        // Arrange
        var user = new Usuario { Id = 1, Rol = "Cliente" };
        var m1 = new Mascota { Id = 1, Nombre = "Zoe", UsuarioId = 1, Activo = true };
        var m2 = new Mascota { Id = 2, Nombre = "Alpha", UsuarioId = 1, Activo = true };
        var m3 = new Mascota { Id = 3, Nombre = "Beta", UsuarioId = 1, Activo = false }; // Inactive

        await _context.Usuarios.AddAsync(user);
        await _context.Mascotas.AddRangeAsync(m1, m2, m3);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetMascotasActivasConUsuarioAsync();

        // Assert
        Assert.AreEqual(2, result.Count);
        Assert.AreEqual("Alpha", result[0].Nombre); // Alphabetical ordering
        Assert.AreEqual("Zoe", result[1].Nombre);
    }

    [TestMethod]
    public async Task RegistrarSignosVitalesAsync_DebeActualizarSignosYColor()
    {
        // Arrange
        var triage = new Triage { Id = 20, Nivel = "N3", PrioridadColor = "Verde", Estado = "EnEspera" };
        await _context.Triages.AddAsync(triage);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.RegistrarSignosVitalesAsync(20, "N1", "Fiebre alta", 39.5m, 120, 15.2m);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("N1", result.Nivel);
        Assert.AreEqual("Rojo", result.PrioridadColor);
        Assert.AreEqual(39.5m, result.Temperatura);
        Assert.AreEqual(120, result.FrecuenciaCardiaca);
        Assert.AreEqual(15.2m, result.PesoEstimado);
    }

    [TestMethod]
    public async Task CambiarEstadoTriageAsync_DebeActualizarEstadoYTriageYCita()
    {
        // Arrange
        var cita = new Cita { Id = 50, MascotaId = 1, VeterinarioId = 1, ServicioId = 1, Estado = "EnSalaDeEspera" };
        var triage = new Triage { Id = 21, CitaId = 50, MascotaId = 1, Nivel = "N2", Estado = "EnEspera" };
        await _context.Citas.AddAsync(cita);
        await _context.Triages.AddAsync(triage);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.CambiarEstadoTriageAsync(21, "EnAtencion", "Consultorio 1");

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("EnAtencion", result.Estado);
        Assert.AreEqual("Consultorio 1", result.Consultorio);

        var citaInDb = await _context.Citas.FindAsync(50);
        Assert.IsNotNull(citaInDb);
        Assert.AreEqual("EnAtencion", citaInDb!.Estado);
    }
}
