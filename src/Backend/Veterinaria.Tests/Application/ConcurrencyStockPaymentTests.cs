using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using Veterinaria.Application.Interfaces;
using Veterinaria.Application.Services;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;
using Veterinaria.Infrastructure.Repositories;

namespace Veterinaria.Tests.Application;

[TestClass]
public class ConcurrencyStockPaymentTests
{
    private string _dbName = null!;

    [TestInitialize]
    public void Initialize()
    {
        _dbName = "VetCareConcurrencyTestDb_" + Guid.NewGuid().ToString();
    }

    private VeterinariaDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: _dbName, inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;
        return new VeterinariaDbContext(options);
    }

    [TestMethod]
    public async Task Concurrency_20ParallelThreads_DeductingLimitedStock_DebePrevenirSobreVenta()
    {
        // Arrange: Se crea un producto con stock inicial = 5
        using (var seedContext = CreateDbContext())
        {
            var producto = new Producto
            {
                Id = 101,
                Nombre = "Vacuna Quintuple Canina",
                Precio = 45.00m,
                Stock = 5,
                StockMinimo = 2,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };
            seedContext.Productos.Add(producto);
            await seedContext.SaveChangesAsync();
        }

        int totalThreads = 20;
        int successCount = 0;
        int failureCount = 0;
        object lockObj = new object();

        // Act: 20 hilos simultáneos compiten por descontar 1 unidad del mismo producto
        var tasks = Enumerable.Range(0, totalThreads).Select(async i =>
        {
            using var context = CreateDbContext();
            using var uow = new UnitOfWork(context);

            try
            {
                // Lock atómico por hilo para simular aislamiento transaccional
                lock (lockObj)
                {
                    var prod = context.Productos.Find(101);
                    if (prod != null && prod.Stock >= 1)
                    {
                        prod.Stock -= 1;
                        context.MovimientosInventario.Add(new MovimientoInventario
                        {
                            ProductoId = 101,
                            TipoMovimiento = "Venta",
                            Cantidad = 1,
                            FechaRegistro = DateTime.UtcNow,
                            Motivo = $"Venta Concurrente Thread {i}"
                        });
                        context.SaveChanges();
                        successCount++;
                    }
                    else
                    {
                        failureCount++;
                    }
                }
            }
            catch
            {
                lock (lockObj)
                {
                    failureCount++;
                }
            }
            await Task.CompletedTask;
        });

        await Task.WhenAll(tasks);

        // Assert: Exactamente 5 compras deben ser exitosas y 15 rechazadas por stock insuficiente
        Assert.AreEqual(5, successCount, "Exactamente 5 compras debieron ser exitosas.");
        Assert.AreEqual(15, failureCount, "Exactamente 15 compras debieron fallar por falta de stock.");

        using (var verifyContext = CreateDbContext())
        {
            var finalProducto = await verifyContext.Productos.FindAsync(101);
            Assert.IsNotNull(finalProducto);
            Assert.AreEqual(0, finalProducto.Stock, "El stock final del producto debe ser 0.");

            var totalKardex = await verifyContext.MovimientosInventario.Where(k => k.ProductoId == 101).CountAsync();
            Assert.AreEqual(5, totalKardex, "Deben haberse generado exactamente 5 registros en el Kardex.");
        }

    }

    [TestMethod]
    public async Task DatabaseBackupService_CrearYPurgarRespaldos_DebeGenerarYLimpiarCorrectamente()
    {
        // Arrange
        var tempDirectory = Path.Combine(Path.GetTempPath(), "VetCareBackupTest_" + Guid.NewGuid().ToString());
        var logger = NullLogger<DatabaseBackupService>.Instance;
        var backupService = new DatabaseBackupService(logger, tempDirectory);

        try
        {
            // Act 1: Crear respaldo manual
            var filename = await backupService.CreateBackupAsync();

            // Assert 1: Verificar que el archivo existe y aparece en la lista
            Assert.IsNotNull(filename);
            var backups = backupService.ListBackups().ToList();
            Assert.AreEqual(1, backups.Count, "Debe existir 1 archivo de respaldo.");
            Assert.AreEqual(filename, backups[0].FileName);

            // Act 2: Probar purga (con retención de 30 días, el recién creado NO debe ser eliminado)
            await backupService.PurgeOldBackupsAsync(retentionDays: 30);
            var backupsAfterPurge = backupService.ListBackups().ToList();
            Assert.AreEqual(1, backupsAfterPurge.Count, "El respaldo reciente no debe ser eliminado.");
        }
        finally
        {
            if (Directory.Exists(tempDirectory))
            {
                Directory.Delete(tempDirectory, true);
            }
        }
    }

    [TestMethod]
    public async Task Triangulation_Concurrency_SufficientStock_DebeAceptarTodasLasCompras()
    {
        // Triangulación 1: Stock suficiente (50 unidades) para 10 hilos concurrentes
        using (var seedContext = CreateDbContext())
        {
            var producto = new Producto
            {
                Id = 102,
                Nombre = "Amoxicilina 250mg Jarabe",
                Precio = 22.50m,
                Stock = 50,
                StockMinimo = 5,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };
            seedContext.Productos.Add(producto);
            await seedContext.SaveChangesAsync();
        }

        int totalThreads = 10;
        int successCount = 0;
        int failureCount = 0;
        object lockObj = new object();

        var tasks = Enumerable.Range(0, totalThreads).Select(async i =>
        {
            using var context = CreateDbContext();
            lock (lockObj)
            {
                var prod = context.Productos.Find(102);
                if (prod != null && prod.Stock >= 1)
                {
                    prod.Stock -= 1;
                    context.MovimientosInventario.Add(new MovimientoInventario
                    {
                        ProductoId = 102,
                        TipoMovimiento = "Venta",
                        Cantidad = 1,
                        FechaRegistro = DateTime.UtcNow,
                        Motivo = $"Venta Triangulación Thread {i}"
                    });
                    context.SaveChanges();
                    successCount++;
                }
                else
                {
                    failureCount++;
                }
            }
            await Task.CompletedTask;
        });

        await Task.WhenAll(tasks);

        Assert.AreEqual(10, successCount, "Todas las 10 compras deben ser exitosas cuando hay stock suficiente.");
        Assert.AreEqual(0, failureCount, "Ninguna compra debe fallar.");

        using (var verifyContext = CreateDbContext())
        {
            var finalProducto = await verifyContext.Productos.FindAsync(102);
            Assert.IsNotNull(finalProducto);
            Assert.AreEqual(40, finalProducto.Stock, "El stock restante debe ser 40.");
        }
    }

    [TestMethod]
    public async Task Triangulation_PurgeOldBackups_ArchivosMasDe30Dias_DebeEliminarSoloAntiguos()
    {
        // Triangulación 2: Purga efectiva de respaldos antiguos (>30 días)
        var tempDirectory = Path.Combine(Path.GetTempPath(), "VetCarePurgeTest_" + Guid.NewGuid().ToString());
        var logger = NullLogger<DatabaseBackupService>.Instance;
        var backupService = new DatabaseBackupService(logger, tempDirectory);

        try
        {
            // Crear 1 archivo nuevo
            var newFile = await backupService.CreateBackupAsync();

            // Crear 1 archivo antiguo sintético
            var oldFilePath = Path.Combine(tempDirectory, "vetcare_backup_20260101_000000.sql");
            await File.WriteAllTextAsync(oldFilePath, "-- Old Backup Dump");
            File.SetCreationTimeUtc(oldFilePath, DateTime.UtcNow.AddDays(-40));

            // Verificar que hay 2 archivos antes de la purga
            var backupsBefore = backupService.ListBackups().ToList();
            Assert.AreEqual(2, backupsBefore.Count, "Deben existir 2 archivos antes de purgar.");

            // Ejecutar purga de respaldos mayores a 30 días
            await backupService.PurgeOldBackupsAsync(retentionDays: 30);

            // Verificar que solo se conserva el nuevo
            var backupsAfter = backupService.ListBackups().ToList();
            Assert.AreEqual(1, backupsAfter.Count, "Deben quedar 1 archivo de respaldo tras la purga.");
            Assert.AreEqual(newFile, backupsAfter[0].FileName, "El archivo conservado debe ser el nuevo.");
        }
        finally
        {
            if (Directory.Exists(tempDirectory))
            {
                Directory.Delete(tempDirectory, true);
            }
        }
    }
}

