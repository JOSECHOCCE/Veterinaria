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
public class NotificacionServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private Mock<IRealTimeNotificationService> _realTimeMock = null!;
    private Mock<ICorreoService> _correoMock = null!;
    private NotificacionService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Notif_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        
        _realTimeMock = new Mock<IRealTimeNotificationService>();
        _correoMock = new Mock<ICorreoService>();
        
        _sut = new NotificacionService(_unitOfWork, _realTimeMock.Object, _correoMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task NotificarRecordatorioCitaAsync_CuandoExitoso_DebeEnviarCorreoYNotificacion()
    {
        // Arrange
        var usuario = new Usuario { Id = 1, ApplicationUserId = "app-user", Email = "test@test.com", RecibirRecordatorios = true };
        var mascota = new Mascota { Id = 1, UsuarioId = 1, Nombre = "Fido" };
        var vet = new Veterinario { Id = 1, Nombre = "Dr. Smith" };
        var cita = new Cita { Id = 1, MascotaId = 1, VeterinarioId = 1, FechaHora = DateTime.Now.AddDays(1) };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();

        // Act
        await _sut.NotificarRecordatorioCitaAsync(cita);

        // Assert
        var notif = await _context.Notificaciones.FirstOrDefaultAsync(n => n.UsuarioId == 1);
        Assert.IsNotNull(notif);
        Assert.IsTrue(notif!.Mensaje.Contains("Fido"));
        Assert.IsTrue(notif.Mensaje.Contains("Dr. Smith"));
        
        _correoMock.Verify(c => c.EnviarCorreoAsync("test@test.com", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        _realTimeMock.Verify(r => r.SendNotificationAsync("app-user", It.IsAny<object>()), Times.Once);
    }

    [TestMethod]
    public async Task NotificarRecordatorioCitaAsync_CuandoSinCorreo_DebeCrearNotificacionPeroNoEnviarCorreo()
    {
        // Arrange
        var usuario = new Usuario { Id = 1, ApplicationUserId = "app-user", Email = "", RecibirRecordatorios = true };
        var mascota = new Mascota { Id = 1, UsuarioId = 1, Nombre = "Fido" };
        var vet = new Veterinario { Id = 1, Nombre = "Dr. Smith" };
        var cita = new Cita { Id = 1, MascotaId = 1, VeterinarioId = 1, FechaHora = DateTime.Now.AddDays(1) };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();

        // Act
        await _sut.NotificarRecordatorioCitaAsync(cita);

        // Assert
        var notif = await _context.Notificaciones.FirstOrDefaultAsync(n => n.UsuarioId == 1);
        Assert.IsNotNull(notif);
        
        _correoMock.Verify(c => c.EnviarCorreoAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        _realTimeMock.Verify(r => r.SendNotificationAsync("app-user", It.IsAny<object>()), Times.Once);
    }

    [TestMethod]
    public async Task MarcarComoLeidaAsync_CuandoExitoso_DebeActualizarEstado()
    {
        // Arrange
        var notificacion = new Notificacion { Id = 1, UsuarioId = 1, Titulo = "T", Mensaje = "M", Leida = false };
        await _context.Notificaciones.AddAsync(notificacion);
        await _context.SaveChangesAsync();

        // Act
        await _sut.MarcarComoLeidaAsync(1);

        // Assert
        var updated = await _context.Notificaciones.FindAsync(1);
        Assert.IsTrue(updated!.Leida);
        Assert.IsNotNull(updated.FechaLectura);
    }

    [TestMethod]
    public async Task ContarNoLeidasAsync_DebeRetornarConteo()
    {
        // Arrange
        var n1 = new Notificacion { Id = 1, UsuarioId = 10, Leida = false, Titulo = "T", Mensaje = "M" };
        var n2 = new Notificacion { Id = 2, UsuarioId = 10, Leida = true, Titulo = "T", Mensaje = "M" };
        await _context.Notificaciones.AddRangeAsync(n1, n2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var count = await _sut.ContarNoLeidasAsync(10);

        // Assert
        Assert.AreEqual(1, count);
    }

    [TestMethod]
    public async Task MarcarTodasComoLeidasAsync_DebeActualizarLeida()
    {
        // Arrange
        var n1 = new Notificacion { Id = 1, UsuarioId = 10, Leida = false, Titulo = "T", Mensaje = "M" };
        var n2 = new Notificacion { Id = 2, UsuarioId = 10, Leida = false, Titulo = "T", Mensaje = "M" };
        await _context.Notificaciones.AddRangeAsync(n1, n2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        await _sut.MarcarTodasComoLeidasAsync(10);

        // Assert
        var list = await _context.Notificaciones.Where(n => n.UsuarioId == 10).ToListAsync();
        Assert.IsTrue(list.All(n => n.Leida));
    }

    [TestMethod]
    public async Task EliminarNotificacionAsync_DebeRemover()
    {
        // Arrange
        var n1 = new Notificacion { Id = 5, UsuarioId = 10, Leida = false, Titulo = "T", Mensaje = "M" };
        await _context.Notificaciones.AddAsync(n1);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        await _sut.EliminarNotificacionAsync(5);

        // Assert
        var inDb = await _context.Notificaciones.FindAsync(5);
        Assert.IsNull(inDb);
    }

    [TestMethod]
    public async Task ObtenerNotificacionesUsuarioAsync_DebeRetornarList()
    {
        // Arrange
        var n1 = new Notificacion { Id = 1, UsuarioId = 10, Leida = false, Titulo = "T", Mensaje = "M" };
        await _context.Notificaciones.AddAsync(n1);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var list = await _sut.ObtenerNotificacionesUsuarioAsync(10);

        // Assert
        Assert.AreEqual(1, list.Count());
        Assert.AreEqual(1, list.First().Id);
    }

    [TestMethod]
    public async Task NotificarCitasEstados_DebeCrearNotificacionesYEnviarAlertas()
    {
        // Arrange
        var usuario = new Usuario { Id = 1, ApplicationUserId = "app-user", Email = "owner@test.com" };
        var mascota = new Mascota { Id = 1, Nombre = "Coco", UsuarioId = 1, Usuario = usuario };
        var vet = new Veterinario { Id = 1, Nombre = "Vet" };
        var servicio = new Servicio { Id = 1, Nombre = "Vacuna" };
        var cita = new Cita { Id = 1, MascotaId = 1, Mascota = mascota, VeterinarioId = 1, Veterinario = vet, ServicioId = 1, Servicio = servicio, FechaHora = DateTime.Now };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Servicios.AddAsync(servicio);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act & Assert
        // Confirmada
        await _sut.NotificarCitaConfirmadaAsync(cita);
        Assert.IsTrue(_context.Notificaciones.Any(n => n.Titulo.Contains("Confirmada")));

        // En Proceso
        await _sut.NotificarCitaEnProcesoAsync(cita);
        Assert.IsTrue(_context.Notificaciones.Any(n => n.Titulo.Contains("Proceso") || n.Titulo.Contains("Iniciada") || n.Titulo.Contains("atendida")));

        // Completada
        await _sut.NotificarCitaCompletadaAsync(cita);
        Assert.IsTrue(_context.Notificaciones.Any(n => n.Titulo.Contains("Finalizada")));

        // Cancelada
        await _sut.NotificarCitaCanceladaAsync(cita);
        Assert.IsTrue(_context.Notificaciones.Any(n => n.Titulo.Contains("Cancelada")));

        // Rechazada
        await _sut.NotificarCitaRechazadaAsync(cita);
        Assert.IsTrue(_context.Notificaciones.Any(n => n.Titulo.Contains("Rechazada")));

        // Reprogramada
        await _sut.NotificarCitaReprogramadaAsync(cita);
        Assert.IsTrue(_context.Notificaciones.Any(n => n.Titulo.Contains("Reprogramada")));

        // Pago Recibido
        await _sut.NotificarPagoRecibidoAsync(cita, 100);
        Assert.IsTrue(_context.Notificaciones.Any(n => n.Titulo.Contains("Pago")));

        // Proximo Control
        var historial = new HistorialClinico { Id = 1, CitaId = 1, ProximoControl = DateTime.Today.AddDays(30) };
        await _context.HistorialesClinicos.AddAsync(historial);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();
        await _sut.NotificarProximoControlAsync(historial);
        Assert.IsTrue(_context.Notificaciones.Any(n => n.Titulo.Contains("Control") || n.Titulo.Contains("Próxima")));

        // Nueva Cita Solicitada
        var admin = new Usuario { Id = 2, Nombre = "Admin", Rol = "Admin", Activo = true };
        await _context.Usuarios.AddAsync(admin);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();
        await _sut.NotificarNuevaCitaSolicitadaAsync(cita);
        Assert.IsTrue(_context.Notificaciones.Any(n => n.UsuarioId == 2));
    }

    [TestMethod]
    public async Task ProcesarAlertasDiariasAsync_DebeNotificarCitasCercanasYPagosVencidos()
    {
        // Arrange
        var ahora = DateTime.Now;
        var usuario = new Usuario { Id = 1, ApplicationUserId = "app-user", Email = "owner@test.com" };
        var mascota = new Mascota { Id = 1, Nombre = "Coco", UsuarioId = 1, Usuario = usuario };
        var vet = new Veterinario { Id = 1, Nombre = "Vet" };
        var servicio = new Servicio { Id = 1, Nombre = "Vacuna" };
        
        var citaManana = new Cita { Id = 1, MascotaId = 1, Mascota = mascota, VeterinarioId = 1, Veterinario = vet, ServicioId = 1, Servicio = servicio, FechaHora = ahora.AddDays(1), Estado = "Confirmada" };
        var citaVence = new Cita { Id = 2, MascotaId = 1, Mascota = mascota, VeterinarioId = 1, Veterinario = vet, ServicioId = 1, Servicio = servicio, FechaHora = ahora.AddHours(2), Estado = "Pendiente de confirmación", FechaCreacion = ahora.AddHours(-13) };
        var citaPagoRetrasado = new Cita { Id = 3, MascotaId = 1, Mascota = mascota, VeterinarioId = 1, Veterinario = vet, ServicioId = 1, Servicio = servicio, FechaHora = ahora.AddDays(-4), Estado = "Completada", EstadoPago = "Pendiente", MontoTotal = 100, MontoPagado = 0 };

        var admin = new Usuario { Id = 2, Nombre = "Admin", Rol = "Admin", Activo = true };

        await _context.Usuarios.AddRangeAsync(usuario, admin);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Servicios.AddAsync(servicio);
        await _context.Citas.AddRangeAsync(citaManana, citaVence, citaPagoRetrasado);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        await _sut.ProcesarAlertasDiariasAsync();

        // Assert
        Assert.IsTrue(await _context.Notificaciones.AnyAsync(n => n.UsuarioId == 1 && n.Titulo.Contains("Recordatorio")));
        Assert.IsTrue(await _context.Notificaciones.AnyAsync(n => n.UsuarioId == 2 && n.Titulo.Contains("Vencer")));
        Assert.IsTrue(await _context.Notificaciones.AnyAsync(n => n.UsuarioId == 2 && n.Titulo.Contains("Pago Pendiente Retrasado")));
    }
}
