using System;
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
public class ListaEsperaTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private Mock<IAuditoriaService> _auditoriaServiceMock = null!;
    private Mock<IRealTimeNotificationService> _realTimeMock = null!;
    private Mock<ICorreoService> _correoMock = null!;
    private CitaService _citaService = null!;
    private NotificacionService _notificacionService = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_ListaEspera_" + Guid.NewGuid().ToString(),
                inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        _auditoriaServiceMock = new Mock<IAuditoriaService>();
        _realTimeMock = new Mock<IRealTimeNotificationService>();
        _correoMock = new Mock<ICorreoService>();
        _citaService = new CitaService(_unitOfWork, _auditoriaServiceMock.Object, _realTimeMock.Object);
        _notificacionService = new NotificacionService(_unitOfWork, _realTimeMock.Object, _correoMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    private async Task SeedBaseDataAsync()
    {
        var usuario = new Usuario
        {
            Id = 1, Nombre = "Juan Pérez", Email = "juan@test.com",
            Telefono = "999999999", Rol = "Cliente", Activo = true, RecibirRecordatorios = true
        };
        var mascota = new Mascota
        {
            Id = 1, Nombre = "Bobby", Especie = "Perro", UsuarioId = 1
        };
        var servicio = new Servicio
        {
            Id = 1, Nombre = "Consulta General", Precio = 50, DuracionMinutos = 30, Activo = true
        };
        var veterinario = new Veterinario
        {
            Id = 1, Nombre = "Dr. López", Especialidad = "General", Activo = true
        };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.SaveChangesAsync();
    }

    // ===================== Sprint 2 Tests =====================

    [TestMethod]
    public async Task CancelarCitaAsync_ConListaEsperaPendiente_DebeMarcarComoNotificada()
    {
        // Arrange
        await SeedBaseDataAsync();
        var fechaCita = DateTime.Now.AddDays(3);

        var cita = new Cita
        {
            Id = 1, MascotaId = 1, VeterinarioId = 1, ServicioId = 1,
            FechaHora = fechaCita, Estado = "Confirmada", MontoTotal = 50
        };
        await _context.Citas.AddAsync(cita);

        var espera = new ListaEspera
        {
            Id = 1, MascotaId = 1, ServicioId = 1,
            FechaDeseada = fechaCita.Date.AddDays(-1),
            FechaDeseadaFin = fechaCita.Date.AddDays(1),
            Estado = "Pendiente", FechaCreacion = DateTime.UtcNow.AddHours(-2)
        };
        await _context.ListaEsperas.AddAsync(espera);
        await _context.SaveChangesAsync();

        // Act
        var result = await _citaService.CancelarCitaAsync(1, true, null);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual("Cancelada", result.Cita!.Estado);

        var updatedEspera = await _context.ListaEsperas.FindAsync(1);
        Assert.AreEqual("Notificada", updatedEspera!.Estado);
        Assert.IsNotNull(updatedEspera.FechaNotificacion);
    }

    [TestMethod]
    public async Task CancelarCitaAsync_SinListaEspera_NoCambiaNada()
    {
        // Arrange
        await SeedBaseDataAsync();
        var fechaCita = DateTime.Now.AddDays(3);

        var cita = new Cita
        {
            Id = 1, MascotaId = 1, VeterinarioId = 1, ServicioId = 1,
            FechaHora = fechaCita, Estado = "Confirmada", MontoTotal = 50
        };
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();

        // Act
        var result = await _citaService.CancelarCitaAsync(1, true, null);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual("Cancelada", result.Cita!.Estado);

        var listaEsperas = await _context.ListaEsperas.CountAsync();
        Assert.AreEqual(0, listaEsperas);
    }

    [TestMethod]
    public async Task CancelarCitaAsync_ConListaEsperaFueraDeRango_NoNotifica()
    {
        // Arrange
        await SeedBaseDataAsync();
        var fechaCita = DateTime.Now.AddDays(3);

        var cita = new Cita
        {
            Id = 1, MascotaId = 1, VeterinarioId = 1, ServicioId = 1,
            FechaHora = fechaCita, Estado = "Confirmada", MontoTotal = 50
        };
        await _context.Citas.AddAsync(cita);

        // Waitlist entry for a different date range
        var espera = new ListaEspera
        {
            Id = 1, MascotaId = 1, ServicioId = 1,
            FechaDeseada = fechaCita.Date.AddDays(5),
            FechaDeseadaFin = fechaCita.Date.AddDays(10),
            Estado = "Pendiente", FechaCreacion = DateTime.UtcNow
        };
        await _context.ListaEsperas.AddAsync(espera);
        await _context.SaveChangesAsync();

        // Act
        var result = await _citaService.CancelarCitaAsync(1, true, null);

        // Assert
        Assert.IsTrue(result.Success);
        var updatedEspera = await _context.ListaEsperas.FindAsync(1);
        Assert.AreEqual("Pendiente", updatedEspera!.Estado); // Still Pendiente, not notified
    }

    [TestMethod]
    public async Task CancelarCitaAsync_ListaEsperaFIFO_NotificaPrimerEntrante()
    {
        // Arrange
        await SeedBaseDataAsync();
        // Add second user/mascota
        var usuario2 = new Usuario
        {
            Id = 2, Nombre = "María López", Email = "maria@test.com",
            Telefono = "888888888", Rol = "Cliente", Activo = true
        };
        var mascota2 = new Mascota { Id = 2, Nombre = "Luna", Especie = "Gato", UsuarioId = 2 };
        await _context.Usuarios.AddAsync(usuario2);
        await _context.Mascotas.AddAsync(mascota2);

        var fechaCita = DateTime.Now.AddDays(3);
        var cita = new Cita
        {
            Id = 1, MascotaId = 1, VeterinarioId = 1, ServicioId = 1,
            FechaHora = fechaCita, Estado = "Confirmada", MontoTotal = 50
        };
        await _context.Citas.AddAsync(cita);

        // First entrant (should be notified - FIFO)
        var espera1 = new ListaEspera
        {
            Id = 1, MascotaId = 1, ServicioId = 1,
            FechaDeseada = fechaCita.Date.AddDays(-1),
            FechaDeseadaFin = fechaCita.Date.AddDays(1),
            Estado = "Pendiente", FechaCreacion = DateTime.UtcNow.AddHours(-5)
        };
        // Second entrant (should NOT be notified)
        var espera2 = new ListaEspera
        {
            Id = 2, MascotaId = 2, ServicioId = 1,
            FechaDeseada = fechaCita.Date.AddDays(-1),
            FechaDeseadaFin = fechaCita.Date.AddDays(1),
            Estado = "Pendiente", FechaCreacion = DateTime.UtcNow.AddHours(-1)
        };
        await _context.ListaEsperas.AddRangeAsync(new[] { espera1, espera2 });
        await _context.SaveChangesAsync();

        // Act
        var result = await _citaService.CancelarCitaAsync(1, true, null);

        // Assert
        Assert.IsTrue(result.Success);
        var updated1 = await _context.ListaEsperas.FindAsync(1);
        var updated2 = await _context.ListaEsperas.FindAsync(2);
        Assert.AreEqual("Notificada", updated1!.Estado); // First entrant notified
        Assert.AreEqual("Pendiente", updated2!.Estado); // Second entrant still pending
    }

    [TestMethod]
    public async Task NotificarListaEsperaDisponibleAsync_DebeCrearNotificacionYEnviarCorreo()
    {
        // Arrange
        await SeedBaseDataAsync();
        var fechaCita = DateTime.Now.AddDays(3);
        var cita = new Cita
        {
            Id = 1, MascotaId = 1, VeterinarioId = 1, ServicioId = 1,
            FechaHora = fechaCita, Estado = "Cancelada", MontoTotal = 50
        };
        await _context.Citas.AddAsync(cita);

        var entry = new ListaEspera
        {
            Id = 1, MascotaId = 1, ServicioId = 1,
            FechaDeseada = fechaCita.Date, FechaDeseadaFin = fechaCita.Date.AddDays(1),
            Estado = "Notificada", FechaCreacion = DateTime.UtcNow
        };
        await _context.ListaEsperas.AddAsync(entry);
        await _context.SaveChangesAsync();

        // Act
        await _notificacionService.NotificarListaEsperaDisponibleAsync(entry, cita);

        // Assert
        var notificaciones = await _context.Notificaciones.ToListAsync();
        Assert.AreEqual(1, notificaciones.Count);
        Assert.IsTrue(notificaciones[0].Titulo.Contains("Cupo Disponible"));
        Assert.AreEqual("Info", notificaciones[0].Tipo);
        Assert.AreEqual(1, notificaciones[0].UsuarioId);

        _correoMock.Verify(c => c.EnviarCorreoAsync("juan@test.com", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [TestMethod]
    public async Task ListaEspera_Entity_DefaultValues_SonCorrectos()
    {
        // Arrange & Act
        var entry = new ListaEspera
        {
            MascotaId = 1,
            ServicioId = 1,
            FechaDeseada = DateTime.UtcNow.Date,
            FechaDeseadaFin = DateTime.UtcNow.Date.AddDays(5)
        };

        // Assert
        Assert.AreEqual("Pendiente", entry.Estado);
        Assert.IsNull(entry.FechaNotificacion);
        Assert.IsNull(entry.VeterinarioPreferidoId);
    }
}
