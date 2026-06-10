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
public class VentaServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private Mock<INotificacionService> _notificacionServiceMock = null!;
    private VentaService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Venta_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        _notificacionServiceMock = new Mock<INotificacionService>();

        _sut = new VentaService(_unitOfWork, _notificacionServiceMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task RegistrarVentaAsync_CuandoDetallesVacios_DebeLanzarArgumentException()
    {
        // Arrange
        var venta = new Venta { Id = 1, Detalles = new List<DetalleVenta>() };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ArgumentException>(() => _sut.RegistrarVentaAsync(venta));
    }

    [TestMethod]
    public async Task RegistrarVentaAsync_CuandoProductoInactivo_DebeLanzarInvalidOperationException()
    {
        // Arrange
        var prod = new Producto { Id = 10, Nombre = "Shampoo", Activo = false, Stock = 5 };
        await _context.Productos.AddAsync(prod);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var venta = new Venta
        {
            Id = 1,
            Detalles = new List<DetalleVenta> { new() { ProductoId = 10, Cantidad = 1 } }
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<InvalidOperationException>(() => _sut.RegistrarVentaAsync(venta));
    }

    [TestMethod]
    public async Task RegistrarVentaAsync_CuandoStockInsuficiente_DebeLanzarInvalidOperationException()
    {
        // Arrange
        var prod = new Producto { Id = 10, Nombre = "Shampoo", Activo = true, Stock = 1 };
        await _context.Productos.AddAsync(prod);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var venta = new Venta
        {
            Id = 1,
            Detalles = new List<DetalleVenta> { new() { ProductoId = 10, Cantidad = 2 } }
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<InvalidOperationException>(() => _sut.RegistrarVentaAsync(venta));
    }

    [TestMethod]
    public async Task RegistrarVentaAsync_CuandoExitoso_DebeDeducirStockYCrearNotificacionSiBajoMinimo()
    {
        // Arrange
        var prod = new Producto { Id = 10, Nombre = "Comida", Activo = true, Stock = 5, StockMinimo = 4, Precio = 20m };
        var admin = new Usuario { Id = 1, Nombre = "Admin", Rol = "Admin", Activo = true, Email = "admin@t.com" };
        
        await _context.Productos.AddAsync(prod);
        await _context.Usuarios.AddAsync(admin);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var venta = new Venta
        {
            Id = 1,
            Detalles = new List<DetalleVenta> { new() { ProductoId = 10, Cantidad = 2 } } // Stock becomes 3, which is <= StockMinimo (4)
        };

        // Act
        var result = await _sut.RegistrarVentaAsync(venta);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(40m, result.Total); // 20m * 2
        var dbProd = await _context.Productos.FindAsync(10);
        Assert.AreEqual(3, dbProd!.Stock);

        _notificacionServiceMock.Verify(n => n.CrearNotificacionAsync(1, "Alerta de Stock Mínimo", It.IsAny<string>(), "Warning", "inventory", "/admin/inventario"), Times.Once);
    }

    [TestMethod]
    public async Task CancelarVentaAsync_DebeRestaurarStockYCambiarEstado()
    {
        // Arrange
        var prod = new Producto { Id = 10, Nombre = "Comida", Activo = true, Stock = 3, Precio = 20m };
        var venta = new Venta
        {
            Id = 1,
            Estado = "Completada",
            Detalles = new List<DetalleVenta> { new() { Id = 1, VentaId = 1, ProductoId = 10, Cantidad = 2, PrecioUnitario = 20m } }
        };

        await _context.Productos.AddAsync(prod);
        await _context.Ventas.AddAsync(venta);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var success = await _sut.CancelarVentaAsync(1);

        // Assert
        Assert.IsTrue(success);
        var dbVenta = await _context.Ventas.FindAsync(1);
        Assert.AreEqual("Cancelada", dbVenta!.Estado);

        var dbProd = await _context.Productos.FindAsync(10);
        Assert.AreEqual(5, dbProd!.Stock); // 3 + 2
    }

    [TestMethod]
    public async Task GetVentasQuery_DebeRetornarVentasConDetalles()
    {
        // Arrange
        var cliente = new Usuario { Id = 10, Nombre = "Client A", Email = "c1@t.com" };
        var prod = new Producto { Id = 5, Nombre = "P5", Precio = 10m };
        var venta = new Venta
        {
            Id = 5,
            ClienteId = 10,
            Detalles = new List<DetalleVenta> { new() { ProductoId = 5, Cantidad = 1 } }
        };
        await _context.Usuarios.AddAsync(cliente);
        await _context.Productos.AddAsync(prod);
        await _context.Ventas.AddAsync(venta);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = _sut.GetVentasQuery().ToList();

        // Assert
        Assert.AreEqual(1, result.Count);
        Assert.AreEqual(5, result[0].Id);
        Assert.IsNotNull(result[0].Cliente);
        Assert.AreEqual(1, result[0].Detalles.Count);
        Assert.IsNotNull(result[0].Detalles.First().Producto);
    }

    [TestMethod]
    public async Task GetVentaByIdAsync_DebeRetornarVentaONull()
    {
        // Arrange
        var venta = new Venta { Id = 6, Detalles = new List<DetalleVenta>() };
        await _context.Ventas.AddAsync(venta);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act & Assert
        var result = await _sut.GetVentaByIdAsync(6);
        Assert.IsNotNull(result);

        var nullResult = await _sut.GetVentaByIdAsync(999);
        Assert.IsNull(nullResult);
    }

    [TestMethod]
    public async Task RegistrarVentaAsync_CuandoVentaNula_DebeLanzarArgumentException()
    {
        await Assert.ThrowsExactlyAsync<ArgumentException>(async () => await _sut.RegistrarVentaAsync(null!));
    }

    [TestMethod]
    public async Task RegistrarVentaAsync_CuandoProductoInexistente_DebeLanzarInvalidOperationException()
    {
        var venta = new Venta
        {
            Id = 1,
            Detalles = new List<DetalleVenta> { new() { ProductoId = 999, Cantidad = 1 } }
        };

        await Assert.ThrowsExactlyAsync<InvalidOperationException>(async () => await _sut.RegistrarVentaAsync(venta));
    }

    [TestMethod]
    public async Task CancelarVentaAsync_CuandoNoExiste_DebeRetornarFalse()
    {
        // Act
        var success = await _sut.CancelarVentaAsync(999);

        // Assert
        Assert.IsFalse(success);
    }

    [TestMethod]
    public async Task CancelarVentaAsync_CuandoYaEstaCancelada_DebeRetornarFalse()
    {
        // Arrange
        var venta = new Venta { Id = 8, Estado = "Cancelada", Detalles = new List<DetalleVenta>() };
        await _context.Ventas.AddAsync(venta);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var success = await _sut.CancelarVentaAsync(8);

        // Assert
        Assert.IsFalse(success);
    }

    [TestMethod]
    public async Task RegistrarVentaAsync_CuandoNotificacionFalla_NoDebeAbortarLaVenta()
    {
        // Arrange
        var prod = new Producto { Id = 10, Nombre = "Comida", Activo = true, Stock = 5, StockMinimo = 4, Precio = 20m };
        var admin = new Usuario { Id = 1, Nombre = "Admin", Rol = "Admin", Activo = true, Email = "admin@t.com" };

        await _context.Productos.AddAsync(prod);
        await _context.Usuarios.AddAsync(admin);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var venta = new Venta
        {
            Id = 1,
            Detalles = new List<DetalleVenta> { new() { ProductoId = 10, Cantidad = 2 } }
        };

        // Setup mock to throw exception
        _notificacionServiceMock
            .Setup(n => n.CrearNotificacionAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("Mock error"));

        // Act
        var result = await _sut.RegistrarVentaAsync(venta);

        // Assert: should succeed despite the exception in notification service
        Assert.IsNotNull(result);
        Assert.AreEqual(40m, result.Total);
    }
}
