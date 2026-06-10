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
public class HistorialClinicoServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private Mock<INotificacionService> _notificacionServiceMock = null!;
    private HistorialClinicoService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Historial_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        _notificacionServiceMock = new Mock<INotificacionService>();
        
        _sut = new HistorialClinicoService(_unitOfWork, _notificacionServiceMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task GuardarBorradorAsync_CuandoCitaEnAtencion_DebeGuardarEntrada()
    {
        // Arrange
        var usuario = new Usuario { Id = 1, Nombre = "Owner", Email = "owner@test.com" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1 };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var veterinario = new Veterinario { Id = 1, Nombre = "Vet", Email = "vet@test.com", Activo = true };
        var cita = new Cita { Id = 1, MascotaId = 1, VeterinarioId = 1, ServicioId = 1, Estado = "EnAtencion" };
        
        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();

        var historial = new HistorialClinico { CitaId = 1, Diagnostico = "Sano" };

        // Act
        var result = await _sut.GuardarBorradorAsync(historial, "vet@test.com", false);

        // Assert
        Assert.IsTrue(result.Success);
        var historialDb = await _context.HistorialesClinicos.FirstOrDefaultAsync(h => h.CitaId == 1);
        Assert.IsNotNull(historialDb);
        Assert.IsFalse(historialDb!.Cerrado);
        Assert.AreEqual("Sano", historialDb.Diagnostico);
    }

    [TestMethod]
    public async Task GuardarBorradorAsync_CuandoCitaNoEnAtencion_DebeRetornarError()
    {
        // Arrange
        var usuario = new Usuario { Id = 1, Nombre = "Owner", Email = "owner@test.com" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1 };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var veterinario = new Veterinario { Id = 1, Nombre = "Vet", Email = "vet@test.com", Activo = true };
        var cita = new Cita { Id = 1, MascotaId = 1, VeterinarioId = 1, ServicioId = 1, Estado = "Confirmada" };
        
        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();

        var historial = new HistorialClinico { CitaId = 1, Diagnostico = "Sano" };

        // Act
        var result = await _sut.GuardarBorradorAsync(historial, "vet@test.com", true);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("La cita debe estar 'En Atención' para registrar la historia clínica.", result.Error);
    }

    [TestMethod]
    public async Task GetHistorialesByMascotaIdAsync_DebeRetornarListaOrdenadaPorFecha()
    {
        // Arrange
        var usuario = new Usuario { Id = 1, Nombre = "Owner", Email = "owner@test.com" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1 };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var veterinario = new Veterinario { Id = 1, Nombre = "Vet", Email = "vet@test.com", Activo = true };
        
        var cita1 = new Cita { Id = 1, MascotaId = 1, VeterinarioId = 1, ServicioId = 1, FechaHora = DateTime.Now.AddDays(-2) };
        var cita2 = new Cita { Id = 2, MascotaId = 1, VeterinarioId = 1, ServicioId = 1, FechaHora = DateTime.Now };

        var hist1 = new HistorialClinico { Id = 1, CitaId = 1, Cerrado = true };
        var hist2 = new HistorialClinico { Id = 2, CitaId = 2, Cerrado = true };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddRangeAsync(cita1, cita2);
        await _context.HistorialesClinicos.AddRangeAsync(hist1, hist2);
        await _context.SaveChangesAsync();

        // Act
        var historiales = await _sut.GetHistorialesByMascotaIdAsync(1);

        // Assert
        Assert.AreEqual(2, historiales.Count);
        Assert.AreEqual(2, historiales.First().Id); // La fecha más reciente debe estar primero (cita2)
    }

    [TestMethod]
    public async Task GetMascotaWithUsuarioAsync_CuandoMascotaExiste_DebeRetornarMascotaConUsuario()
    {
        // Arrange
        var usuario = new Usuario { Id = 2, Nombre = "John Doe", Email = "john@example.com" };
        var mascota = new Mascota { Id = 2, Nombre = "Rex", UsuarioId = 2 };
        
        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetMascotaWithUsuarioAsync(2);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(2, result.Id);
        Assert.AreEqual("Rex", result.Nombre);
        Assert.IsNotNull(result.Usuario);
        Assert.AreEqual("John Doe", result.Usuario.Nombre);
    }

    [TestMethod]
    public async Task GetHistorialByCitaIdAsync_CuandoExiste_DebeRetornarHistorial()
    {
        // Arrange
        var usuario = new Usuario { Id = 3, Nombre = "Alice", Email = "alice@example.com" };
        var mascota = new Mascota { Id = 3, Nombre = "Luna", UsuarioId = 3 };
        var servicio = new Servicio { Id = 3, Nombre = "Vacunacion", Activo = true };
        var veterinario = new Veterinario { Id = 3, Nombre = "Dr. Smith", Email = "smith@example.com", Activo = true };
        var cita = new Cita { Id = 3, MascotaId = 3, VeterinarioId = 3, ServicioId = 3, FechaHora = DateTime.Now };
        var historial = new HistorialClinico { Id = 3, CitaId = 3, Diagnostico = "Fiebre", Cerrado = true };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddAsync(cita);
        await _context.HistorialesClinicos.AddAsync(historial);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetHistorialByCitaIdAsync(3);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(3, result.Id);
        Assert.AreEqual("Fiebre", result.Diagnostico);
        Assert.IsNotNull(result.Cita);
        Assert.AreEqual("Luna", result.Cita.Mascota.Nombre);
        Assert.AreEqual("Alice", result.Cita.Mascota.Usuario.Nombre);
        Assert.AreEqual("Dr. Smith", result.Cita.Veterinario.Nombre);
        Assert.AreEqual("Vacunacion", result.Cita.Servicio.Nombre);
    }

    [TestMethod]
    public async Task GetHistorialByIdAsync_CuandoExiste_DebeRetornarHistorial()
    {
        // Arrange
        var usuario = new Usuario { Id = 4, Nombre = "Bob", Email = "bob@example.com" };
        var mascota = new Mascota { Id = 4, Nombre = "Thor", UsuarioId = 4 };
        var servicio = new Servicio { Id = 4, Nombre = "Desparasitacion", Activo = true };
        var veterinario = new Veterinario { Id = 4, Nombre = "Dr. House", Email = "house@example.com", Activo = true };
        var cita = new Cita { Id = 4, MascotaId = 4, VeterinarioId = 4, ServicioId = 4, FechaHora = DateTime.Now };
        var historial = new HistorialClinico { Id = 4, CitaId = 4, Diagnostico = "Parasitos", Cerrado = false };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddAsync(cita);
        await _context.HistorialesClinicos.AddAsync(historial);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetHistorialByIdAsync(4);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(4, result.Id);
        Assert.AreEqual("Parasitos", result.Diagnostico);
        Assert.IsNotNull(result.Cita);
        Assert.AreEqual("Thor", result.Cita.Mascota.Nombre);
        Assert.AreEqual("Bob", result.Cita.Mascota.Usuario.Nombre);
        Assert.AreEqual("Dr. House", result.Cita.Veterinario.Nombre);
        Assert.AreEqual("Desparasitacion", result.Cita.Servicio.Nombre);
    }

    [TestMethod]
    public async Task ActualizarBorradorAsync_CuandoNoExisteHistorial_DebeRetornarError()
    {
        // Arrange
        var historialDto = new HistorialClinico { Id = 999 };

        // Act
        var result = await _sut.ActualizarBorradorAsync(historialDto, "vet@example.com", false);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.IsNull(result.Historial);
        Assert.AreEqual("Historial no encontrado.", result.Error);
    }

    [TestMethod]
    public async Task ActualizarBorradorAsync_CuandoHistorialCerrado_DebeRetornarError()
    {
        // Arrange
        var usuario = new Usuario { Id = 5, Nombre = "Charlie", Email = "charlie@example.com" };
        var mascota = new Mascota { Id = 5, Nombre = "Bella", UsuarioId = 5 };
        var servicio = new Servicio { Id = 5, Nombre = "Consulta", Activo = true };
        var veterinario = new Veterinario { Id = 5, Nombre = "Dr. Green", Email = "green@example.com", Activo = true };
        var cita = new Cita { Id = 5, MascotaId = 5, VeterinarioId = 5, ServicioId = 5, FechaHora = DateTime.Now };
        var historial = new HistorialClinico { Id = 5, CitaId = 5, Cerrado = true };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddAsync(cita);
        await _context.HistorialesClinicos.AddAsync(historial);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new HistorialClinico { Id = 5, Diagnostico = "Nuevo Diagnostico" };

        // Act
        var result = await _sut.ActualizarBorradorAsync(dto, "green@example.com", false);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.IsNull(result.Historial);
        Assert.AreEqual("La atención clínica ya fue cerrada y es de solo lectura.", result.Error);
    }

    [TestMethod]
    public async Task ActualizarBorradorAsync_CuandoUsuarioNoAutorizado_DebeRetornarError()
    {
        // Arrange
        var usuario = new Usuario { Id = 6, Nombre = "David", Email = "david@example.com" };
        var mascota = new Mascota { Id = 6, Nombre = "Max", UsuarioId = 6 };
        var servicio = new Servicio { Id = 6, Nombre = "Consulta", Activo = true };
        var veterinario = new Veterinario { Id = 6, Nombre = "Dr. Green", Email = "green@example.com", Activo = true };
        var cita = new Cita { Id = 6, MascotaId = 6, VeterinarioId = 6, ServicioId = 6, FechaHora = DateTime.Now };
        var historial = new HistorialClinico { Id = 6, CitaId = 6, Cerrado = false };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddAsync(cita);
        await _context.HistorialesClinicos.AddAsync(historial);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new HistorialClinico { Id = 6, Diagnostico = "Nuevo Diagnostico" };

        // Act
        var result = await _sut.ActualizarBorradorAsync(dto, "other_vet@example.com", false);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.IsNull(result.Historial);
        Assert.AreEqual("Solo el veterinario asignado a la cita puede editar la atención.", result.Error);
    }

    [TestMethod]
    public async Task ActualizarBorradorAsync_CuandoActualizacionExitosa_DebeActualizarYRetornarExito()
    {
        // Arrange
        var usuario = new Usuario { Id = 7, Nombre = "Elena", Email = "elena@example.com" };
        var mascota = new Mascota { Id = 7, Nombre = "Rocky", UsuarioId = 7, Peso = 10.5m };
        var servicio = new Servicio { Id = 7, Nombre = "Consulta", Activo = true };
        var veterinario = new Veterinario { Id = 7, Nombre = "Dr. Green", Email = "green@example.com", Activo = true };
        var cita = new Cita { Id = 7, MascotaId = 7, VeterinarioId = 7, ServicioId = 7, FechaHora = DateTime.Now };
        var historial = new HistorialClinico 
        { 
            Id = 7, 
            CitaId = 7, 
            Cerrado = false,
            Diagnostico = "Diagnostico Antiguo",
            PesoActual = 10.5m
        };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddAsync(cita);
        await _context.HistorialesClinicos.AddAsync(historial);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new HistorialClinico 
        { 
            Id = 7, 
            Diagnostico = "Diagnostico Nuevo",
            Tratamiento = "Tratamiento Nuevo",
            PesoActual = 12.3m
        };

        // Act
        var result = await _sut.ActualizarBorradorAsync(dto, "green@example.com", false);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.IsNotNull(result.Historial);
        Assert.IsNull(result.Error);
        
        // Check local returned object
        Assert.AreEqual("Diagnostico Nuevo", result.Historial.Diagnostico);
        Assert.AreEqual("Tratamiento Nuevo", result.Historial.Tratamiento);
        Assert.AreEqual(12.3m, result.Historial.PesoActual);

        // Check in db using a clean context read
        _context.ChangeTracker.Clear();
        var historialDb = await _context.HistorialesClinicos.Include(h => h.Cita).ThenInclude(c => c.Mascota).FirstOrDefaultAsync(h => h.Id == 7);
        Assert.IsNotNull(historialDb);
        Assert.AreEqual("Diagnostico Nuevo", historialDb.Diagnostico);
        Assert.AreEqual(12.3m, historialDb.PesoActual);
        Assert.IsNotNull(historialDb.Cita?.Mascota);
        Assert.AreEqual(12.3m, historialDb.Cita.Mascota.Peso);
    }

    [TestMethod]
    public async Task CerrarAtencionAsync_CuandoNoExisteHistorial_DebeRetornarError()
    {
        // Arrange - no history exists for the given citaId (e.g. 999)

        // Act
        var result = await _sut.CerrarAtencionAsync(999, "vet@example.com", false);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Historial no encontrado.", result.Error);
    }

    [TestMethod]
    public async Task CerrarAtencionAsync_CuandoHistorialYaCerrado_DebeRetornarError()
    {
        // Arrange
        var usuario = new Usuario { Id = 8, Nombre = "Felix", Email = "felix@example.com" };
        var mascota = new Mascota { Id = 8, Nombre = "Coco", UsuarioId = 8 };
        var servicio = new Servicio { Id = 8, Nombre = "Consulta", Activo = true };
        var veterinario = new Veterinario { Id = 8, Nombre = "Dr. Green", Email = "green@example.com", Activo = true };
        var cita = new Cita { Id = 8, MascotaId = 8, VeterinarioId = 8, ServicioId = 8, FechaHora = DateTime.Now };
        var historial = new HistorialClinico { Id = 8, CitaId = 8, Cerrado = true };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddAsync(cita);
        await _context.HistorialesClinicos.AddAsync(historial);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.CerrarAtencionAsync(8, "green@example.com", false);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("La atención ya se encuentra cerrada.", result.Error);
    }

    [TestMethod]
    public async Task CerrarAtencionAsync_CuandoUsuarioNoAutorizado_DebeRetornarError()
    {
        // Arrange
        var usuario = new Usuario { Id = 9, Nombre = "Felix", Email = "felix@example.com" };
        var mascota = new Mascota { Id = 9, Nombre = "Coco", UsuarioId = 9 };
        var servicio = new Servicio { Id = 9, Nombre = "Consulta", Activo = true };
        var veterinario = new Veterinario { Id = 9, Nombre = "Dr. Green", Email = "green@example.com", Activo = true };
        var cita = new Cita { Id = 9, MascotaId = 9, VeterinarioId = 9, ServicioId = 9, FechaHora = DateTime.Now };
        var historial = new HistorialClinico { Id = 9, CitaId = 9, Cerrado = false };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddAsync(cita);
        await _context.HistorialesClinicos.AddAsync(historial);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.CerrarAtencionAsync(9, "other_vet@example.com", false);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Solo el veterinario asignado puede cerrar la atención.", result.Error);
    }

    [TestMethod]
    public async Task CerrarAtencionAsync_CuandoCierreExitoso_DebeCerrarAtencionActualizarCitaYTriageYNotificar()
    {
        // Arrange
        var usuario = new Usuario { Id = 10, Nombre = "Felix", Email = "felix@example.com" };
        var mascota = new Mascota { Id = 10, Nombre = "Coco", UsuarioId = 10 };
        var servicio = new Servicio { Id = 10, Nombre = "Consulta", Activo = true };
        var veterinario = new Veterinario { Id = 10, Nombre = "Dr. Green", Email = "green@example.com", Activo = true };
        var cita = new Cita { Id = 10, MascotaId = 10, VeterinarioId = 10, ServicioId = 10, FechaHora = DateTime.Now, Estado = "EnAtencion" };
        var historial = new HistorialClinico { Id = 10, CitaId = 10, Cerrado = false };
        var triage = new Triage { Id = 10, CitaId = 10, MascotaId = 10, Estado = "EnAtencion", Nivel = "Amarillo" };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddAsync(cita);
        await _context.HistorialesClinicos.AddAsync(historial);
        await _context.Triages.AddAsync(triage);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _notificacionServiceMock
            .Setup(n => n.NotificarCitaCompletadaAsync(It.IsAny<Cita>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.CerrarAtencionAsync(10, "green@example.com", false);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.IsNull(result.Error);

        _context.ChangeTracker.Clear();
        var historialDb = await _context.HistorialesClinicos.Include(h => h.Cita).FirstOrDefaultAsync(h => h.Id == 10);
        Assert.IsNotNull(historialDb);
        Assert.IsTrue(historialDb.Cerrado);
        Assert.IsNotNull(historialDb.Cita);
        Assert.AreEqual("Completada", historialDb.Cita.Estado);

        var triageDb = await _context.Triages.FirstOrDefaultAsync(t => t.Id == 10);
        Assert.IsNotNull(triageDb);
        Assert.AreEqual("Atendido", triageDb.Estado);

        _notificacionServiceMock.Verify(n => n.NotificarCitaCompletadaAsync(It.Is<Cita>(c => c.Id == 10)), Times.Once);
    }

    [TestMethod]
    public async Task GetCitaForHistorialAsync_DebeRetornarCorrectamente()
    {
        // Arrange
        var usuario = new Usuario { Id = 1, Nombre = "Owner", Email = "owner@test.com" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1 };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var veterinario = new Veterinario { Id = 1, Nombre = "Vet", Email = "vet@test.com", Activo = true };
        var cita = new Cita { Id = 20, MascotaId = 1, VeterinarioId = 1, ServicioId = 1 };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act & Assert
        var result = await _sut.GetCitaForHistorialAsync(20);
        Assert.IsNotNull(result);

        var nullResult = await _sut.GetCitaForHistorialAsync(999);
        Assert.IsNull(nullResult);
    }

    [TestMethod]
    public async Task ExistsHistorialForCitaAsync_DebeRetornarFalseCuandoNoExiste()
    {
        var result = await _sut.ExistsHistorialForCitaAsync(999);
        Assert.IsFalse(result);
    }

    [TestMethod]
    public async Task GuardarBorradorAsync_CuandoCitaNoExiste_DebeRetornarError()
    {
        var result = await _sut.GuardarBorradorAsync(new HistorialClinico { CitaId = 999 }, "vet@test.com", false);
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Cita no encontrada.", result.Error);
    }

    [TestMethod]
    public async Task GuardarBorradorAsync_CuandoUsuarioNoAutorizado_DebeRetornarError()
    {
        // Arrange
        var usuario = new Usuario { Id = 1, Nombre = "Owner", Email = "owner@test.com" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1 };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var vet = new Veterinario { Id = 1, Email = "assigned@test.com", Activo = true, Nombre = "Vet" };
        var cita = new Cita { Id = 1, MascotaId = 1, ServicioId = 1, VeterinarioId = 1, Estado = "EnAtencion", Veterinario = vet };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GuardarBorradorAsync(new HistorialClinico { CitaId = 1 }, "unauthorized@test.com", false);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Solo el veterinario asignado a la cita puede registrar la atención.", result.Error);
    }

    [TestMethod]
    public async Task GuardarBorradorAsync_CuandoYaExisteHistorial_DebeRetornarError()
    {
        // Arrange
        var usuario = new Usuario { Id = 1, Nombre = "Owner", Email = "owner@test.com" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1 };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var vet = new Veterinario { Id = 1, Email = "assigned@test.com", Activo = true, Nombre = "Vet" };
        var cita = new Cita { Id = 1, MascotaId = 1, ServicioId = 1, VeterinarioId = 1, Estado = "EnAtencion", Veterinario = vet };
        var existing = new HistorialClinico { CitaId = 1, Cerrado = false };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddAsync(cita);
        await _context.HistorialesClinicos.AddAsync(existing);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GuardarBorradorAsync(new HistorialClinico { CitaId = 1 }, "assigned@test.com", false);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Ya existe un historial para esta cita.", result.Error);
    }

    [TestMethod]
    public async Task ActualizarBorradorAsync_CuandoPesoActualNulo_NoDebeActualizarPesoMascota()
    {
        // Arrange
        var usuario = new Usuario { Id = 7, Nombre = "Elena", Email = "elena@example.com" };
        var mascota = new Mascota { Id = 7, Nombre = "Rocky", UsuarioId = 7, Peso = 10.5m };
        var servicio = new Servicio { Id = 7, Nombre = "Consulta", Activo = true };
        var veterinario = new Veterinario { Id = 7, Nombre = "Dr. Green", Email = "green@example.com", Activo = true };
        var cita = new Cita { Id = 7, MascotaId = 7, VeterinarioId = 7, ServicioId = 7, FechaHora = DateTime.Now };
        var historial = new HistorialClinico 
        { 
            Id = 7, 
            CitaId = 7, 
            Cerrado = false,
            Diagnostico = "Diagnostico Antiguo",
            PesoActual = 10.5m
        };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddAsync(cita);
        await _context.HistorialesClinicos.AddAsync(historial);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new HistorialClinico 
        { 
            Id = 7, 
            Diagnostico = "Diagnostico Nuevo",
            Tratamiento = "Tratamiento Nuevo",
            PesoActual = null // Peso is null
        };

        // Act
        var result = await _sut.ActualizarBorradorAsync(dto, "green@example.com", false);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.IsNull(result.Historial!.PesoActual);
        
        // Peso of the pet should remain unchanged
        _context.ChangeTracker.Clear();
        var pet = await _context.Mascotas.FindAsync(7);
        Assert.AreEqual(10.5m, pet!.Peso);
    }
}

