using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Veterinaria.Application.Services;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;
using Veterinaria.Infrastructure.Repositories;

namespace Veterinaria.Tests.Application;

[TestClass]
public class ProductoServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private ProductoService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Producto_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);

        _sut = new ProductoService(_unitOfWork);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task AddProductoAsync_DebeGuardarProducto()
    {
        // Arrange
        var p = new Producto { Id = 1, Nombre = "Shampoo", Activo = true, Stock = 10, Precio = 15m };

        // Act
        await _sut.AddProductoAsync(p);

        // Assert
        var inDb = await _context.Productos.FindAsync(1);
        Assert.IsNotNull(inDb);
        Assert.AreEqual("Shampoo", inDb!.Nombre);
    }

    [TestMethod]
    public async Task DeleteProductoAsync_DebeHacerSoftDelete()
    {
        // Arrange
        var p = new Producto { Id = 1, Nombre = "Collar", Activo = true, Stock = 5 };
        await _context.Productos.AddAsync(p);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        await _sut.DeleteProductoAsync(1);

        // Assert
        var inDb = await _context.Productos.FindAsync(1);
        Assert.IsNotNull(inDb);
        Assert.IsFalse(inDb!.Activo);
    }

    [TestMethod]
    public async Task GetProductosBajoStockAsync_DebeRetornarCorrectos()
    {
        // Arrange
        // StockMinimo is a property on Producto. Let's set it.
        var p1 = new Producto { Id = 1, Nombre = "P1", Activo = true, Stock = 2, StockMinimo = 5 };
        var p2 = new Producto { Id = 2, Nombre = "P2", Activo = true, Stock = 10, StockMinimo = 5 };
        var p3 = new Producto { Id = 3, Nombre = "P3", Activo = false, Stock = 1, StockMinimo = 5 }; // Inactive

        await _context.Productos.AddRangeAsync(p1, p2, p3);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetProductosBajoStockAsync();

        // Assert
        Assert.AreEqual(1, result.Count());
        Assert.AreEqual("P1", result.First().Nombre);
    }

    [TestMethod]
    public async Task GetActiveProductosQuery_DebeRetornarSoloActivos()
    {
        // Arrange
        var p1 = new Producto { Id = 1, Nombre = "P1", Activo = true };
        var p2 = new Producto { Id = 2, Nombre = "P2", Activo = false };
        await _context.Productos.AddRangeAsync(p1, p2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = _sut.GetActiveProductosQuery().ToList();

        // Assert
        Assert.AreEqual(1, result.Count);
        Assert.AreEqual("P1", result.First().Nombre);
    }

    [TestMethod]
    public async Task GetProductoByIdAsync_DebeRetornarProductoCuandoExiste()
    {
        // Arrange
        var p = new Producto { Id = 10, Nombre = "P10", Activo = true };
        await _context.Productos.AddAsync(p);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetProductoByIdAsync(10);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("P10", result.Nombre);
    }

    [TestMethod]
    public async Task GetProductoByIdAsync_DebeRetornarNullCuandoNoExiste()
    {
        // Act
        var result = await _sut.GetProductoByIdAsync(999);

        // Assert
        Assert.IsNull(result);
    }

    [TestMethod]
    public async Task UpdateProductoAsync_DebeActualizarProducto()
    {
        // Arrange
        var p = new Producto { Id = 11, Nombre = "Original", Activo = true };
        await _context.Productos.AddAsync(p);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        p.Nombre = "Modificado";

        // Act
        await _sut.UpdateProductoAsync(p);

        // Assert
        var inDb = await _context.Productos.FindAsync(11);
        Assert.IsNotNull(inDb);
        Assert.AreEqual("Modificado", inDb!.Nombre);
    }

    [TestMethod]
    public async Task DeleteProductoAsync_CuandoNoExiste_NoDebeHacerNada()
    {
        // Act
        await _sut.DeleteProductoAsync(999);

        // Assert
        var count = await _context.Productos.CountAsync();
        Assert.AreEqual(0, count);
    }
}
