using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
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
public class ReporteServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private ReporteService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Reporte_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);

        _sut = new ReporteService(_unitOfWork);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task GetReporteCitasAsync_DebeFiltrarPorEstadoYVeterinario()
    {
        // Arrange
        var hoy = DateTime.Today;
        var user = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1 };
        var servicio = new Servicio { Id = 1, Nombre = "Vacuna", Activo = true };
        var vet1 = new Veterinario { Id = 1, Nombre = "Vet A", Activo = true };
        var vet2 = new Veterinario { Id = 2, Nombre = "Vet B", Activo = true };

        var c1 = new Cita { Id = 1, MascotaId = 1, ServicioId = 1, VeterinarioId = 1, FechaHora = hoy, Estado = "Completada" };
        var c2 = new Cita { Id = 2, MascotaId = 1, ServicioId = 1, VeterinarioId = 2, FechaHora = hoy, Estado = "Cancelada" };

        await _context.Usuarios.AddAsync(user);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddRangeAsync(vet1, vet2);
        await _context.Citas.AddRangeAsync(c1, c2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var resultAll = await _sut.GetReporteCitasAsync(hoy.AddDays(-1), hoy.AddDays(1), null, null);
        var resultVet1 = await _sut.GetReporteCitasAsync(hoy.AddDays(-1), hoy.AddDays(1), null, 1);
        var resultCompletada = await _sut.GetReporteCitasAsync(hoy.AddDays(-1), hoy.AddDays(1), "Completada", null);

        // Assert
        Assert.AreEqual(2, resultAll.Data!.TotalCitas);
        Assert.AreEqual(1, resultVet1.Data!.TotalCitas);
        Assert.AreEqual(1, resultCompletada.Data!.TotalCitas);
        Assert.AreEqual("Completada", resultCompletada.Data.Detalle.First().Estado);
    }

    [TestMethod]
    public async Task GetReporteIngresosAsync_DebeSumarPorMetodoPago()
    {
        // Arrange
        var hoy = DateTime.Today;
        var user = new Usuario { Id = 1, Rol = "Cliente" };
        var mascota = new Mascota { Id = 1, UsuarioId = 1 };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta" };
        var cita = new Cita { Id = 1, MascotaId = 1, ServicioId = 1 };

        var p1 = new Pago { Id = 1, CitaId = 1, Monto = 100m, MetodoPago = "Tarjeta", FechaPago = hoy };
        var p2 = new Pago { Id = 2, CitaId = 1, Monto = 50m, MetodoPago = "Efectivo", FechaPago = hoy };

        await _context.Usuarios.AddAsync(user);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Citas.AddAsync(cita);
        await _context.Pagos.AddRangeAsync(p1, p2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetReporteIngresosAsync(hoy.AddDays(-1), hoy.AddDays(1), null);

        // Assert
        Assert.AreEqual(150m, result.Data!.TotalIngresos);
        Assert.AreEqual(100m, result.Data.TotalTarjeta);
        Assert.AreEqual(50m, result.Data.TotalEfectivo);
    }

    [TestMethod]
    public async Task GetReporteNuevosClientesAsync_DebeCalcularNuevosClientesYMascotas()
    {
        // Arrange
        var hoy = DateTime.Today;
        var u1 = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente", FechaRegistro = hoy };
        var u2 = new Usuario { Id = 2, Nombre = "Pedro", Rol = "Cliente", FechaRegistro = hoy };
        var m1 = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1 };
        var m2 = new Mascota { Id = 2, Nombre = "Ramiro", UsuarioId = 1 };

        await _context.Usuarios.AddRangeAsync(u1, u2);
        await _context.Mascotas.AddRangeAsync(m1, m2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetReporteNuevosClientesAsync(hoy.AddDays(-1), hoy.AddDays(1));

        // Assert
        Assert.AreEqual(2, result.Data!.TotalNuevosClientes);
        Assert.AreEqual(2, result.Data.TotalNuevasMascotas);
    }

    [TestMethod]
    public async Task ExportarReporteCitasCsvAsync_DebeGenerarBytesCorrectos()
    {
        // Arrange
        var hoy = DateTime.Today;
        var user = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido, Jr.", UsuarioId = 1 }; // Contains comma
        var servicio = new Servicio { Id = 1, Nombre = "Vacuna", Activo = true };
        var vet = new Veterinario { Id = 1, Nombre = "Dr. Smith", Activo = true };
        var cita = new Cita { Id = 1, MascotaId = 1, ServicioId = 1, VeterinarioId = 1, FechaHora = hoy, Estado = "Completada", MontoTotal = 50m };

        await _context.Usuarios.AddAsync(user);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var csvBytes = await _sut.ExportarReporteCitasCsvAsync(hoy.AddDays(-1), hoy.AddDays(1), null, null);
        var csvString = Encoding.UTF8.GetString(csvBytes);

        // Assert
        Assert.IsTrue(csvString.Contains("\"Fido, Jr.\"")); // Escaped CSV
        Assert.IsTrue(csvString.Contains("Completada"));
        Assert.IsTrue(csvString.Contains("Dr. Smith"));
    }

    [TestMethod]
    public async Task ExportarReporteIngresosCsvAsync_DebeGenerarBytesCorrectos()
    {
        // Arrange
        var hoy = DateTime.Today;
        var user = new Usuario { Id = 1, Rol = "Cliente" };
        var mascota = new Mascota { Id = 1, UsuarioId = 1 };
        var servicio = new Servicio { Id = 1, Nombre = "Consulta General" };
        var cita = new Cita { Id = 1, MascotaId = 1, ServicioId = 1 };
        var pago = new Pago { Id = 1, CitaId = 1, Monto = 75m, MetodoPago = "Tarjeta", FechaPago = hoy };

        await _context.Usuarios.AddAsync(user);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Citas.AddAsync(cita);
        await _context.Pagos.AddAsync(pago);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var csvBytes = await _sut.ExportarReporteIngresosCsvAsync(hoy.AddDays(-1), hoy.AddDays(1), null);
        var csvString = Encoding.UTF8.GetString(csvBytes);

        // Assert
        Assert.IsTrue(csvString.Contains("Pago Cita #1 - Consulta General"));
        Assert.IsTrue(csvString.Contains("Tarjeta"));
        Assert.IsTrue(csvString.Contains("75"));
    }
}
