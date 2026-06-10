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
public class PagoServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private Mock<IAuditoriaService> _auditoriaServiceMock = null!;
    private PagoService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Pago_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        _auditoriaServiceMock = new Mock<IAuditoriaService>();
        
        _sut = new PagoService(_unitOfWork, _auditoriaServiceMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task RegistrarCobroManualAsync_CuandoMontoInvalido_DebeRetornarError()
    {
        // Arrange
        // Act
        var result = await _sut.RegistrarCobroManualAsync(1, 100, 0, "Efectivo", null, null, "Admin");

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("El monto abonado no puede ser cero o negativo.", result.Error);
    }

    [TestMethod]
    public async Task RegistrarCobroManualAsync_CuandoExitoso_DebeActualizarCita()
    {
        // Arrange
        var cita = new Cita { Id = 1, Estado = "Completada", EstadoPago = "Pendiente", MontoTotal = 100, MontoPagado = 0 };
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.RegistrarCobroManualAsync(1, 100, 100, "Efectivo", null, null, "Admin");

        // Assert
        Assert.IsTrue(result.Success);
        Assert.IsNotNull(result.Pago);
        Assert.AreEqual(100, result.Pago.Monto);
        
        var updatedCita = await _context.Citas.FindAsync(1);
        Assert.AreEqual("Pagado", updatedCita!.EstadoPago);
        Assert.AreEqual(100, updatedCita.MontoPagado);
        
        _auditoriaServiceMock.Verify(a => a.RegistrarAccionAsync("Registrar Cobro Manual", "Pago", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [TestMethod]
    public async Task GetCitasPendientesPagoAsync_DebeRetornarListaCorrecta()
    {
        // Arrange
        var mascota = new Mascota { Id = 1, Usuario = new Usuario() };
        var servicio = new Servicio { Id = 1 };
        var vet = new Veterinario { Id = 1 };

        var cita1 = new Cita { Id = 1, Estado = "Completada", EstadoPago = "Pendiente", Mascota = mascota, Servicio = servicio, Veterinario = vet };
        var cita2 = new Cita { Id = 2, Estado = "Completada", EstadoPago = "Pagado", Mascota = mascota, Servicio = servicio, Veterinario = vet };
        var cita3 = new Cita { Id = 3, Estado = "Confirmada", EstadoPago = "Pendiente", Mascota = mascota, Servicio = servicio, Veterinario = vet };

        await _context.Citas.AddRangeAsync(cita1, cita2, cita3);
        await _context.SaveChangesAsync();

        // Act
        var pendientes = await _sut.GetCitasPendientesPagoAsync();

        // Assert
        Assert.AreEqual(1, pendientes.Count);
        Assert.AreEqual(1, pendientes.First().Id);
    }

    [TestMethod]
    public async Task GetReportePagosAsync_DebeRetornarReporteCorrecto()
    {
        // Arrange
        var cita = new Cita { Id = 1, Servicio = new Servicio { Nombre = "Vacuna" } };
        var pago1 = new Pago { Id = 1, Cita = cita, Monto = 50, MetodoPago = "Tarjeta", FechaPago = DateTime.Now };
        var pago2 = new Pago { Id = 2, Cita = cita, Monto = 50, MetodoPago = "Efectivo", FechaPago = DateTime.Now };

        await _context.Pagos.AddRangeAsync(pago1, pago2);
        await _context.SaveChangesAsync();

        // Act
        var reporte = await _sut.GetReportePagosAsync(DateTime.Now.AddDays(-1), DateTime.Now.AddDays(1));

        // Assert
        Assert.IsNotNull(reporte);
        Assert.AreEqual(100, reporte.TotalRecaudado);
        Assert.AreEqual(50, reporte.TotalTarjeta);
        Assert.AreEqual(50, reporte.TotalEfectivo);
        Assert.AreEqual(2, reporte.TotalPagos);
    }

    [TestMethod]
    public async Task GetPagosFiltradosAsync_DebeFiltrarYCalcularTotales()
    {
        // Arrange
        var usuario = new Usuario { Id = 10, Nombre = "Juan" };
        var mascota = new Mascota { Id = 1, Nombre = "Coco", UsuarioId = 10, Usuario = usuario };
        var vet = new Veterinario { Id = 1, Nombre = "Vet" };
        var servicio = new Servicio { Id = 1, Nombre = "Vacuna" };
        var cita = new Cita { Id = 1, MascotaId = 1, Mascota = mascota, VeterinarioId = 1, Veterinario = vet, ServicioId = 1, Servicio = servicio };

        var pago1 = new Pago { Id = 1, CitaId = 1, Cita = cita, Monto = 50m, MetodoPago = "Tarjeta", TipoPago = "Completo", FechaPago = DateTime.Today };
        var pago2 = new Pago { Id = 2, CitaId = 1, Cita = cita, Monto = 30m, MetodoPago = "Efectivo", TipoPago = "Parcial", FechaPago = DateTime.Today.AddDays(-1) };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Servicios.AddAsync(servicio);
        await _context.Citas.AddAsync(cita);
        await _context.Pagos.AddRangeAsync(pago1, pago2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var (list, totalTar, totalEf, count) = await _sut.GetPagosFiltradosAsync("Completo", "Tarjeta", DateTime.Today.AddDays(-2), DateTime.Today.AddDays(1));

        // Assert
        Assert.AreEqual(1, count);
        Assert.AreEqual(50m, totalTar);
        Assert.AreEqual(0m, totalEf);
        Assert.AreEqual(1, list.Count);
    }

    [TestMethod]
    public async Task GetPagoDetailsAsync_DebeRetornarPagoConDetalles()
    {
        // Arrange
        var usuario = new Usuario { Id = 10, Nombre = "Juan" };
        var mascota = new Mascota { Id = 1, Nombre = "Coco", UsuarioId = 10, Usuario = usuario };
        var vet = new Veterinario { Id = 1, Nombre = "Vet" };
        var servicio = new Servicio { Id = 1, Nombre = "Vacuna" };
        var cita = new Cita { Id = 1, MascotaId = 1, Mascota = mascota, VeterinarioId = 1, Veterinario = vet, ServicioId = 1, Servicio = servicio };
        var pago = new Pago { Id = 1, CitaId = 1, Cita = cita, Monto = 50m, MetodoPago = "Tarjeta", TipoPago = "Completo", FechaPago = DateTime.Now };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Servicios.AddAsync(servicio);
        await _context.Citas.AddAsync(cita);
        await _context.Pagos.AddAsync(pago);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetPagoDetailsAsync(1);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(1, result.Id);
        Assert.AreEqual("Coco", result.Cita.Mascota.Nombre);
    }

    [TestMethod]
    public async Task GetCitaWithPagosAsync_DebeRetornarCitaConColecciones()
    {
        // Arrange
        var usuario = new Usuario { Id = 10, Nombre = "Juan" };
        var mascota = new Mascota { Id = 1, Nombre = "Coco", UsuarioId = 10, Usuario = usuario };
        var vet = new Veterinario { Id = 1, Nombre = "Vet" };
        var servicio = new Servicio { Id = 1, Nombre = "Vacuna" };
        var cita = new Cita { Id = 1, MascotaId = 1, Mascota = mascota, VeterinarioId = 1, Veterinario = vet, ServicioId = 1, Servicio = servicio };
        var pago = new Pago { Id = 1, CitaId = 1, Monto = 50m, MetodoPago = "Tarjeta", TipoPago = "Completo", FechaPago = DateTime.Now };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Servicios.AddAsync(servicio);
        await _context.Citas.AddAsync(cita);
        await _context.Pagos.AddAsync(pago);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetCitaWithPagosAsync(1);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(1, result.Pagos.Count);
    }

    [TestMethod]
    public async Task GetCitaForPagoAsync_DebeRetornarCitaConUsuario()
    {
        // Arrange
        var usuario = new Usuario { Id = 10, Nombre = "Juan" };
        var mascota = new Mascota { Id = 1, Nombre = "Coco", UsuarioId = 10, Usuario = usuario };
        var vet = new Veterinario { Id = 1, Nombre = "Vet" };
        var servicio = new Servicio { Id = 1, Nombre = "Vacuna" };
        var cita = new Cita { Id = 1, MascotaId = 1, Mascota = mascota, VeterinarioId = 1, Veterinario = vet, ServicioId = 1, Servicio = servicio };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Servicios.AddAsync(servicio);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetCitaForPagoAsync(1);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("Juan", result.Mascota.Usuario.Nombre);
    }

    [TestMethod]
    public async Task GetTarjetaGuardadaAsync_DebeRetornarTarjetaActiva()
    {
        // Arrange
        var t1 = new TarjetaGuardada { Id = 1, UsuarioId = 10, Activa = true, UltimosDigitos = "1234", FechaRegistro = DateTime.UtcNow.AddDays(-1) };
        var t2 = new TarjetaGuardada { Id = 2, UsuarioId = 10, Activa = true, UltimosDigitos = "5678", FechaRegistro = DateTime.UtcNow };
        var t3 = new TarjetaGuardada { Id = 3, UsuarioId = 10, Activa = false, UltimosDigitos = "9999", FechaRegistro = DateTime.UtcNow.AddDays(1) };

        await _context.TarjetasGuardadas.AddRangeAsync(t1, t2, t3);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetTarjetaGuardadaAsync(10);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(2, result.Id);
        Assert.AreEqual("5678", result.UltimosDigitos);
    }

    [TestMethod]
    public async Task ProcesarPagoTarjetaAsync_DebeRegistrarPagoYActualizarCitaYGuardarTarjeta()
    {
        // Arrange
        var cita = new Cita { Id = 1, Estado = "Confirmada", EstadoPago = "Pendiente", MontoTotal = 100, MontoPagado = 0 };
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.ProcesarPagoTarjetaAsync(
            citaId: 1,
            montoTotal: 100m,
            montoPagar: 60m,
            tipoPago: "Parcial",
            numeroTarjeta: "1234567812345678",
            guardarTarjeta: true,
            nombreTitular: "Juan Perez",
            fechaVencimiento: "12/28",
            cvv: "123",
            usuarioId: 10
        );

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(60m, result.Monto);
        Assert.AreEqual("5678", result.UltimosDigitosTarjeta);

        var updatedCita = await _context.Citas.FindAsync(1);
        Assert.AreEqual("Parcial", updatedCita!.EstadoPago);
        Assert.AreEqual(60m, updatedCita.MontoPagado);

        var tarjeta = await _context.TarjetasGuardadas.FirstOrDefaultAsync(t => t.UsuarioId == 10);
        Assert.IsNotNull(tarjeta);
        Assert.AreEqual("5678", tarjeta.UltimosDigitos);
        Assert.IsTrue(tarjeta.Activa);

        // Test updating existing card
        _context.ChangeTracker.Clear();
        var result2 = await _sut.ProcesarPagoTarjetaAsync(
            citaId: 1,
            montoTotal: 100m,
            montoPagar: 40m,
            tipoPago: "Restante",
            numeroTarjeta: "1234567812349999",
            guardarTarjeta: true,
            nombreTitular: "Juan Perez 2",
            fechaVencimiento: "12/29",
            cvv: "456",
            usuarioId: 10
        );

        var tarjetaActualizada = await _context.TarjetasGuardadas.FirstOrDefaultAsync(t => t.UsuarioId == 10);
        Assert.AreEqual("9999", tarjetaActualizada!.UltimosDigitos);
    }

    [TestMethod]
    public async Task ProcesarPagoRestanteTarjetaAsync_DebePagarSaldoRestante()
    {
        // Arrange
        var cita = new Cita { Id = 1, Estado = "Completada", EstadoPago = "Parcial", MontoTotal = 100, MontoPagado = 40 };
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.ProcesarPagoRestanteTarjetaAsync(1, "1234567812345678");

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(60m, result.Monto);
        Assert.AreEqual("5678", result.UltimosDigitosTarjeta);

        var updatedCita = await _context.Citas.FindAsync(1);
        Assert.AreEqual("Pagado", updatedCita!.EstadoPago);
        Assert.AreEqual(100m, updatedCita.MontoPagado);
    }

    [TestMethod]
    public async Task ProcesarPagoRestanteTarjetaAsync_CuandoNoExisteCita_DebeLanzarExcepcion()
    {
        // Act & Assert
        await Assert.ThrowsExceptionAsync<InvalidOperationException>(() =>
            _sut.ProcesarPagoRestanteTarjetaAsync(999, "1234567812345678"));
    }

    [TestMethod]
    public async Task GetPagoByIdAsync_DebeRetornarPago()
    {
        // Arrange
        var pago = new Pago { Id = 10, CitaId = 1, Monto = 50m, MetodoPago = "Tarjeta" };
        await _context.Pagos.AddAsync(pago);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetPagoByIdAsync(10);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(50m, result.Monto);
    }

    [TestMethod]
    public async Task AnularPagoAsync_DebeCambiarTipoPagoYRestarMonto()
    {
        // Arrange
        var cita = new Cita { Id = 1, MontoTotal = 100m, MontoPagado = 80m, EstadoPago = "Parcial" };
        var pago = new Pago { Id = 5, CitaId = 1, Cita = cita, Monto = 50m, TipoPago = "Parcial", Referencia = "REF" };
        await _context.Citas.AddAsync(cita);
        await _context.Pagos.AddAsync(pago);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var (success, msg) = await _sut.AnularPagoAsync(5, "Error de registro");

        // Assert
        Assert.IsTrue(success);
        var inDb = await _context.Pagos.FindAsync(5);
        Assert.AreEqual("Anulado", inDb!.TipoPago);
        Assert.IsTrue(inDb.Referencia.Contains("[ANULADO: Error de registro]"));

        var updatedCita = await _context.Citas.FindAsync(1);
        Assert.AreEqual(30m, updatedCita!.MontoPagado);
        Assert.AreEqual("Parcial", updatedCita.EstadoPago);

        _auditoriaServiceMock.Verify(a => a.RegistrarAccionAsync("Anular Pago", "Pago", "5", It.IsAny<string>()), Times.Once);

        // Anular de nuevo debe fallar
        _context.ChangeTracker.Clear();
        var (success2, msg2) = await _sut.AnularPagoAsync(5, "Otra vez");
        Assert.IsFalse(success2);
        Assert.AreEqual("Este pago ya fue anulado.", msg2);

        // Anular inexistente debe fallar
        var (success3, msg3) = await _sut.AnularPagoAsync(999, "Nada");
        Assert.IsFalse(success3);
        Assert.AreEqual("Pago no encontrado.", msg3);
    }

    [TestMethod]
    public async Task GetPagosPorUsuarioAsync_DebeRetornarPagos()
    {
        // Arrange
        var usuario = new Usuario { Id = 10, Nombre = "Juan" };
        var mascota = new Mascota { Id = 1, Nombre = "Coco", UsuarioId = 10, Usuario = usuario };
        var vet = new Veterinario { Id = 1, Nombre = "Vet" };
        var servicio = new Servicio { Id = 1, Nombre = "Vacuna" };
        var cita = new Cita { Id = 1, MascotaId = 1, Mascota = mascota, VeterinarioId = 1, Veterinario = vet, ServicioId = 1, Servicio = servicio };
        var pago = new Pago { Id = 1, CitaId = 1, Cita = cita, Monto = 50m, MetodoPago = "Tarjeta", TipoPago = "Completo", FechaPago = DateTime.Now };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Servicios.AddAsync(servicio);
        await _context.Citas.AddAsync(cita);
        await _context.Pagos.AddAsync(pago);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetPagosPorUsuarioAsync(10);

        // Assert
        Assert.AreEqual(1, result.Count);
        Assert.AreEqual(50m, result[0].Monto);
    }

    [TestMethod]
    public async Task RegistrarCobroManualAsync_DebeManejarValidaciones()
    {
        // Arrange
        var servicio = new Servicio { Id = 1, Precio = 100m };
        var cita = new Cita { Id = 1, Estado = "Completada", EstadoPago = "Pendiente", MontoTotal = 100m, MontoPagado = 0m, ServicioId = 1, Servicio = servicio };
        
        await _context.Servicios.AddAsync(servicio);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // 1. Invalid total amount
        var r1 = await _sut.RegistrarCobroManualAsync(1, 0, 50, "Efectivo", null, null, "Admin");
        Assert.IsFalse(r1.Success);
        Assert.AreEqual("El monto total ajustado no puede ser cero o negativo.", r1.Error);

        // 2. Invalid method
        var r2 = await _sut.RegistrarCobroManualAsync(1, 100, 50, "Invalido", null, null, "Admin");
        Assert.IsFalse(r2.Success);
        Assert.AreEqual("El método de pago no es válido.", r2.Error);

        // 3. Cita not found
        var r3 = await _sut.RegistrarCobroManualAsync(999, 100, 50, "Efectivo", null, null, "Admin");
        Assert.IsFalse(r3.Success);
        Assert.AreEqual("Cita no encontrada.", r3.Error);

        // 4. Cita not completed
        var citaNoCompletada = new Cita { Id = 2, Estado = "Confirmada", EstadoPago = "Pendiente", MontoTotal = 100m, MontoPagado = 0m };
        await _context.Citas.AddAsync(citaNoCompletada);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var r4 = await _sut.RegistrarCobroManualAsync(2, 100, 50, "Efectivo", null, null, "Admin");
        Assert.IsFalse(r4.Success);
        Assert.AreEqual("Solo se pueden registrar cobros en citas en estado 'Completada'.", r4.Error);

        // 5. Cita already paid
        var citaPagada = new Cita { Id = 3, Estado = "Completada", EstadoPago = "Pagado", MontoTotal = 100m, MontoPagado = 100m };
        await _context.Citas.AddAsync(citaPagada);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var r5 = await _sut.RegistrarCobroManualAsync(3, 100, 50, "Efectivo", null, null, "Admin");
        Assert.IsFalse(r5.Success);
        Assert.AreEqual("La cita ya se encuentra totalmente pagada.", r5.Error);

        // 6. Price change without explanation
        var r6 = await _sut.RegistrarCobroManualAsync(1, 120, 50, "Efectivo", null, null, "Admin");
        Assert.IsFalse(r6.Success);
        Assert.AreEqual("Debe ingresar una observación justificando el cambio de precio total.", r6.Error);

        // 7. Success with parcial payment
        var r7 = await _sut.RegistrarCobroManualAsync(1, 100, 40, "Efectivo", null, null, "Admin");
        Assert.IsTrue(r7.Success);
        Assert.AreEqual("Parcial", r7.Pago!.TipoPago);

        // 8. Success with restante payment
        _context.ChangeTracker.Clear();
        var r8 = await _sut.RegistrarCobroManualAsync(1, 100, 60, "Efectivo", null, null, "Admin");
        Assert.IsTrue(r8.Success);
        Assert.AreEqual("Restante", r8.Pago!.TipoPago);
    }
}
