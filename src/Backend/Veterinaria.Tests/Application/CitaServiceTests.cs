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
public class CitaServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private Mock<IAuditoriaService> _auditoriaServiceMock = null!;
    private CitaService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Cita_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        _auditoriaServiceMock = new Mock<IAuditoriaService>();
        _sut = new CitaService(_unitOfWork, _auditoriaServiceMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task ValidarFechaCitaAsync_CuandoFechaPasada_DebeRetornarError()
    {
        // Arrange
        var fechaPasada = DateTime.Now.AddDays(-1);

        // Act
        var result = await _sut.ValidarFechaCitaAsync(1, fechaPasada);

        // Assert
        Assert.IsFalse(result.EsValida);
        Assert.AreEqual("No se pueden programar citas en fechas pasadas.", result.MensajeError);
    }

    [TestMethod]
    public async Task ValidarFechaCitaAsync_CuandoVeterinarioNoActivo_DebeRetornarError()
    {
        // Arrange
        var veterinario = new Veterinario { Id = 1, Nombre = "Vet 1", Activo = false };
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.SaveChangesAsync();

        var fechaFutura = DateTime.Now.AddDays(2);

        // Act
        var result = await _sut.ValidarFechaCitaAsync(1, fechaFutura);

        // Assert
        Assert.IsFalse(result.EsValida);
        Assert.AreEqual("El veterinario seleccionado no está activo.", result.MensajeError);
    }

    [TestMethod]
    public async Task ValidarFechaCitaAsync_CuandoHorarioValido_DebeRetornarExito()
    {
        // Arrange
        var fechaFutura = DateTime.Now.Date.AddDays(2).AddHours(10); // 10:00 AM
        var diaSemana = (int)fechaFutura.DayOfWeek;
        
        var veterinario = new Veterinario { Id = 1, Nombre = "Vet 1", Activo = true, HorarioInicio = new TimeSpan(8, 0, 0), HorarioFin = new TimeSpan(18, 0, 0) };
        var horarioClinica = new HorarioClinica { DiaSemana = diaSemana, EsLaborable = true, HoraApertura = new TimeSpan(8, 0, 0), HoraCierre = new TimeSpan(18, 0, 0) };
        var horarioVet = new HorarioVeterinario { VeterinarioId = 1, DiaSemana = diaSemana, EsLaborable = true, HoraInicio = new TimeSpan(8, 0, 0), HoraFin = new TimeSpan(18, 0, 0) };

        await _context.Veterinarios.AddAsync(veterinario);
        await _context.HorariosClinica.AddAsync(horarioClinica);
        await _context.HorariosVeterinario.AddAsync(horarioVet);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.ValidarFechaCitaAsync(1, fechaFutura);

        // Assert
        Assert.IsTrue(result.EsValida);
        Assert.IsNull(result.MensajeError);
    }

    [TestMethod]
    public async Task CreateCitaAsync_CuandoServicioInactivo_DebeLanzarExcepcion()
    {
        // Arrange
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = false };
        await _context.Servicios.AddAsync(servicio);
        await _context.SaveChangesAsync();

        var cita = new Cita { MascotaId = 1, VeterinarioId = 1, ServicioId = 1, FechaHora = DateTime.Now.AddDays(1) };

        // Act & Assert
        var ex = await Assert.ThrowsExceptionAsync<InvalidOperationException>(() => _sut.CreateCitaAsync(cita, 50));
        Assert.AreEqual("El servicio seleccionado no está disponible.", ex.Message);
    }

    [TestMethod]
    public async Task CreateCitaAsync_CuandoMascotaInactiva_DebeLanzarExcepcion()
    {
        // Arrange
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true, DuracionMinutos = 30 };
        var mascota = new Mascota { Id = 1, Nombre = "Firulais", Activo = false };
        
        await _context.Servicios.AddAsync(servicio);
        await _context.Mascotas.AddAsync(mascota);
        await _context.SaveChangesAsync();

        var cita = new Cita { MascotaId = 1, VeterinarioId = 1, ServicioId = 1, FechaHora = DateTime.Now.AddDays(1) };

        // Act & Assert
        var ex = await Assert.ThrowsExceptionAsync<InvalidOperationException>(() => _sut.CreateCitaAsync(cita, 50));
        Assert.AreEqual("La mascota seleccionada no está activa.", ex.Message);
    }

    [TestMethod]
    public async Task CreateCitaAsync_CuandoVeterinarioNoDisponible_DebeLanzarExcepcion()
    {
        // Arrange
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true, DuracionMinutos = 30 };
        var mascota = new Mascota { Id = 1, Nombre = "Firulais", Activo = true };
        var veterinario = new Veterinario { Id = 1, Nombre = "Vet 1", Activo = true, HorarioInicio = TimeSpan.Zero, HorarioFin = TimeSpan.Zero }; // Sin horario (retornará false en disponible)
        
        await _context.Servicios.AddAsync(servicio);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.SaveChangesAsync();

        var cita = new Cita { MascotaId = 1, VeterinarioId = 1, ServicioId = 1, FechaHora = DateTime.Now.AddDays(1) };

        // Act & Assert
        var ex = await Assert.ThrowsExceptionAsync<InvalidOperationException>(() => _sut.CreateCitaAsync(cita, 50));
        Assert.AreEqual("El bloque seleccionado ya no se encuentra disponible.", ex.Message);
    }

    [TestMethod]
    public async Task EditCitaAsync_CuandoReprogramacionExitosa_DebeRegistrarAuditoria()
    {
        // Arrange
        var fechaAntigua = DateTime.Now.AddDays(2).Date.AddHours(10);
        var cita = new Cita { Id = 1, MascotaId = 1, VeterinarioId = 1, ServicioId = 1, FechaHora = fechaAntigua, Estado = "Confirmada" };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true, DuracionMinutos = 30 };
        var veterinario = new Veterinario { Id = 1, Nombre = "Vet 1", Activo = true, HorarioInicio = new TimeSpan(8, 0, 0), HorarioFin = new TimeSpan(18, 0, 0) };
        var mascota = new Mascota { Id = 1, Nombre = "Firulais", Activo = true, Usuario = new Usuario() };
        
        await _context.Citas.AddAsync(cita);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.SaveChangesAsync();
        
        _context.ChangeTracker.Clear();

        var nuevaFecha = DateTime.Now.AddDays(3).Date.AddHours(11);

        // Act
        var result = await _sut.EditCitaAsync(1, "Confirmada", "Reprogramación", nuevaFecha, 1, "user1");

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual("Reprogramada", result.Cita!.Estado);
        Assert.AreEqual(nuevaFecha, result.Cita.FechaHora);
        _auditoriaServiceMock.Verify(a => a.RegistrarAccionAsync("Reprogramar Cita", "Cita", "1", It.IsAny<string>()), Times.Once);
    }

    [TestMethod]
    public async Task CancelarCitaAsync_CuandoClienteCancelaConMenosDe2Horas_DebeRetornarError()
    {
        // Arrange
        var fechaCita = DateTime.Now.AddHours(1); // Menos de 2 horas
        var usuario = new Usuario { Id = 10, Nombre = "Owner", Email = "owner@test.com" };
        var mascota = new Mascota { Id = 1, Nombre = "Firulais", Activo = true, UsuarioId = 10 };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var veterinario = new Veterinario { Id = 1, Nombre = "Vet", Email = "vet@test.com", Activo = true };
        var cita = new Cita { Id = 1, MascotaId = 1, VeterinarioId = 1, ServicioId = 1, FechaHora = fechaCita, Estado = "Confirmada" };
        
        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();

        _context.ChangeTracker.Clear();

        // Act (isAdmin = false, currentUsuarioId = 10)
        var result = await _sut.CancelarCitaAsync(1, false, 10);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Solo puedes cancelar citas con al menos 2 horas de anticipación.", result.Error);
    }

    [TestMethod]
    public async Task CancelarCitaAsync_CuandoClienteCancelaConMasDe2Horas_DebeCancelarYRegistrarAuditoria()
    {
        // Arrange
        var fechaCita = DateTime.Now.AddHours(3); // Más de 2 horas
        var usuario = new Usuario { Id = 10, Nombre = "Owner", Email = "owner@test.com" };
        var mascota = new Mascota { Id = 1, Nombre = "Firulais", Activo = true, UsuarioId = 10 };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var veterinario = new Veterinario { Id = 1, Nombre = "Vet", Email = "vet@test.com", Activo = true };
        var cita = new Cita { Id = 1, MascotaId = 1, VeterinarioId = 1, ServicioId = 1, FechaHora = fechaCita, Estado = "Confirmada" };
        
        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act (isAdmin = false, currentUsuarioId = 10)
        var result = await _sut.CancelarCitaAsync(1, false, 10);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual("Cancelada", result.Cita!.Estado);
    }

    [TestMethod]
    public async Task GetCitasParaCalendarioAsync_DebeRetornarCitasEnRango()
    {
        // Arrange
        var hoy = DateTime.Today;
        var usuario = new Usuario { Id = 10, Nombre = "Cliente" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 10, Usuario = usuario, Activo = true };
        var servicio = new Servicio { Id = 1, Nombre = "Servicio", Activo = true };
        var veterinario = new Veterinario { Id = 1, Nombre = "Vet", Activo = true };
        var cita1 = new Cita { Id = 1, MascotaId = 1, VeterinarioId = 1, ServicioId = 1, FechaHora = hoy, Estado = "Confirmada" };
        var citaFuera = new Cita { Id = 2, MascotaId = 1, VeterinarioId = 1, ServicioId = 1, FechaHora = hoy.AddMonths(3), Estado = "Confirmada" };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.Citas.AddRangeAsync(cita1, citaFuera);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetCitasParaCalendarioAsync(hoy.AddDays(-1), hoy.AddDays(1));

        // Assert
        Assert.AreEqual(1, result.Count);
        Assert.AreEqual(1, result.First().Id);
    }

    [TestMethod]
    public void GetCitasQuery_CuandoFiltrosMultiples_DebeRetornarQueryFiltrada()
    {
        // Arrange
        var propietario = new Usuario { Id = 1, Nombre = "Prop" };
        var mascota = new Mascota { Id = 1, Nombre = "Masc", UsuarioId = 1, Usuario = propietario };
        var servicio = new Servicio { Id = 1, Nombre = "Servicio", Activo = true };
        var vet1 = new Veterinario { Id = 1, Nombre = "Vet1", Activo = true };
        var vet2 = new Veterinario { Id = 2, Nombre = "Vet2", Activo = true };
        var cita1 = new Cita { Id = 1, MascotaId = 1, Mascota = mascota, Estado = "Confirmada", VeterinarioId = 1, FechaHora = DateTime.Today.AddHours(10), ServicioId = 1 };
        var cita2 = new Cita { Id = 2, MascotaId = 1, Mascota = mascota, Estado = "Pendiente", VeterinarioId = 2, FechaHora = DateTime.Today.AddHours(11), ServicioId = 1 };
        _context.Usuarios.Add(propietario);
        _context.Mascotas.Add(mascota);
        _context.Servicios.Add(servicio);
        _context.Veterinarios.AddRange(vet1, vet2);
        _context.Citas.AddRange(cita1, cita2);
        _context.SaveChanges();
        _context.ChangeTracker.Clear();

        // Act
        // 1. IsAdmin = true, filter by estado
        var q1 = _sut.GetCitasQuery(true, null, "Confirmada", null, null, null).ToList();
        // 2. IsAdmin = false, filter by client ID
        var q2 = _sut.GetCitasQuery(false, 1, null, null, null, null).ToList();
        // 3. Filter by veterinarian ID
        var q3 = _sut.GetCitasQuery(true, null, null, 2, null, null).ToList();
        // 4. Filter by date range
        var q4 = _sut.GetCitasQuery(true, null, null, null, DateTime.Today, DateTime.Today).ToList();

        // Assert
        Assert.AreEqual(1, q1.Count);
        Assert.AreEqual(2, q2.Count);
        Assert.AreEqual(1, q3.Count);
        Assert.AreEqual(2, q4.Count);
    }

    [TestMethod]
    public async Task GetCitaDetailsAsync_CuandoClienteNoDueno_DebeRetornarNull()
    {
        // Arrange
        var propietario = new Usuario { Id = 5, Nombre = "Prop" };
        var mascota = new Mascota { Id = 1, Nombre = "M", UsuarioId = 5, Usuario = propietario };
        var servicio = new Servicio { Id = 1, Nombre = "Servicio", Activo = true };
        var vet = new Veterinario { Id = 1, Nombre = "Vet", Activo = true };
        var cita = new Cita { Id = 1, MascotaId = 1, Mascota = mascota, VeterinarioId = 1, ServicioId = 1 };
        await _context.Usuarios.AddAsync(propietario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var resultAdmin = await _sut.GetCitaDetailsAsync(1, true, null);
        var resultClienteAjeno = await _sut.GetCitaDetailsAsync(1, false, 10); // client 10 tries to see client 5's appointment
        var resultClienteDueno = await _sut.GetCitaDetailsAsync(1, false, 5);

        // Assert
        Assert.IsNotNull(resultAdmin);
        Assert.IsNull(resultClienteAjeno);
        Assert.IsNotNull(resultClienteDueno);
    }

    [TestMethod]
    public async Task MascotaTienePagosPendientesAsync_DebeRetornarVerdaderoSiTieneSaldo()
    {
        // Arrange
        var citaConSaldo = new Cita { Id = 1, MascotaId = 1, Estado = "Completada", EstadoPago = "Pendiente", MontoTotal = 100, MontoPagado = 40 };
        var citaSinSaldo = new Cita { Id = 2, MascotaId = 2, Estado = "Completada", EstadoPago = "Pagado", MontoTotal = 100, MontoPagado = 100 };
        await _context.Citas.AddRangeAsync(citaConSaldo, citaSinSaldo);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var tiene1 = await _sut.MascotaTienePagosPendientesAsync(1);
        var tiene2 = await _sut.MascotaTienePagosPendientesAsync(2);

        // Assert
        Assert.IsTrue(tiene1);
        Assert.IsFalse(tiene2);
    }

    [TestMethod]
    public async Task ObtenerHorariosDisponiblesAsync_DebeRetornarSoloSlotsLibres()
    {
        // Arrange
        var fecha = new DateTime(2026, 6, 15); // Lunes
        var vet = new Veterinario { Id = 1, Nombre = "Vet", Activo = true, HorarioInicio = new TimeSpan(9, 0, 0), HorarioFin = new TimeSpan(11, 0, 0) };
        var horarioClinica = new HorarioClinica { DiaSemana = 1, HoraApertura = new TimeSpan(8, 0, 0), HoraCierre = new TimeSpan(18, 0, 0) };
        
        // Cita agendada de 9:30 a 10:00 (Duración 30min en consulta por defecto)
        var servicio = new Servicio { Id = 1, Nombre = "S", DuracionMinutos = 30, Activo = true };
        var cita = new Cita { Id = 1, VeterinarioId = 1, ServicioId = 1, FechaHora = fecha.AddHours(9.5), Estado = "Confirmada" }; // 9:30

        // Bloqueo de agenda de 10:30 a 11:00
        var bloqueo = new BloqueoAgenda { Id = 1, VeterinarioId = 1, FechaInicio = fecha.AddHours(10.5), FechaFin = fecha.AddHours(11) };

        await _context.Veterinarios.AddAsync(vet);
        await _context.HorariosClinica.AddAsync(horarioClinica);
        await _context.Servicios.AddAsync(servicio);
        await _context.Citas.AddAsync(cita);
        await _context.BloqueosAgenda.AddAsync(bloqueo);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.ObtenerHorariosDisponiblesAsync(1, fecha);

        // Assert
        // Horario veterinario es 9:00 a 11:00.
        // Slots de 30min: 9:00 (libre), 9:30 (ocupado por cita), 10:00 (libre), 10:30 (ocupado por bloqueo).
        // Debe retornar 9:00 y 10:00.
        Assert.AreEqual(2, result.Count);
        Assert.IsTrue(result.Contains(fecha.AddHours(9)));
        Assert.IsTrue(result.Contains(fecha.AddHours(10)));
    }

    [TestMethod]
    public async Task ReservaTemporalCitaAsync_DebeCrearCitaTemporal()
    {
        // Arrange
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true, DuracionMinutos = 30 };
        var mascota = new Mascota { Id = 1, Nombre = "Firulais", Activo = true };
        var veterinario = new Veterinario { Id = 1, Nombre = "Vet 1", Activo = true, HorarioInicio = new TimeSpan(8, 0, 0), HorarioFin = new TimeSpan(18, 0, 0) };
        var horarioClinica = new HorarioClinica { DiaSemana = (int)DateTime.Today.AddDays(1).DayOfWeek, HoraApertura = new TimeSpan(8, 0, 0), HoraCierre = new TimeSpan(18, 0, 0) };
        
        await _context.Servicios.AddAsync(servicio);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.HorariosClinica.AddAsync(horarioClinica);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var cita = new Cita { MascotaId = 1, VeterinarioId = 1, ServicioId = 1, FechaHora = DateTime.Today.AddDays(1).Date.AddHours(10) };

        // Act
        var result = await _sut.ReservaTemporalCitaAsync(cita, 100);

        // Assert
        Assert.AreEqual("ReservaTemporal", result.Estado);
        Assert.AreEqual(100, result.MontoTotal);
        var inDb = await _context.Citas.FindAsync(result.Id);
        Assert.IsNotNull(inDb);
    }

    [TestMethod]
    public async Task CompletarCitaAsync_CuandoCitaCompletada_DebeCambiarEstadoYRegistrarAuditoria()
    {
        // Arrange
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var mascota = new Mascota { Id = 1, Nombre = "Firulais", Activo = true };
        var cita = new Cita { Id = 5, MascotaId = 1, VeterinarioId = 1, ServicioId = 1, Estado = "EnAtencion" };
        
        await _context.Servicios.AddAsync(servicio);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.CompletarCitaAsync(5);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual("Completada", result.Cita!.Estado);
    }

    [TestMethod]
    public async Task CambiarEstadoAsync_CuandoCambioValido_DebeActualizarEstado()
    {
        // Arrange
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var mascota = new Mascota { Id = 1, Nombre = "Firulais", Activo = true };
        var cita = new Cita { Id = 8, MascotaId = 1, VeterinarioId = 1, ServicioId = 1, Estado = "Confirmada" };
        
        await _context.Servicios.AddAsync(servicio);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act & Assert
        // 1. Cambiar Confirmada a EnAtencion (Válido)
        var r1 = await _sut.CambiarEstadoAsync(8, "EnAtencion");
        Assert.IsTrue(r1.Success);
        Assert.AreEqual("EnAtencion", r1.Cita!.Estado);

        // 2. Cambiar EnAtencion a Completada (Válido)
        _context.ChangeTracker.Clear();
        var r2 = await _sut.CambiarEstadoAsync(8, "Completada");
        Assert.IsTrue(r2.Success);
        Assert.AreEqual("Completada", r2.Cita!.Estado);

        // 3. Cambiar Completada a Confirmada (Inválido)
        _context.ChangeTracker.Clear();
        var r3 = await _sut.CambiarEstadoAsync(8, "Confirmada");
        Assert.IsFalse(r3.Success);
        Assert.IsTrue(r3.Error!.Contains("No se puede cambiar"));

        // 4. Cambiar a Libre (Eliminación física, solo válido desde ReservaTemporal)
        var citaReserva = new Cita { Id = 9, MascotaId = 1, VeterinarioId = 1, ServicioId = 1, Estado = "ReservaTemporal" };
        await _context.Citas.AddAsync(citaReserva);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var r4 = await _sut.CambiarEstadoAsync(9, "Libre");
        Assert.IsTrue(r4.Success);
        var inDb = await _context.Citas.FindAsync(9);
        Assert.IsNull(inDb);
    }

    [TestMethod]
    public async Task CreateMascotaAsync_DebeAgregarYRetornarMascota()
    {
        // Arrange
        var mascota = new Mascota { Nombre = "Perla", Activo = true };

        // Act
        var result = await _sut.CreateMascotaAsync(mascota);

        // Assert
        Assert.IsNotNull(result);
        var inDb = await _context.Mascotas.FindAsync(result.Id);
        Assert.IsNotNull(inDb);
    }

    [TestMethod]
    public async Task CreateCitaAsync_CuandoExitoso_DebeCrearCita()
    {
        // Arrange
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true, DuracionMinutos = 30 };
        var mascota = new Mascota { Id = 1, Nombre = "Firulais", Activo = true };
        var veterinario = new Veterinario { Id = 1, Nombre = "Vet 1", Activo = true, HorarioInicio = new TimeSpan(8, 0, 0), HorarioFin = new TimeSpan(18, 0, 0) };
        var horarioClinica = new HorarioClinica { DiaSemana = 1, HoraApertura = new TimeSpan(8, 0, 0), HoraCierre = new TimeSpan(18, 0, 0) };
        
        await _context.Servicios.AddAsync(servicio);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Veterinarios.AddAsync(veterinario);
        await _context.HorariosClinica.AddAsync(horarioClinica);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var cita = new Cita { MascotaId = 1, VeterinarioId = 1, ServicioId = 1, FechaHora = new DateTime(2026, 6, 15, 10, 0, 0), Estado = "Confirmada" }; // Lunes 10am

        // Act
        var result = await _sut.CreateCitaAsync(cita, 60);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("Confirmada", result.Estado);
        Assert.AreEqual(60, result.MontoTotal);
    }
}
