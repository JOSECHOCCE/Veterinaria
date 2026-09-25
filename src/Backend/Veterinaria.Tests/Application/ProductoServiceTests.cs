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
public class ProductoServiceTests
{
    private VeterinariaDbContext _context = default!;
    private UnitOfWork _unitOfWork = default!;
    private ProductoService _sut = default!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
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
    }

    [TestMethod]
    public async Task CalcularRopDinamicoAsync_ConHistorialVentas30Dias_DebeCalcularFormulaCorrecta()
    {
        // GIVEN: Producto con LeadTime = 5, StockSeguridad = 10
        var producto = new Producto
        {
            Id = 1,
            Nombre = "Amoxicilina 500mg",
            Stock = 50,
            StockMinimo = 15,
            LeadTimeDias = 5,
            StockSeguridad = 10
        };
        await _context.Productos.AddAsync(producto);

        // Ventas en los últimos 30 días sumando 60 unidades (Consumo diario = 60/30 = 2 un/día)
        var venta = new Venta
        {
            Id = 1,
            Fecha = DateTime.UtcNow.AddDays(-10),
            Estado = "Completada"
        };
        var detalleVenta = new DetalleVenta
        {
            Id = 1,
            VentaId = 1,
            ProductoId = 1,
            Cantidad = 60,
            PrecioUnitario = 10
        };

        await _context.Ventas.AddAsync(venta);
        await _context.DetallesVentas.AddAsync(detalleVenta);
        await _context.SaveChangesAsync();

        // WHEN: Se calcula el ROP dinámico
        // ROP = (60 / 30) * 5 + 10 = 2 * 5 + 10 = 20
        var rop = await _sut.CalcularRopDinamicoAsync(1);

        // THEN: ROP debe ser 20
        Assert.AreEqual(20, rop);
    }

    [TestMethod]
    public async Task CalcularRopDinamicoAsync_ProductoNuevoSinHistorial_DebeUsarStockMinimoFallback()
    {
        // GIVEN: Producto nuevo sin ventas registradas
        var producto = new Producto
        {
            Id = 2,
            Nombre = "Shampoo Antiséptico Nuevo",
            Stock = 30,
            StockMinimo = 15,
            LeadTimeDias = 7,
            StockSeguridad = 10
        };
        await _context.Productos.AddAsync(producto);
        await _context.SaveChangesAsync();

        // WHEN: Se calcula el ROP para un producto sin historial
        var rop = await _sut.CalcularRopDinamicoAsync(2);

        // THEN: Debe retornar StockMinimo (15) como fallback
        Assert.AreEqual(15, rop);
    }

    [TestMethod]
    public async Task RegistrarMermaAsync_CuandoRegistraBaja_DebeRegistrarKardexYDescontarStock()
    {
        // GIVEN: Producto con Stock inicial de 50
        var producto = new Producto
        {
            Id = 3,
            Nombre = "Vacuna Septuple",
            Stock = 50,
            StockMinimo = 10
        };
        await _context.Productos.AddAsync(producto);
        await _context.SaveChangesAsync();

        var dto = new RegistrarMermaDto
        {
            ProductoId = 3,
            Cantidad = 5,
            Motivo = "Merma_Vencido",
            Observaciones = "Lote vencido el 01/08/2026"
        };

        // WHEN: Se registra la merma
        var result = await _sut.RegistrarMermaAsync(dto, "admin@test.com");

        // THEN: El stock debe disminuir a 45 y debe existir la entrada en Kardex
        Assert.IsTrue(result.Success, result.Message);
        var productoActualizado = await _context.Productos.FindAsync(3);
        Assert.AreEqual(45, productoActualizado!.Stock);

        var kardex = await _context.MovimientosInventario.FirstOrDefaultAsync(m => m.ProductoId == 3);
        Assert.IsNotNull(kardex);
        Assert.AreEqual("Merma_Vencido", kardex.TipoMovimiento);
        Assert.AreEqual(5, kardex.Cantidad);
        Assert.AreEqual("admin@test.com", kardex.RegistradoPor);
    }

    [TestMethod]
    public async Task GetAlertasInventarioAsync_DebeRetornarProductosConStockMenorORopYPorVencer()
    {
        // GIVEN: Producto A (Stock <= ROP) y Producto B (Por vencer < 30 días)
        var prodA = new Producto
        {
            Id = 4,
            Nombre = "Gasas Estériles",
            Stock = 12,
            StockMinimo = 20, // ROP fallback = 20 -> Stock (12) <= ROP (20)
            LeadTimeDias = 3,
            StockSeguridad = 5
        };

        var prodB = new Producto
        {
            Id = 5,
            Nombre = "Antibiótico Gotas",
            Stock = 100,
            StockMinimo = 10,
            LeadTimeDias = 3,
            StockSeguridad = 5,
            FechaVencimiento = DateTime.UtcNow.AddDays(15) // Vence en 15 días (< 30)
        };

        await _context.Productos.AddRangeAsync(prodA, prodB);
        await _context.SaveChangesAsync();

        // WHEN: Se consultan las alertas de inventario
        var alertas = (await _sut.GetAlertasInventarioAsync()).ToList();

        // THEN: Ambos productos deben aparecer en las alertas
        Assert.AreEqual(2, alertas.Count);
        Assert.IsTrue(alertas.Any(a => a.Id == 4 && a.TipoAlerta == "StockBajo"));
        Assert.IsTrue(alertas.Any(a => a.Id == 5 && a.TipoAlerta == "PorVencer"));
    }
}
