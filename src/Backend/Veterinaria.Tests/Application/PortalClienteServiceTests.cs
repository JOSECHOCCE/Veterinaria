using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
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
public class PortalClienteServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private Mock<UserManager<ApplicationUser>> _userManagerMock = null!;
    private Mock<ICitaService> _citaServiceMock = null!;
    private Mock<INotificacionService> _notificacionServiceMock = null!;
    private PortalClienteService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Portal_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _citaServiceMock = new Mock<ICitaService>();
        _notificacionServiceMock = new Mock<INotificacionService>();

        _sut = new PortalClienteService(
            _unitOfWork,
            _userManagerMock.Object,
            _citaServiceMock.Object,
            _notificacionServiceMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task GetDashboardAsync_DebeRetornarCitasMascotasyAlertas()
    {
        // Arrange
        var user = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente", Activo = true };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", Especie = "Perro", UsuarioId = 1, Activo = true };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var vet = new Veterinario { Id = 1, Nombre = "Dr. House", Activo = true };
        var cita = new Cita { Id = 1, MascotaId = 1, ServicioId = 1, VeterinarioId = 1, FechaHora = DateTime.Now.AddDays(1), Estado = "Confirmada" };
        var notif = new Notificacion { Id = 1, UsuarioId = 1, Titulo = "Alerta", Mensaje = "Mensaje", Leida = false, FechaCreacion = DateTime.Now };

        await _context.Usuarios.AddAsync(user);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddAsync(cita);
        await _context.Notificaciones.AddAsync(notif);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetDashboardAsync(1);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual(1, result.Data!.ProximasCitas.Count());
        Assert.AreEqual(1, result.Data.Mascotas.Count());
        Assert.AreEqual(1, result.Data.Alertas.Count());
    }

    [TestMethod]
    public async Task GetMisMascotasAsync_DebeRetornarListaActiva()
    {
        // Arrange
        var m1 = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1, Activo = true };
        var m2 = new Mascota { Id = 2, Nombre = "Ramiro", UsuarioId = 1, Activo = false };
        await _context.Mascotas.AddRangeAsync(m1, m2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetMisMascotasAsync(1);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual(1, result.Data!.Count());
    }

    [TestMethod]
    public async Task RegistrarMascotaAsync_DebeGuardarMascota()
    {
        // Arrange
        var dto = new RegistrarMascotaPortalDto { Nombre = "Fido", Especie = "Perro" };

        // Act
        var result = await _sut.RegistrarMascotaAsync(1, dto);

        // Assert
        Assert.IsTrue(result.Success);
        var inDb = await _context.Mascotas.FirstOrDefaultAsync(m => m.Nombre == "Fido");
        Assert.IsNotNull(inDb);
        Assert.AreEqual(1, inDb!.UsuarioId);
    }

    [TestMethod]
    public async Task GetMisPagosAsync_DebeRetornarRealizadosYPendientes()
    {
        // Arrange
        var user = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1 };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var vet = new Veterinario { Id = 1, Nombre = "Dr. House", Activo = true };

        var cita1 = new Cita { Id = 1, MascotaId = 1, ServicioId = 1, VeterinarioId = 1, Estado = "Completada", EstadoPago = "Pagado", MontoTotal = 100m, MontoPagado = 100m };
        var cita2 = new Cita { Id = 2, MascotaId = 1, ServicioId = 1, VeterinarioId = 1, Estado = "Completada", EstadoPago = "Pendiente", MontoTotal = 80m, MontoPagado = 20m };

        var pago = new Pago { Id = 1, CitaId = 1, Monto = 100m, MetodoPago = "Tarjeta", FechaPago = DateTime.Now };

        await _context.Usuarios.AddAsync(user);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddRangeAsync(cita1, cita2);
        await _context.Pagos.AddAsync(pago);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetMisPagosAsync(1);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.IsNotNull(result.Data);
        
        var data = result.Data!;
        var pagosRealizadosProp = data.GetType().GetProperty("PagosRealizados");
        var pagosPendientesProp = data.GetType().GetProperty("PagosPendientes");
        
        Assert.IsNotNull(pagosRealizadosProp, "Property PagosRealizados not found");
        Assert.IsNotNull(pagosPendientesProp, "Property PagosPendientes not found");
        
        var pagosRealizados = pagosRealizadosProp.GetValue(data) as System.Collections.IEnumerable;
        var pagosPendientes = pagosPendientesProp.GetValue(data) as System.Collections.IEnumerable;
        
        Assert.IsNotNull(pagosRealizados);
        Assert.IsNotNull(pagosPendientes);
        
        Assert.AreEqual(1, Enumerable.Count(pagosRealizados.Cast<object>()));
        Assert.AreEqual(1, Enumerable.Count(pagosPendientes.Cast<object>()));
    }

    [TestMethod]
    public async Task ActualizarPerfilAsync_CuandoExitoso_DebeActualizarYCambiarContrasena()
    {
        // Arrange
        var user = new Usuario { Id = 1, Nombre = "Juan", ApplicationUserId = "app-user-1", Telefono = "111", Direccion = "Calle 1" };
        var appUser = new ApplicationUser { Id = "app-user-1", Email = "j@t.com" };

        await _context.Usuarios.AddAsync(user);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(m => m.FindByIdAsync("app-user-1")).ReturnsAsync(appUser);
        _userManagerMock.Setup(m => m.ChangePasswordAsync(appUser, "OldPwd", "NewPwd")).ReturnsAsync(IdentityResult.Success);

        var dto = new ActualizarPerfilPortalDto
        {
            Telefono = "222",
            Direccion = "Calle 2",
            PasswordActual = "OldPwd",
            PasswordNuevo = "NewPwd"
        };

        // Act
        var result = await _sut.ActualizarPerfilAsync(1, dto);

        // Assert
        Assert.IsTrue(result.Success);
        var inDb = await _context.Usuarios.FindAsync(1);
        Assert.AreEqual("222", inDb!.Telefono);
        Assert.AreEqual("Calle 2", inDb.Direccion);
    }

    [TestMethod]
    public async Task GetMisCitasAsync_DebeRetornarCitas()
    {
        // Arrange
        var user = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1 };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var vet = new Veterinario { Id = 1, Nombre = "Dr. House", Activo = true };
        var cita = new Cita { Id = 1, MascotaId = 1, ServicioId = 1, VeterinarioId = 1, FechaHora = DateTime.Now, Estado = "Confirmada" };

        await _context.Usuarios.AddAsync(user);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetMisCitasAsync(1);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual(1, result.Data!.Count());
    }

    [TestMethod]
    public async Task SolicitarCitaAsync_CuandoCitaEnPasado_DebeFallar()
    {
        // Arrange
        var dto = new SolicitarCitaPortalDto { FechaHora = DateTime.Now.AddDays(-1) };

        // Act
        var result = await _sut.SolicitarCitaAsync(1, dto);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("No se puede agendar una cita en una fecha pasada.", result.Message);
    }

    [TestMethod]
    public async Task SolicitarCitaAsync_CuandoMascotaNoValida_DebeFallar()
    {
        // Arrange
        var dto = new SolicitarCitaPortalDto { FechaHora = DateTime.Now.AddDays(1), MascotaId = 999 };

        // Act
        var result = await _sut.SolicitarCitaAsync(1, dto);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Mascota no válida o inactiva.", result.Message);
    }

    [TestMethod]
    public async Task SolicitarCitaAsync_CuandoServicioNoValido_DebeFallar()
    {
        // Arrange
        var mascota = new Mascota { Id = 1, UsuarioId = 1, Activo = true };
        await _context.Mascotas.AddAsync(mascota);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new SolicitarCitaPortalDto { FechaHora = DateTime.Now.AddDays(1), MascotaId = 1, ServicioId = 999 };

        // Act
        var result = await _sut.SolicitarCitaAsync(1, dto);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Servicio no válido o inactivo.", result.Message);
    }

    [TestMethod]
    public async Task SolicitarCitaAsync_CuandoExisteReservaTemporalPrevia_DebeActualizarla()
    {
        // Arrange
        var user = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1, Usuario = user, Activo = true };
        var servicio = new Servicio { Id = 2, Nombre = "Consulta", Activo = true, Precio = 80m };
        var vet = new Veterinario { Id = 3, Nombre = "Dr. House", Activo = true };
        
        var fecha = DateTime.Today.AddDays(2).AddHours(10);
        var citaReserva = new Cita { Id = 10, MascotaId = 1, Mascota = mascota, VeterinarioId = 3, Veterinario = vet, ServicioId = 2, Servicio = servicio, FechaHora = fecha, Estado = "ReservaTemporal", FechaExpiracionReserva = DateTime.UtcNow.AddMinutes(5) };

        await _context.Usuarios.AddAsync(user);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddAsync(citaReserva);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new SolicitarCitaPortalDto { MascotaId = 1, ServicioId = 2, VeterinarioId = 3, FechaHora = fecha, Motivo = "Chequeo" };

        // Act
        var result = await _sut.SolicitarCitaAsync(1, dto);

        // Assert
        Assert.IsTrue(result.Success);
        var inDb = await _context.Citas.FindAsync(10);
        Assert.AreEqual("PendienteConfirmacion", inDb!.Estado);
        Assert.IsNull(inDb.FechaExpiracionReserva);
        _notificacionServiceMock.Verify(n => n.NotificarNuevaCitaSolicitadaAsync(It.IsAny<Cita>()), Times.Once);
    }

    [TestMethod]
    public async Task SolicitarCitaAsync_CuandoExitosoCrearCita_DebeCrearNuevaCita()
    {
        // Arrange
        var user = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1, Usuario = user, Activo = true };
        var servicio = new Servicio { Id = 2, Nombre = "Consulta", Activo = true, Precio = 80m };
        
        await _context.Usuarios.AddAsync(user);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new SolicitarCitaPortalDto { MascotaId = 1, ServicioId = 2, VeterinarioId = 3, FechaHora = DateTime.Today.AddDays(2).AddHours(10) };
        _citaServiceMock.Setup(c => c.CreateCitaAsync(It.IsAny<Cita>(), 80m)).ReturnsAsync(new Cita());

        // Act
        var result = await _sut.SolicitarCitaAsync(1, dto);

        // Assert
        Assert.IsTrue(result.Success);
        _citaServiceMock.Verify(c => c.CreateCitaAsync(It.IsAny<Cita>(), 80m), Times.Once);
        _notificacionServiceMock.Verify(n => n.NotificarNuevaCitaSolicitadaAsync(It.IsAny<Cita>()), Times.Once);
    }

    [TestMethod]
    public async Task CancelarCitaAsync_DebeLlamarCitaService()
    {
        // Arrange
        _citaServiceMock.Setup(c => c.CancelarCitaAsync(1, false, 10))
            .ReturnsAsync((true, new Cita(), null));

        // Act
        var result = await _sut.CancelarCitaAsync(10, 1);

        // Assert
        Assert.IsTrue(result.Success);
        _citaServiceMock.Verify(c => c.CancelarCitaAsync(1, false, 10), Times.Once);

        // Test cancel failure
        _citaServiceMock.Setup(c => c.CancelarCitaAsync(2, false, 10))
            .ReturnsAsync((false, null, "Error"));
        var resultFail = await _sut.CancelarCitaAsync(10, 2);
        Assert.IsFalse(resultFail.Success);
    }

    [TestMethod]
    public async Task GetHistorialMascotaAsync_DebeRetornarHistoriales()
    {
        // Arrange
        var user = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente" };
        var mascota = new Mascota { Id = 5, Nombre = "Fido", UsuarioId = 1 };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var vet = new Veterinario { Id = 1, Nombre = "Dr. House", Activo = true };
        var cita = new Cita { Id = 1, MascotaId = 5, ServicioId = 1, VeterinarioId = 1, Estado = "Completada" };
        var historial = new HistorialClinico { Id = 1, CitaId = 1, MotivoConsulta = "Tos", Hallazgos = "Ninguno", Diagnostico = "Gripe", Tratamiento = "Jarabe", Medicamentos = "Jarabe", Recomendaciones = "Descanso", FechaRegistro = DateTime.Now };

        await _context.Usuarios.AddAsync(user);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddAsync(cita);
        await _context.HistorialesClinicos.AddAsync(historial);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetHistorialMascotaAsync(1, 5);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual(1, result.Data!.Count());
    }

    [TestMethod]
    public async Task GetHistorialMascotaAsync_CuandoMascotaNoExisteOAccesoDenegado_DebeFallar()
    {
        // Arrange
        var mascota = new Mascota { Id = 5, Nombre = "Fido", UsuarioId = 2 }; // owned by client 2
        await _context.Mascotas.AddAsync(mascota);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetHistorialMascotaAsync(1, 5); // client 1 tries to access

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Mascota no encontrada o acceso denegado.", result.Message);
    }

    [TestMethod]
    public async Task GetMiPerfilAsync_DebeRetornarPerfil()
    {
        // Arrange
        var user = new Usuario { Id = 10, Nombre = "Juan", Rol = "Cliente", DNI = "123", Telefono = "999", Direccion = "Calle 1", ApplicationUserId = "app-user-1" };
        var appUser = new ApplicationUser { Id = "app-user-1", Email = "j@t.com" };

        await _context.Usuarios.AddAsync(user);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(m => m.FindByIdAsync("app-user-1")).ReturnsAsync(appUser);

        // Act
        var result = await _sut.GetMiPerfilAsync(10);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.IsNotNull(result.Data);
        
        var profile = result.Data!;
        Assert.AreEqual("Juan", profile.GetType().GetProperty("Nombre")!.GetValue(profile));
        Assert.AreEqual("j@t.com", profile.GetType().GetProperty("Email")!.GetValue(profile));
    }

    [TestMethod]
    public async Task ActualizarPerfilAsync_ManejoErrores()
    {
        // Arrange
        // 1. Usuario no encontrado
        var r1 = await _sut.ActualizarPerfilAsync(999, new ActualizarPerfilPortalDto());
        Assert.IsFalse(r1.Success);
        Assert.AreEqual("Usuario no encontrado.", r1.Message);

        // 2. Identity user no encontrado
        var user = new Usuario { Id = 10, Nombre = "Juan", ApplicationUserId = "app-user-1" };
        await _context.Usuarios.AddAsync(user);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(m => m.FindByIdAsync("app-user-1")).ReturnsAsync((ApplicationUser?)null);

        var r2 = await _sut.ActualizarPerfilAsync(10, new ActualizarPerfilPortalDto());
        Assert.IsFalse(r2.Success);
        Assert.AreEqual("Cuenta de acceso no encontrada.", r2.Message);

        // 3. Cambio de contraseña fallido
        var appUser = new ApplicationUser { Id = "app-user-1" };
        _userManagerMock.Setup(m => m.FindByIdAsync("app-user-1")).ReturnsAsync(appUser);
        _userManagerMock.Setup(m => m.ChangePasswordAsync(appUser, "Old", "New"))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Invalida" }));

        var dto = new ActualizarPerfilPortalDto { PasswordActual = "Old", PasswordNuevo = "New" };
        var r3 = await _sut.ActualizarPerfilAsync(10, dto);
        Assert.IsFalse(r3.Success);
        Assert.IsTrue(r3.Message.Contains("Error al cambiar la contraseña: Invalida"));
    }
}
