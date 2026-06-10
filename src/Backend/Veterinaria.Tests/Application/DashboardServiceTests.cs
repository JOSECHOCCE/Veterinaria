using System;
using System.Collections.Generic;
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
public class DashboardServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private DashboardService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Dashboard_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);

        _sut = new DashboardService(_unitOfWork);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task GetDashboardDataAsync_DebeCalcularEstadisticasCorrectamente()
    {
        // Arrange
        var hoy = DateTime.Today;
        var usuario = new Usuario { Id = 1, Nombre = "Juan Owner", Email = "j@t.com", Activo = true };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", Especie = "Perro", UsuarioId = 1 };
        var servicio = new Servicio { Id = 1, Nombre = "Vacuna", Precio = 50m, Activo = true };
        var vet = new Veterinario { Id = 1, Nombre = "Dr. Smith", Activo = true };

        // Citas de hoy en diferentes estados
        var c1 = new Cita { Id = 1, MascotaId = 1, ServicioId = 1, VeterinarioId = 1, FechaHora = hoy.AddHours(9), Estado = "Pendiente", MontoTotal = 50m, MontoPagado = 0m, EstadoPago = "Pendiente" };
        var c2 = new Cita { Id = 2, MascotaId = 1, ServicioId = 1, VeterinarioId = 1, FechaHora = hoy.AddHours(10), Estado = "Confirmada", MontoTotal = 50m, MontoPagado = 50m, EstadoPago = "Pagado" };
        var c3 = new Cita { Id = 3, MascotaId = 1, ServicioId = 1, VeterinarioId = 1, FechaHora = hoy.AddHours(11), Estado = "Completada", MontoTotal = 50m, MontoPagado = 0m, EstadoPago = "Pendiente" };
        var c4 = new Cita { Id = 4, MascotaId = 1, ServicioId = 1, VeterinarioId = 1, FechaHora = hoy.AddHours(12), Estado = "Cancelada", MontoTotal = 50m, MontoPagado = 0m, EstadoPago = "Pendiente" };

        // Cita futura
        var cFutura = new Cita { Id = 5, MascotaId = 1, ServicioId = 1, VeterinarioId = 1, FechaHora = hoy.AddDays(2).AddHours(14), Estado = "Confirmada" };

        // Pago
        var pago = new Pago { Id = 1, CitaId = 2, Monto = 50m, MetodoPago = "Tarjeta", FechaPago = hoy };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddRangeAsync(c1, c2, c3, c4, cFutura);
        await _context.Pagos.AddAsync(pago);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetDashboardDataAsync();

        // Assert
        Assert.AreEqual(4, result.CitasHoyTotal);
        Assert.AreEqual(1, result.CitasHoyPendientes);
        Assert.AreEqual(1, result.CitasHoyConfirmadas);
        Assert.AreEqual(1, result.CitasHoyCompletadas);
        Assert.AreEqual(1, result.CitasHoyCanceladas);

        Assert.AreEqual(50m, result.IngresosMes);
        Assert.AreEqual(1, result.PagosConfirmadosMes);
        Assert.AreEqual(1, result.PagosPendientesCount);
        Assert.AreEqual(50m, result.PagosPendientesTotal); // MontoTotal - MontoPagado for c3 (50 - 0 = 50)

        Assert.AreEqual(1, result.TotalMascotas);
        Assert.AreEqual(1, result.TotalVeterinarios);
        Assert.AreEqual(1, result.TotalUsuarios);
        Assert.AreEqual(1, result.TotalServicios);

        Assert.AreEqual(1, result.ServiciosMasSolicitados.Count);
        Assert.AreEqual("Vacuna", result.ServiciosMasSolicitados.First().Nombre);
        Assert.AreEqual(4, result.ServiciosMasSolicitados.First().CantidadCitas); // Excludes Cancelada (c4)

        Assert.AreEqual(3, result.ProximasCitas.Count); // c1, c2, and cFutura are upcoming in next 3 days
    }
}
