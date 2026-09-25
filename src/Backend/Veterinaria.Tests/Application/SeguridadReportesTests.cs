using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Veterinaria.Application.Interfaces;
using Veterinaria.Application.Services;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;
using Veterinaria.Infrastructure.Repositories;

namespace Veterinaria.Tests.Application;

[TestClass]
public class SeguridadReportesTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private AuditoriaService _auditoriaService = null!;
    private AnonymizationService _anonymizationService = null!;
    private ReporteService _reporteService = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_SeguridadReportes_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        _auditoriaService = new AuditoriaService(_unitOfWork);
        _anonymizationService = new AnonymizationService(_unitOfWork, _auditoriaService);
        _reporteService = new ReporteService(_unitOfWork);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task AnonimizarClienteAsync_DebeEnmascararPiiEIrreversiblementeYConservarMascotas()
    {
        // Arrange
        var cliente = new Usuario
        {
            Id = 10,
            Nombre = "Juan Pérez",
            DNI = "45871234",
            Email = "juan.perez@email.com",
            Telefono = "987654321",
            Direccion = "Av. Larco 123",
            Rol = "Cliente",
            Activo = true,
            EsAnonimizado = false
        };
        var mascota = new Mascota { Id = 100, Nombre = "Firulais", UsuarioId = 10, Especie = "Perro" };
        var cita = new Cita { Id = 500, MascotaId = 100, VeterinarioId = 2, Estado = "Completada" };
        var historial = new HistorialClinico { Id = 1000, CitaId = 500, Cita = cita, Diagnostico = "Gastroenteritis", Cerrado = true };

        await _context.Usuarios.AddAsync(cliente);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Citas.AddAsync(cita);
        await _context.HistorialesClinicos.AddAsync(historial);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _anonymizationService.AnonimizarClienteAsync(10, ejecutadoPorUsuarioId: 1, ipAddress: "127.0.0.1");

        // Assert
        Assert.IsNotNull(result);
        Assert.IsTrue(result.EsAnonimizado);
        Assert.AreEqual("Cliente Anónimo #10", result.Nombre);
        Assert.AreEqual("00000000", result.DNI);
        Assert.AreEqual("anonimo_10@deleted.local", result.Email);
        Assert.AreEqual("000000000", result.Telefono);
        Assert.AreEqual("ANONIMIZADO", result.Direccion);
        Assert.IsNotNull(result.FechaAnonimizacion);

        // Verify pets and medical records remain linked
        var dbMascota = await _context.Mascotas.FindAsync(100);
        Assert.IsNotNull(dbMascota);
        Assert.AreEqual(10, dbMascota.UsuarioId);

        var dbHistorial = await _context.HistorialesClinicos.FindAsync(1000);
        Assert.IsNotNull(dbHistorial);
        Assert.AreEqual("Gastroenteritis", dbHistorial.Diagnostico);
    }

    [TestMethod]
    public async Task AnonimizarClienteAsync_DebeRegistrarLogAuditoria()
    {
        // Arrange
        var cliente = new Usuario { Id = 20, Nombre = "María García", Rol = "Cliente", Email = "maria@email.com" };
        await _context.Usuarios.AddAsync(cliente);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        await _anonymizationService.AnonimizarClienteAsync(20, ejecutadoPorUsuarioId: 1, ipAddress: "192.168.1.50");

        // Assert
        var auditLogs = await _context.AuditoriaLogs.ToListAsync();
        Assert.AreEqual(1, auditLogs.Count);
        var log = auditLogs.First();
        Assert.AreEqual(1, log.UsuarioId);
        Assert.AreEqual("AnonimizacionCliente", log.Accion);
        Assert.AreEqual("Usuario", log.EntidadNombre);
        Assert.AreEqual("20", log.EntidadId);
        Assert.AreEqual("192.168.1.50", log.IpAddress);
    }

    [TestMethod]
    public async Task ObtenerIngresosCategorizadosAsync_DebeDesglosarCorrectamenteServiciosBoticaYPetshop()
    {
        // Arrange
        var fechaInicio = new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc);
        var fechaFin = new DateTime(2026, 8, 10, 23, 59, 59, DateTimeKind.Utc);

        // 1. Orden de Cobro (Servicios Médicos)
        var ordenCobro = new OrdenCobro
        {
            Id = 1,
            CitaId = 50,
            ClienteId = 10,
            MontoTotal = 150.00m,
            Estado = "Pagada",
            Fecha = new DateTime(2026, 8, 2, 10, 0, 0, DateTimeKind.Utc)
        };

        // 2. Venta Farmacia (RequiereReceta = true)
        var prodFarmacia = new Producto { Id = 1, Nombre = "Antibiótico Vet", Categoria = "Medicamento", RequiereReceta = true, Precio = 85.00m };
        var ventaFarmacia = new Venta
        {
            Id = 101,
            Total = 85.00m,
            Estado = "Completada",
            Fecha = new DateTime(2026, 8, 3, 14, 0, 0, DateTimeKind.Utc),
            Detalles = new List<DetalleVenta>
            {
                new DetalleVenta { Id = 1001, ProductoId = 1, Producto = prodFarmacia, Cantidad = 1, PrecioUnitario = 85.00m, Subtotal = 85.00m }
            }
        };

        // 3. Venta Petshop (RequiereReceta = false)
        var prodPetshop = new Producto { Id = 2, Nombre = "Champú Canino", Categoria = "Higiene", RequiereReceta = false, Precio = 45.00m };
        var ventaPetshop = new Venta
        {
            Id = 102,
            Total = 45.00m,
            Estado = "Completada",
            Fecha = new DateTime(2026, 8, 4, 16, 0, 0, DateTimeKind.Utc),
            Detalles = new List<DetalleVenta>
            {
                new DetalleVenta { Id = 1002, ProductoId = 2, Producto = prodPetshop, Cantidad = 1, PrecioUnitario = 45.00m, Subtotal = 45.00m }
            }
        };

        await _context.OrdenesCobro.AddAsync(ordenCobro);
        await _context.Productos.AddRangeAsync(prodFarmacia, prodPetshop);
        await _context.Ventas.AddRangeAsync(ventaFarmacia, ventaPetshop);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _reporteService.ObtenerIngresosCategorizadosAsync(fechaInicio, fechaFin);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(150.00m, result.TotalServiciosMedicos);
        Assert.AreEqual(85.00m, result.TotalFarmaciaBotica);
        Assert.AreEqual(45.00m, result.TotalPetshopRetail);
        Assert.AreEqual(280.00m, result.TotalGeneral);
        Assert.AreEqual(1, result.CantidadOrdenesServicios);
        Assert.AreEqual(1, result.CantidadVentasFarmacia);
        Assert.AreEqual(1, result.CantidadVentasPetshop);
    }

    [TestMethod]
    public async Task RegistrarAccionAsync_DebeGrabarRegistroEnTablaAuditoriaLog()
    {
        // Act
        await _auditoriaService.RegistrarAccionAsync(
            usuarioId: 5,
            accion: "AnulacionVenta",
            entidadNombre: "Venta",
            entidadId: "105",
            datosPrevios: "{\"Total\": 120.00}",
            datosNuevos: "{\"Estado\": \"Anulada\"}",
            ipAddress: "10.0.0.1"
        );

        // Assert
        var logs = await _context.AuditoriaLogs.ToListAsync();
        Assert.AreEqual(1, logs.Count);
        Assert.AreEqual("AnulacionVenta", logs[0].Accion);
        Assert.AreEqual("Venta", logs[0].EntidadNombre);
        Assert.AreEqual("105", logs[0].EntidadId);
    }

    [TestMethod]
    public async Task ObtenerLogsAuditoriaAsync_DebeFiltrarPorRangoFechas()
    {
        // Arrange
        var log1 = new AuditoriaLog { Id = 1, Accion = "Accion1", EntidadNombre = "Test", EntidadId = "1", Fecha = new DateTime(2026, 8, 1, 12, 0, 0, DateTimeKind.Utc) };
        var log2 = new AuditoriaLog { Id = 2, Accion = "Accion2", EntidadNombre = "Test", EntidadId = "2", Fecha = new DateTime(2026, 8, 5, 12, 0, 0, DateTimeKind.Utc) };
        var log3 = new AuditoriaLog { Id = 3, Accion = "Accion3", EntidadNombre = "Test", EntidadId = "3", Fecha = new DateTime(2026, 8, 10, 12, 0, 0, DateTimeKind.Utc) };

        await _context.AuditoriaLogs.AddRangeAsync(log1, log2, log3);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _auditoriaService.ObtenerLogsAuditoriaAsync(new DateTime(2026, 8, 4, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 8, 6, 23, 59, 59, DateTimeKind.Utc));

        // Assert
        var list = result.ToList();
        Assert.AreEqual(1, list.Count);
        Assert.AreEqual("Accion2", list[0].Accion);
    }
}
