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
public class PostAtencionServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private Mock<INotificacionService> _notificacionServiceMock = null!;
    private PostAtencionService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_PostAtencion_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        _notificacionServiceMock = new Mock<INotificacionService>();

        _sut = new PostAtencionService(_unitOfWork, _notificacionServiceMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task ProgramarSeguimientoPostAtencionAsync_DebeCrearSeguimientoEnEstadoPendiente()
    {
        // Arrange
        var cliente = new Usuario { Id = 1, Nombre = "Juan Pérez", Rol = "Cliente", Email = "juan@t.com" };
        var vet = new Usuario { Id = 2, Nombre = "Dr. Carlos", Rol = "Veterinario", Email = "vet@t.com" };
        var mascota = new Mascota { Id = 10, Nombre = "Firulais", UsuarioId = 1, Especie = "Perro" };
        var cita = new Cita { Id = 100, MascotaId = 10, VeterinarioId = 2, Estado = "Completada" };
        var historial = new HistorialClinico { Id = 50, CitaId = 100, Cita = cita, Cerrado = true };

        await _context.Usuarios.AddRangeAsync(cliente, vet);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Citas.AddAsync(cita);
        await _context.HistorialesClinicos.AddAsync(historial);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.ProgramarSeguimientoPostAtencionAsync(50);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(50, result.HistorialClinicoId);
        Assert.AreEqual("Pendiente", result.Estado);
        Assert.AreEqual(10, result.MascotaId);
        Assert.AreEqual(1, result.ClienteId);
        Assert.IsFalse(result.RequiereAtencionUrgente);
    }

    [TestMethod]
    public async Task RegistrarResultadoSeguimientoAsync_CuandoEvolucionFavorable_DebeMarcarContactado()
    {
        // Arrange
        var seguimiento = new SeguimientoPostAtencion
        {
            Id = 1,
            HistorialClinicoId = 50,
            MascotaId = 10,
            ClienteId = 1,
            Estado = "Pendiente",
            FechaProgramada = DateTime.UtcNow
        };
        await _context.SeguimientosPostAtencion.AddAsync(seguimiento);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.RegistrarResultadoSeguimientoAsync(1, "Contactado", "Favorable", "Paciente comiendo bien sin vomito", false);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("Contactado", result.Estado);
        Assert.AreEqual("Favorable", result.EvolucionPaciente);
        Assert.AreEqual("Paciente comiendo bien sin vomito", result.NotasSeguimiento);
        Assert.IsNotNull(result.FechaContacto);
        Assert.IsFalse(result.RequiereAtencionUrgente);
    }

    [TestMethod]
    public async Task RegistrarResultadoSeguimientoAsync_CuandoComplicacion_DebeMarcarRevisionRequeridaYNotificarVet()
    {
        // Arrange
        var vet = new Usuario { Id = 2, Nombre = "Dr. Carlos", Rol = "Veterinario", Email = "vet@t.com" };
        var seguimiento = new SeguimientoPostAtencion
        {
            Id = 2,
            HistorialClinicoId = 50,
            MascotaId = 10,
            ClienteId = 1,
            VeterinarioId = 2,
            Estado = "Pendiente",
            FechaProgramada = DateTime.UtcNow
        };
        await _context.Usuarios.AddAsync(vet);
        await _context.SeguimientosPostAtencion.AddAsync(seguimiento);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.RegistrarResultadoSeguimientoAsync(2, "Revisión Requerida", "Complicación Urgente", "Mascota sangrando por herida quirúrgica", true);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("Revisión Requerida", result.Estado);
        Assert.IsTrue(result.RequiereAtencionUrgente);

        _notificacionServiceMock.Verify(n => n.CrearNotificacionAsync(
            2,
            "Alerta Post-Atención Urgente",
            It.Is<string>(s => s.Contains("Mascota sangrando")),
            "Warning",
            "medical",
            It.IsAny<string>()
        ), Times.Once);
    }

    [TestMethod]
    public async Task ProgramarRecordatorioVacunaAsync_DebeCrearRecordatorioProgramado()
    {
        // Arrange
        var recordatorio = new RecordatorioVacuna
        {
            MascotaId = 10,
            ClienteId = 1,
            TipoPrevencion = "Vacuna",
            NombreVacuna = "Antirrábica",
            FechaVencimiento = DateTime.UtcNow.AddDays(30)
        };

        // Act
        var result = await _sut.ProgramarRecordatorioVacunaAsync(recordatorio);

        // Assert
        Assert.IsNotNull(result);
        Assert.IsTrue(result.Id > 0);
        Assert.AreEqual("Programado", result.Estado);
        Assert.AreEqual("Antirrábica", result.NombreVacuna);
    }

    [TestMethod]
    public async Task ProcesarNotificacionesRecordatoriosDiariosAsync_DebeEnviarAlertaRecordatorio3DiasAntes()
    {
        // Arrange
        var cliente = new Usuario { Id = 1, Nombre = "María", Rol = "Cliente", Email = "maria@t.com" };
        var mascota = new Mascota { Id = 10, Nombre = "Max", UsuarioId = 1 };
        var rec1 = new RecordatorioVacuna
        {
            Id = 1,
            MascotaId = 10,
            ClienteId = 1,
            TipoPrevencion = "Vacuna",
            NombreVacuna = "Séxtuple Canina",
            FechaVencimiento = DateTime.UtcNow.AddDays(2), // <= 3 días
            Estado = "Programado"
        };
        var rec2 = new RecordatorioVacuna
        {
            Id = 2,
            MascotaId = 10,
            ClienteId = 1,
            TipoPrevencion = "Desparasitación",
            NombreVacuna = "Desparasitante Interno",
            FechaVencimiento = DateTime.UtcNow.AddDays(15), // > 3 días
            Estado = "Programado"
        };

        await _context.Usuarios.AddAsync(cliente);
        await _context.Mascotas.AddAsync(mascota);
        await _context.RecordatoriosVacunas.AddRangeAsync(rec1, rec2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var notificados = await _sut.ProcesarNotificacionesRecordatoriosDiariosAsync();

        // Assert
        Assert.AreEqual(1, notificados);
        var dbRec1 = await _context.RecordatoriosVacunas.FindAsync(1);
        Assert.AreEqual("Notificado", dbRec1!.Estado);
        Assert.IsNotNull(dbRec1.FechaEnvioNotificacion);

        _notificacionServiceMock.Verify(n => n.CrearNotificacionAsync(
            1,
            It.Is<string>(s => s.Contains("Recordatorio")),
            It.Is<string>(s => s.Contains("Séxtuple Canina")),
            "Info",
            "reminder",
            It.IsAny<string>()
        ), Times.Once);
    }
}
