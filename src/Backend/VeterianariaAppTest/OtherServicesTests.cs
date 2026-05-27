using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Application.Services;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;
using Veterinaria.Infrastructure.Repositories;

namespace VeterianariaAppTest
{
    [TestClass]
    public class TriageServiceTests
    {
        private VeterinariaDbContext _context = default!;
        private UnitOfWork _unitOfWork = default!;
        private TriageService _service = default!;

        [TestInitialize]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new VeterinariaDbContext(options);
            _unitOfWork = new UnitOfWork(_context);
            _service = new TriageService(_unitOfWork);
        }

        [TestCleanup]
        public void Cleanup() { _context.Dispose(); }

        [TestMethod]
        public async Task GetColaTriageAsync_DebeRetornarOrdenado()
        {
            var u = new Usuario { Nombre = "Juan", Email = "j@t.com", Rol = "Cliente", Activo = true };
            await _context.Usuarios.AddAsync(u);
            await _context.SaveChangesAsync();

            var m1 = new Mascota { Nombre = "M1", Especie = "P", Activo = true, UsuarioId = u.Id };
            var m2 = new Mascota { Nombre = "M2", Especie = "P", Activo = true, UsuarioId = u.Id };
            await _context.Mascotas.AddRangeAsync(m1, m2);
            await _context.SaveChangesAsync();

            var t1 = new Triage { MascotaId = m1.Id, Nivel = "N3", Estado = "EnEspera", FechaRegistro = DateTime.Now.AddMinutes(-5) };
            var t2 = new Triage { MascotaId = m2.Id, Nivel = "N1", Estado = "EnEspera", FechaRegistro = DateTime.Now };
            await _context.Triages.AddRangeAsync(t1, t2);
            await _context.SaveChangesAsync();

            _context.ChangeTracker.Clear();
            var result = await _service.GetColaTriageAsync();
            Assert.AreEqual(2, result.Count);
            Assert.AreEqual("N1", result[0].Nivel); // N1 va primero
        }

        [TestMethod]
        public async Task TriageCrud_DebeFuncionar()
        {
            var t = new Triage { MascotaId = 1, Nivel = "N2", Estado = "EnEspera" };
            await _service.AddTriageAsync(t);
            Assert.IsTrue(t.Id > 0);

            var dbT = await _service.GetTriageByIdAsync(t.Id);
            Assert.IsNotNull(dbT);

            dbT.Estado = "EnAtencion";
            await _service.UpdateTriageAsync(dbT);

            var updated = await _service.GetTriageByIdAsync(t.Id);
            Assert.AreEqual("EnAtencion", updated!.Estado);
        }

        [TestMethod]
        public async Task GetMascotasActivasConUsuarioAsync_DebeFuncionar()
        {
            var u = new Usuario { Nombre = "U1", Email = "u1@t.com", Rol = "Cliente", Activo = true };
            await _context.Usuarios.AddAsync(u);
            await _context.SaveChangesAsync();

            var m1 = new Mascota { Nombre = "M1", Especie = "P", Activo = true, UsuarioId = u.Id };
            var m2 = new Mascota { Nombre = "M2", Especie = "P", Activo = false, UsuarioId = u.Id };
            await _context.Mascotas.AddRangeAsync(m1, m2);
            await _context.SaveChangesAsync();

            var result = await _service.GetMascotasActivasConUsuarioAsync();
            Assert.AreEqual(1, result.Count);
            Assert.AreEqual("M1", result[0].Nombre);
        }
    }

    [TestClass]
    public class ConsentimientoServiceTests
    {
        private VeterinariaDbContext _context = default!;
        private UnitOfWork _unitOfWork = default!;
        private ConsentimientoService _service = default!;

        [TestInitialize]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new VeterinariaDbContext(options);
            _unitOfWork = new UnitOfWork(_context);
            _service = new ConsentimientoService(_unitOfWork);
        }

        [TestCleanup]
        public void Cleanup() { _context.Dispose(); }

        [TestMethod]
        public async Task ConsentimientoFlow_DebeFuncionar()
        {
            var u = new Usuario { Nombre = "Juan", Email = "juan@t.com", Rol = "Cliente", ApplicationUserId = "app-1" };
            await _context.Usuarios.AddAsync(u);
            await _context.SaveChangesAsync();

            var userByAppId = await _service.GetUsuarioByApplicationUserIdAsync("app-1");
            Assert.IsNotNull(userByAppId);

            var c = new Consentimiento { UsuarioId = u.Id, NombrePropietario = "Juan", FechaCreacion = DateTime.Now };
            await _service.AddConsentimientoAsync(c);

            _context.ChangeTracker.Clear();
            var dbC = await _service.GetConsentimientoByIdAsync(c.Id);
            Assert.IsNotNull(dbC);

            var list = await _service.GetConsentimientosAsync(u.Id);
            Assert.AreEqual(1, list.Count);
        }
    }

    [TestClass]
    public class HistorialClinicoServiceTests
    {
        private VeterinariaDbContext _context = default!;
        private UnitOfWork _unitOfWork = default!;
        private HistorialClinicoService _service = default!;

        [TestInitialize]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new VeterinariaDbContext(options);
            _unitOfWork = new UnitOfWork(_context);
            _service = new HistorialClinicoService(_unitOfWork);
        }

        [TestCleanup]
        public void Cleanup() { _context.Dispose(); }

        [TestMethod]
        public async Task HistorialClinicoFlow_DebeFuncionar()
        {
            var u = new Usuario { Nombre = "Juan", Email = "juan@t.com", Rol = "Cliente", Activo = true };
            await _context.Usuarios.AddAsync(u);
            await _context.SaveChangesAsync();

            var m = new Mascota { Nombre = "M", Especie = "P", Activo = true, UsuarioId = u.Id };
            await _context.Mascotas.AddAsync(m);
            await _context.SaveChangesAsync();

            var v = new Veterinario { Nombre = "V", Email = "v@t.com", Activo = true };
            await _context.Veterinarios.AddAsync(v);

            var s = new Servicio { Nombre = "S", Precio = 50m, DuracionMinutos = 30, Activo = true };
            await _context.Servicios.AddAsync(s);
            await _context.SaveChangesAsync();

            var c = new Cita { MascotaId = m.Id, VeterinarioId = v.Id, ServicioId = s.Id, FechaHora = DateTime.Now, Estado = "Confirmada" };
            await _context.Citas.AddAsync(c);
            await _context.SaveChangesAsync();

            _context.ChangeTracker.Clear();
            var mWithU = await _service.GetMascotaWithUsuarioAsync(m.Id);
            Assert.IsNotNull(mWithU);

            var dbC = await _service.GetCitaForHistorialAsync(c.Id);
            Assert.IsNotNull(dbC);

            var exists = await _service.ExistsHistorialForCitaAsync(c.Id);
            Assert.IsFalse(exists);

            var h = new HistorialClinico { CitaId = c.Id, Diagnostico = "D", Tratamiento = "T" };
            await _service.AddHistorialAsync(h);

            _context.ChangeTracker.Clear();
            var exists2 = await _service.ExistsHistorialForCitaAsync(c.Id);
            Assert.IsTrue(exists2);

            var dbH1 = await _service.GetHistorialByCitaIdAsync(c.Id);
            Assert.IsNotNull(dbH1);

            var dbH2 = await _service.GetHistorialByIdAsync(h.Id);
            Assert.IsNotNull(dbH2);

            h.Diagnostico = "D2";
            await _service.UpdateHistorialAsync(h);

            _context.ChangeTracker.Clear();
            var list = await _service.GetHistorialesByMascotaIdAsync(m.Id);
            Assert.AreEqual(1, list.Count);
            Assert.AreEqual("D2", list[0].Diagnostico);
        }
    }

    [TestClass]
    public class ServicioServiceTests
    {
        private VeterinariaDbContext _context = default!;
        private UnitOfWork _unitOfWork = default!;
        private ServicioService _service = default!;

        [TestInitialize]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new VeterinariaDbContext(options);
            _unitOfWork = new UnitOfWork(_context);
            _service = new ServicioService(_unitOfWork);
        }

        [TestCleanup]
        public void Cleanup() { _context.Dispose(); }

        [TestMethod]
        public async Task ServicioFlow_DebeFuncionar()
        {
            var s1 = new Servicio { Nombre = "S1", Precio = 10, Activo = true };
            var s2 = new Servicio { Nombre = "S2", Precio = 20, Activo = false };
            await _service.AddServicioAsync(s1);
            await _service.AddServicioAsync(s2);

            var activeList = _service.GetServicios(null, false);
            Assert.AreEqual(1, activeList.Count());

            var allList = _service.GetServicios("s", true);
            Assert.AreEqual(2, allList.Count());

            var dbS = await _service.GetServicioByIdAsync(s1.Id);
            Assert.IsNotNull(dbS);

            var exists = await _service.ExistsNombreAsync("S1");
            Assert.IsTrue(exists);

            var exists2 = await _service.ExistsNombreAsync("S1", s1.Id);
            Assert.IsFalse(exists2);

            s1.Nombre = "S1Mod";
            await _service.UpdateServicioAsync(s1);

            var sWithC = await _service.GetServicioWithCitasAsync(s1.Id);
            Assert.IsNotNull(sWithC);

            await _service.ToggleActivoAsync(s1.Id);
            var toggled = await _service.GetServicioByIdAsync(s1.Id);
            Assert.IsFalse(toggled!.Activo);

            await _service.DeleteServicioAsync(s1.Id);
            var deleted = await _service.GetServicioByIdAsync(s1.Id);
            Assert.IsFalse(deleted!.Activo);
        }
    }

    [TestClass]
    public class VeterinarioServiceTests
    {
        private VeterinariaDbContext _context = default!;
        private UnitOfWork _unitOfWork = default!;
        private VeterinarioService _service = default!;

        [TestInitialize]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new VeterinariaDbContext(options);
            _unitOfWork = new UnitOfWork(_context);
            _service = new VeterinarioService(_unitOfWork);
        }

        [TestCleanup]
        public void Cleanup() { _context.Dispose(); }

        [TestMethod]
        public async Task VeterinarioFlow_DebeFuncionar()
        {
            var v1 = new Veterinario { Nombre = "V1", Email = "v1@t.com", Especialidad = "Caninos", Activo = true };
            await _service.AddVeterinarioAsync(v1);

            var list = _service.GetVeterinarios("Caninos", "V1").ToList();
            Assert.AreEqual(1, list.Count);

            var specs = _service.GetEspecialidades().ToList();
            Assert.AreEqual(1, specs.Count);
            Assert.AreEqual("Caninos", specs[0]);

            var dbV = await _service.GetVeterinarioByIdAsync(v1.Id);
            Assert.IsNotNull(dbV);

            v1.Nombre = "V1Mod";
            await _service.UpdateVeterinarioAsync(v1);

            var dbVWithCitas = await _service.GetVeterinarioWithCitasAsync(v1.Id);
            Assert.IsNotNull(dbVWithCitas);
            Assert.AreEqual("V1Mod", dbVWithCitas.Nombre);

            await _service.DeleteVeterinarioAsync(v1.Id);
            var deleted = await _service.GetVeterinarioByIdAsync(v1.Id);
            Assert.IsFalse(deleted!.Activo);
        }
    }

    [TestClass]
    public class ProductoServiceTests
    {
        private VeterinariaDbContext _context = default!;
        private UnitOfWork _unitOfWork = default!;
        private ProductoService _service = default!;

        [TestInitialize]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new VeterinariaDbContext(options);
            _unitOfWork = new UnitOfWork(_context);
            _service = new ProductoService(_unitOfWork);
        }

        [TestCleanup]
        public void Cleanup() { _context.Dispose(); }

        [TestMethod]
        public async Task ProductoFlow_DebeFuncionar()
        {
            var p1 = new Producto { Nombre = "P1", Precio = 5, Stock = 10, StockMinimo = 2, Activo = true };
            await _service.AddProductoAsync(p1);

            var list = await _service.GetActiveProductosQuery().ToListAsync();
            Assert.AreEqual(1, list.Count);

            var dbP = await _service.GetProductoByIdAsync(p1.Id);
            Assert.IsNotNull(dbP);

            p1.Nombre = "P1Mod";
            await _service.UpdateProductoAsync(p1);

            await _service.DeleteProductoAsync(p1.Id);
            var deleted = await _service.GetProductoByIdAsync(p1.Id);
            Assert.IsFalse(deleted!.Activo);
        }

        [TestMethod]
        public async Task GetProductosBajoStockAsync_DebeRetornarBajoStock()
        {
            var p1 = new Producto { Nombre = "P1", Precio = 5, Stock = 1, StockMinimo = 2, Activo = true };
            var p2 = new Producto { Nombre = "P2", Precio = 10, Stock = 5, StockMinimo = 2, Activo = true };
            await _service.AddProductoAsync(p1);
            await _service.AddProductoAsync(p2);

            var lowStock = (await _service.GetProductosBajoStockAsync()).ToList();
            Assert.AreEqual(1, lowStock.Count);
            Assert.AreEqual("P1", lowStock[0].Nombre);
        }
    }

    [TestClass]
    public class VentaServiceTests
    {
        private VeterinariaDbContext _context = default!;
        private UnitOfWork _unitOfWork = default!;
        private VentaService _service = default!;
        private Mock<INotificacionService> _mockNotif = default!;

        [TestInitialize]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new VeterinariaDbContext(options);
            _unitOfWork = new UnitOfWork(_context);
            _mockNotif = new Mock<INotificacionService>();
            _service = new VentaService(_unitOfWork, _mockNotif.Object);
        }

        [TestCleanup]
        public void Cleanup() { _context.Dispose(); }

        [TestMethod]
        public async Task RegistrarVentaAsync_DatosValidos_DeduceStockYRegistra()
        {
            var prod = new Producto { Nombre = "Shampoo", Precio = 15m, Stock = 10, StockMinimo = 2, Activo = true };
            await _context.Productos.AddAsync(prod);
            await _context.SaveChangesAsync();

            var venta = new Venta
            {
                ClienteId = 1,
                Detalles = new List<DetalleVenta>
                {
                    new DetalleVenta { ProductoId = prod.Id, Cantidad = 3 }
                }
            };

            var result = await _service.RegistrarVentaAsync(venta);

            Assert.IsNotNull(result);
            Assert.AreEqual(45m, result.Total);
            Assert.AreEqual("Completada", result.Estado);

            var dbProd = await _context.Productos.FindAsync(prod.Id);
            Assert.AreEqual(7, dbProd!.Stock); // 10 - 3
        }

        [TestMethod]
        public async Task RegistrarVentaAsync_BajoStockMinimo_GeneraNotificacion()
        {
            var admin = new Usuario { Nombre = "Admin", Email = "admin@t.com", Rol = "Admin", Activo = true };
            await _context.Usuarios.AddAsync(admin);

            var prod = new Producto { Nombre = "Collar", Precio = 10m, Stock = 5, StockMinimo = 4, Activo = true };
            await _context.Productos.AddAsync(prod);
            await _context.SaveChangesAsync();

            var venta = new Venta
            {
                Detalles = new List<DetalleVenta>
                {
                    new DetalleVenta { ProductoId = prod.Id, Cantidad = 2 } // Deja stock en 3 (<= 4)
                }
            };

            await _service.RegistrarVentaAsync(venta);

            _mockNotif.Verify(n => n.CrearNotificacionAsync(
                admin.Id,
                "Alerta de Stock Mínimo",
                It.Is<string>(s => s.Contains("Collar")),
                "Warning",
                "inventory",
                "/admin/inventario"
            ), Times.Once);
        }

        [TestMethod]
        public async Task RegistrarVentaAsync_VentaVacia_LanzaExcepcion()
        {
            var venta = new Venta { Detalles = new List<DetalleVenta>() };
            await Assert.ThrowsExactlyAsync<ArgumentException>(() => _service.RegistrarVentaAsync(venta));
        }

        [TestMethod]
        public async Task RegistrarVentaAsync_StockInsuficiente_LanzaExcepcion()
        {
            var prod = new Producto { Nombre = "Prod", Precio = 10m, Stock = 2, Activo = true };
            await _context.Productos.AddAsync(prod);
            await _context.SaveChangesAsync();

            var venta = new Venta
            {
                Detalles = new List<DetalleVenta>
                {
                    new DetalleVenta { ProductoId = prod.Id, Cantidad = 5 }
                }
            };

            await Assert.ThrowsExactlyAsync<InvalidOperationException>(() => _service.RegistrarVentaAsync(venta));
        }

        [TestMethod]
        public async Task CancelarVentaAsync_VentaValida_DevuelveStock()
        {
            var prod = new Producto { Nombre = "P", Precio = 10m, Stock = 5, Activo = true };
            await _context.Productos.AddAsync(prod);
            await _context.SaveChangesAsync();

            var venta = new Venta
            {
                Estado = "Completada",
                Detalles = new List<DetalleVenta>
                {
                    new DetalleVenta { ProductoId = prod.Id, Cantidad = 3 }
                }
            };
            await _context.Ventas.AddAsync(venta);
            await _context.SaveChangesAsync();

            _context.ChangeTracker.Clear();
            var cancelled = await _service.CancelarVentaAsync(venta.Id);
            Assert.IsTrue(cancelled);

            var dbVenta = await _context.Ventas.FindAsync(venta.Id);
            Assert.AreEqual("Cancelada", dbVenta!.Estado);

            var dbProd = await _context.Productos.FindAsync(prod.Id);
            Assert.AreEqual(8, dbProd!.Stock); // 5 + 3
        }

        [TestMethod]
        public async Task CancelarVentaAsync_Inexistente_RetornaFalse()
        {
            var result = await _service.CancelarVentaAsync(999);
            Assert.IsFalse(result);
        }

        [TestMethod]
        public async Task GetVentasQuery_DebeFuncionar()
        {
            var query = _service.GetVentasQuery();
            Assert.IsNotNull(query);
        }
    }

    [TestClass]
    public class ClienteServiceTests
    {
        private VeterinariaDbContext _context = default!;
        private UnitOfWork _unitOfWork = default!;
        private ClienteService _service = default!;
        private Mock<UserManager<ApplicationUser>> _mockUserManager = default!;

        [TestInitialize]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new VeterinariaDbContext(options);
            _unitOfWork = new UnitOfWork(_context);

            var storeMock = new Mock<IUserStore<ApplicationUser>>();
            _mockUserManager = new Mock<UserManager<ApplicationUser>>(storeMock.Object, null, null, null, null, null, null, null, null);

            _service = new ClienteService(_unitOfWork, _mockUserManager.Object);
        }

        [TestCleanup]
        public void Cleanup() { _context.Dispose(); }

        [TestMethod]
        public async Task GetClientesAsync_FiltroNombre_FiltraYDevuelveEstadisticas()
        {
            var u1 = new Usuario { Nombre = "Juan Perez", Email = "juan@t.com", Activo = true, FechaRegistro = DateTime.Now };
            var u2 = new Usuario { Nombre = "Maria Lopez", Email = "maria@t.com", Activo = true, FechaRegistro = DateTime.Now };
            await _context.Usuarios.AddRangeAsync(u1, u2);
            await _context.SaveChangesAsync();

            var mascota = new Mascota { Nombre = "Luna", Especie = "P", UsuarioId = u1.Id, Activo = true };
            await _context.Mascotas.AddAsync(mascota);
            await _context.SaveChangesAsync();

            var cita = new Cita { MascotaId = mascota.Id, FechaHora = DateTime.Now };
            await _context.Citas.AddAsync(cita);
            await _context.SaveChangesAsync();

            var result = await _service.GetClientesAsync("Juan", false);

            Assert.AreEqual(1, result.Usuarios.Count());
            Assert.AreEqual("Juan Perez", result.Usuarios.First().Nombre);
            Assert.IsTrue(result.CitasPorUsuario.ContainsKey(u1.Id));
            Assert.AreEqual(1, result.CitasPorUsuario[u1.Id]);
        }

        [TestMethod]
        public async Task GetClienteDetailsAsync_DevuelveDetalles()
        {
            var u = new Usuario { Nombre = "Juan", Email = "juan@t.com", Activo = true };
            await _context.Usuarios.AddAsync(u);
            await _context.SaveChangesAsync();

            var mascota = new Mascota { Nombre = "Luna", Especie = "P", UsuarioId = u.Id, Activo = true };
            await _context.Mascotas.AddAsync(mascota);
            await _context.SaveChangesAsync();

            var cita = new Cita { MascotaId = mascota.Id, Estado = "Completada", EstadoPago = "Parcial", MontoTotal = 100m, MontoPagado = 40m, FechaHora = DateTime.Now };
            await _context.Citas.AddAsync(cita);
            await _context.SaveChangesAsync();

            var pago = new Pago { CitaId = cita.Id, Monto = 40m, FechaPago = DateTime.Now };
            await _context.Pagos.AddAsync(pago);
            await _context.SaveChangesAsync();

            var details = await _service.GetClienteDetailsAsync(u.Id);

            Assert.IsNotNull(details);
            Assert.AreEqual(u.Id, details.Usuario.Id);
            Assert.AreEqual(1, details.TotalCitas);
            Assert.AreEqual(40m, details.TotalGastado);
            Assert.AreEqual(60m, details.PagosPendientes); // 100 - 40
        }

        [TestMethod]
        public async Task ToggleActivoAsync_CambiaEstado()
        {
            var u = new Usuario { Nombre = "Juan", Email = "juan@t.com", Activo = true };
            await _context.Usuarios.AddAsync(u);
            await _context.SaveChangesAsync();

            var result = await _service.ToggleActivoAsync(u.Id);
            Assert.IsTrue(result);

            var dbU = await _context.Usuarios.FindAsync(u.Id);
            Assert.IsFalse(dbU!.Activo);
        }

        [TestMethod]
        public async Task DeleteCascadeAsync_DesactivaUsuarioYMascotasYCancelaCitas()
        {
            var u = new Usuario { Nombre = "Juan", Email = "juan@t.com", Activo = true, ApplicationUserId = "app-1" };
            await _context.Usuarios.AddAsync(u);
            await _context.SaveChangesAsync();

            var mascota = new Mascota { Nombre = "Luna", Especie = "P", UsuarioId = u.Id, Activo = true };
            await _context.Mascotas.AddAsync(mascota);
            await _context.SaveChangesAsync();

            var cita = new Cita { MascotaId = mascota.Id, Estado = "Confirmada", FechaHora = DateTime.Now.AddDays(1) };
            await _context.Citas.AddAsync(cita);
            await _context.SaveChangesAsync();

            _mockUserManager.Setup(m => m.FindByIdAsync("app-1")).ReturnsAsync(new ApplicationUser());
            _mockUserManager.Setup(m => m.SetLockoutEnabledAsync(It.IsAny<ApplicationUser>(), true)).ReturnsAsync(IdentityResult.Success);
            _mockUserManager.Setup(m => m.SetLockoutEndDateAsync(It.IsAny<ApplicationUser>(), It.IsAny<DateTimeOffset>())).ReturnsAsync(IdentityResult.Success);

            _context.ChangeTracker.Clear();
            var result = await _service.DeleteCascadeAsync(u.Id);

            Assert.IsTrue(result.Success);

            var dbU = await _context.Usuarios.FindAsync(u.Id);
            Assert.IsFalse(dbU!.Activo);

            var dbM = await _context.Mascotas.FindAsync(mascota.Id);
            Assert.IsFalse(dbM!.Activo);

            var dbCita = await _context.Citas.FindAsync(cita.Id);
            Assert.AreEqual("Cancelada", dbCita!.Estado);
        }
    }

    [TestClass]
    public class NotificacionServiceTests
    {
        private VeterinariaDbContext _context = default!;
        private UnitOfWork _unitOfWork = default!;
        private NotificacionService _service = default!;
        private Mock<IRealTimeNotificationService> _mockRealTime = default!;

        [TestInitialize]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new VeterinariaDbContext(options);
            _unitOfWork = new UnitOfWork(_context);
            _mockRealTime = new Mock<IRealTimeNotificationService>();
            _service = new NotificacionService(_unitOfWork, _mockRealTime.Object);
        }

        [TestCleanup]
        public void Cleanup() { _context.Dispose(); }

        [TestMethod]
        public async Task CrearNotificacionAsync_DatosValidos_GuardaYEnviaEnTiempoReal()
        {
            var u = new Usuario { Nombre = "Juan", Email = "j@t.com", ApplicationUserId = "app-1", Activo = true };
            await _context.Usuarios.AddAsync(u);
            await _context.SaveChangesAsync();

            var notif = await _service.CrearNotificacionAsync(u.Id, "Tit", "Msg", "Info", "icon", "/url");

            Assert.IsNotNull(notif);
            Assert.IsTrue(notif.Id > 0);
            Assert.AreEqual("Tit", notif.Titulo);

            _mockRealTime.Verify(r => r.SendNotificationAsync("app-1", It.IsAny<object>()), Times.Once);
        }

        [TestMethod]
        public async Task NotificacionesMangement_DebeFuncionar()
        {
            var u = new Usuario { Nombre = "Juan", Email = "j@t.com", Activo = true };
            await _context.Usuarios.AddAsync(u);
            await _context.SaveChangesAsync();

            var n1 = new Notificacion { UsuarioId = u.Id, Titulo = "T1", Leida = false, FechaCreacion = DateTime.Now };
            var n2 = new Notificacion { UsuarioId = u.Id, Titulo = "T2", Leida = false, FechaCreacion = DateTime.Now };
            await _context.Notificaciones.AddRangeAsync(n1, n2);
            await _context.SaveChangesAsync();

            var count = await _service.ContarNoLeidasAsync(u.Id);
            Assert.AreEqual(2, count);

            _context.ChangeTracker.Clear();
            await _service.MarcarComoLeidaAsync(n1.Id);
            var countAfter = await _service.ContarNoLeidasAsync(u.Id);
            Assert.AreEqual(1, countAfter);

            _context.ChangeTracker.Clear();
            await _service.MarcarTodasComoLeidasAsync(u.Id);
            var countAll = await _service.ContarNoLeidasAsync(u.Id);
            Assert.AreEqual(0, countAll);

            _context.ChangeTracker.Clear();
            await _service.EliminarNotificacionAsync(n2.Id);
            var list = await _service.ObtenerNotificacionesUsuarioAsync(u.Id);
            Assert.AreEqual(1, list.Count);
        }

        [TestMethod]
        public async Task BusinessNotifications_DebeFuncionar()
        {
            var u = new Usuario { Nombre = "Juan", Email = "juan@t.com", Activo = true };
            await _context.Usuarios.AddAsync(u);
            await _context.SaveChangesAsync();

            var m = new Mascota { Nombre = "Luna", Especie = "P", UsuarioId = u.Id, Activo = true };
            await _context.Mascotas.AddAsync(m);
            await _context.SaveChangesAsync();

            var cita = new Cita { MascotaId = m.Id, FechaHora = DateTime.Now, EstadoPago = "Parcial", MontoTotal = 100m, MontoPagado = 40m };
            await _context.Citas.AddAsync(cita);
            await _context.SaveChangesAsync();

            await _service.NotificarCitaConfirmadaAsync(cita);
            await _service.NotificarCitaEnProcesoAsync(cita);
            await _service.NotificarCitaCompletadaAsync(cita);
            await _service.NotificarCitaCanceladaAsync(cita);
            await _service.NotificarRecordatorioCitaAsync(cita);
            await _service.NotificarPagoRecibidoAsync(cita, 40m);

            var count = await _service.ContarNoLeidasAsync(u.Id);
            Assert.AreEqual(6, count);
        }

        [TestMethod]
        public async Task NotificarNuevaCitaSolicitadaAsync_NotificaAdminYRecepcionista()
        {
            var admin = new Usuario { Nombre = "Admin", Email = "a@t.com", Rol = "Admin", Activo = true };
            var recep = new Usuario { Nombre = "Recep", Email = "r@t.com", Rol = "Recepcionista", Activo = true };
            var client = new Usuario { Nombre = "Client", Email = "c@t.com", Rol = "Cliente", Activo = true };
            await _context.Usuarios.AddRangeAsync(admin, recep, client);
            await _context.SaveChangesAsync();

            var m = new Mascota { Nombre = "Luna", Especie = "P", UsuarioId = client.Id, Activo = true };
            await _context.Mascotas.AddAsync(m);
            await _context.SaveChangesAsync();

            var cita = new Cita { MascotaId = m.Id, FechaHora = DateTime.Now };
            await _context.Citas.AddAsync(cita);
            await _context.SaveChangesAsync();

            await _service.NotificarNuevaCitaSolicitadaAsync(cita);

            var adminCount = await _service.ContarNoLeidasAsync(admin.Id);
            var recepCount = await _service.ContarNoLeidasAsync(recep.Id);

            Assert.AreEqual(1, adminCount);
            Assert.AreEqual(1, recepCount);
        }
    }

    [TestClass]
    public class CitaServiceTests
    {
        private VeterinariaDbContext _context = default!;
        private UnitOfWork _unitOfWork = default!;
        private CitaService _service = default!;
        private Mock<IAuditoriaService> _mockAudit = default!;

        [TestInitialize]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new VeterinariaDbContext(options);
            _unitOfWork = new UnitOfWork(_context);
            _mockAudit = new Mock<IAuditoriaService>();
            _service = new CitaService(_unitOfWork, _mockAudit.Object);
        }

        [TestCleanup]
        public void Cleanup() { _context.Dispose(); }

        private async Task<(Usuario Cliente, Mascota Mascota, Veterinario Veterinario, Servicio Servicio)> SeedBaseGraphAsync()
        {
            var u = new Usuario { Nombre = "Juan", Email = "j@t.com", Rol = "Cliente", Activo = true };
            await _context.Usuarios.AddAsync(u);

            var v = new Veterinario 
            { 
                Nombre = "Dr. Carlos", 
                Email = "carlos@vet.com", 
                HorarioInicio = new TimeSpan(8, 0, 0), 
                HorarioFin = new TimeSpan(17, 0, 0), 
                Activo = true 
            };
            await _context.Veterinarios.AddAsync(v);

            var s = new Servicio { Nombre = "Consulta", Precio = 50m, DuracionMinutos = 30, Activo = true };
            await _context.Servicios.AddAsync(s);
            await _context.SaveChangesAsync();

            var m = new Mascota { Nombre = "Luna", Especie = "P", UsuarioId = u.Id, Activo = true };
            await _context.Mascotas.AddAsync(m);
            await _context.SaveChangesAsync();

            return (u, m, v, s);
        }

        [TestMethod]
        public async Task GetCitasParaCalendarioAsync_DebeFiltrarPorRango()
        {
            var graph = await SeedBaseGraphAsync();
            var c1 = new Cita { VeterinarioId = graph.Veterinario.Id, ServicioId = graph.Servicio.Id, MascotaId = graph.Mascota.Id, FechaHora = DateTime.Today.AddHours(9), Estado = "Confirmada" };
            var c2 = new Cita { VeterinarioId = graph.Veterinario.Id, ServicioId = graph.Servicio.Id, MascotaId = graph.Mascota.Id, FechaHora = DateTime.Today.AddMonths(4), Estado = "Confirmada" };
            await _context.Citas.AddRangeAsync(c1, c2);
            await _context.SaveChangesAsync();

            _context.ChangeTracker.Clear();
            var result = await _service.GetCitasParaCalendarioAsync(DateTime.Today, DateTime.Today.AddDays(5));
            Assert.AreEqual(1, result.Count);
        }

        [TestMethod]
        public async Task GetCitasQuery_FiltradosAdecuados()
        {
            var graph = await SeedBaseGraphAsync();
            var c1 = new Cita { VeterinarioId = graph.Veterinario.Id, ServicioId = graph.Servicio.Id, MascotaId = graph.Mascota.Id, FechaHora = DateTime.Today.AddHours(9), Estado = "Confirmada" };
            var c2 = new Cita { VeterinarioId = graph.Veterinario.Id, ServicioId = graph.Servicio.Id, MascotaId = graph.Mascota.Id, FechaHora = DateTime.Today.AddHours(11), Estado = "Pendiente" };
            await _context.Citas.AddRangeAsync(c1, c2);
            await _context.SaveChangesAsync();

            _context.ChangeTracker.Clear();
            var queryAdmin = _service.GetCitasQuery(true, null, "Confirmada", null, null, null);
            Assert.AreEqual(1, queryAdmin.Count());

            var queryClient = _service.GetCitasQuery(false, graph.Cliente.Id, null, null, null, null);
            Assert.AreEqual(2, queryClient.Count());
        }

        [TestMethod]
        public async Task GetCitaDetailsAsync_SeguridadCorrecta()
        {
            var graph = await SeedBaseGraphAsync();
            var u2 = new Usuario { Nombre = "U2", Email = "u2@t.com", Activo = true };
            await _context.Usuarios.AddAsync(u2);
            await _context.SaveChangesAsync();

            var cita = new Cita { VeterinarioId = graph.Veterinario.Id, ServicioId = graph.Servicio.Id, MascotaId = graph.Mascota.Id, FechaHora = DateTime.Today.AddHours(9), Estado = "Confirmada" };
            await _context.Citas.AddAsync(cita);
            await _context.SaveChangesAsync();

            _context.ChangeTracker.Clear();
            var detailsForAdmin = await _service.GetCitaDetailsAsync(cita.Id, true, null);
            Assert.IsNotNull(detailsForAdmin);

            var detailsForOwner = await _service.GetCitaDetailsAsync(cita.Id, false, graph.Cliente.Id);
            Assert.IsNotNull(detailsForOwner);

            var detailsForOther = await _service.GetCitaDetailsAsync(cita.Id, false, u2.Id);
            Assert.IsNull(detailsForOther); // Prohibido
        }

        [TestMethod]
        public async Task VeterinarioDisponibleAsync_Y_ObtenerHorariosDisponiblesAsync_DebeFuncionar()
        {
            var graph = await SeedBaseGraphAsync();
            var v = graph.Veterinario;
            v.HorarioInicio = new TimeSpan(8, 0, 0);
            v.HorarioFin = new TimeSpan(12, 0, 0);
            _context.Veterinarios.Update(v);
            await _context.SaveChangesAsync();

            _context.ChangeTracker.Clear();
            var slots = await _service.ObtenerHorariosDisponiblesAsync(v.Id, DateTime.Today.AddDays(1));
            Assert.IsTrue(slots.Count > 0);

            var disponible = await _service.VeterinarioDisponibleAsync(v.Id, DateTime.Today.AddDays(1).AddHours(9), 30);
            Assert.IsTrue(disponible);

            // Registrar cita a las 9 am
            var cita = new Cita { VeterinarioId = v.Id, ServicioId = graph.Servicio.Id, MascotaId = graph.Mascota.Id, FechaHora = DateTime.Today.AddDays(1).AddHours(9), Estado = "Confirmada" };
            await _context.Citas.AddAsync(cita);
            await _context.SaveChangesAsync();

            _context.ChangeTracker.Clear();
            var disponibleDespues = await _service.VeterinarioDisponibleAsync(v.Id, DateTime.Today.AddDays(1).AddHours(9), 30);
            Assert.IsFalse(disponibleDespues); // Ocupado
        }

        [TestMethod]
        public async Task MascotaTienePagosPendientesAsync_DebeRetornarCorrecto()
        {
            var graph = await SeedBaseGraphAsync();
            var m = graph.Mascota;

            var debt1 = await _service.MascotaTienePagosPendientesAsync(m.Id);
            Assert.IsFalse(debt1);

            var cita = new Cita { VeterinarioId = graph.Veterinario.Id, ServicioId = graph.Servicio.Id, MascotaId = m.Id, Estado = "Completada", EstadoPago = "Parcial", MontoTotal = 100m, MontoPagado = 50m, FechaHora = DateTime.Now };
            await _context.Citas.AddAsync(cita);
            await _context.SaveChangesAsync();

            _context.ChangeTracker.Clear();
            var debt2 = await _service.MascotaTienePagosPendientesAsync(m.Id);
            Assert.IsTrue(debt2);
        }

        [TestMethod]
        public async Task ValidarFechaCitaAsync_DebeFiltrarDomigosYPasado()
        {
            var graph = await SeedBaseGraphAsync();
            var v = graph.Veterinario;

            var pas = await _service.ValidarFechaCitaAsync(v.Id, DateTime.Now.AddDays(-1));
            Assert.IsFalse(pas.EsValida);

            var dom = DateTime.Today.AddDays(1);
            while (dom.DayOfWeek != DayOfWeek.Sunday) dom = dom.AddDays(1);

            var domResult = await _service.ValidarFechaCitaAsync(v.Id, dom.AddHours(9));
            Assert.IsFalse(domResult.EsValida);
        }

        [TestMethod]
        public async Task CreateCitaAsync_DatosValidos_CreaSolicitada()
        {
            var graph = await SeedBaseGraphAsync();
            var cita = new Cita
            {
                VeterinarioId = graph.Veterinario.Id,
                ServicioId = graph.Servicio.Id,
                MascotaId = graph.Mascota.Id,
                FechaHora = DateTime.Today.AddDays(1).AddHours(10)
            };

            _context.ChangeTracker.Clear();
            var result = await _service.CreateCitaAsync(cita, 50m);

            Assert.IsNotNull(result);
            Assert.AreEqual("Solicitada", result.Estado);
            Assert.AreEqual("Pendiente", result.EstadoPago);
        }

        [TestMethod]
        public async Task EditCitaAsync_CambioEstadoYReprogramacion()
        {
            var graph = await SeedBaseGraphAsync();
            var cita = new Cita { VeterinarioId = graph.Veterinario.Id, MascotaId = graph.Mascota.Id, ServicioId = graph.Servicio.Id, FechaHora = DateTime.Today.AddDays(1).AddHours(10), Estado = "Pendiente" };
            await _context.Citas.AddAsync(cita);
            await _context.SaveChangesAsync();

            // 1. Modificación de estado simple
            _context.ChangeTracker.Clear();
            var edit1 = await _service.EditCitaAsync(cita.Id, "Confirmada", "Ok");
            Assert.IsTrue(edit1.Success);
            Assert.AreEqual("Confirmada", edit1.Cita!.Estado);
            _mockAudit.Verify(a => a.RegistrarAccionAsync("Modificar Cita", "Cita", cita.Id.ToString(), It.IsAny<string>()), Times.Once);

            // 2. Reprogramación de fecha
            _context.ChangeTracker.Clear();
            var edit2 = await _service.EditCitaAsync(cita.Id, "Confirmada", "Cambio", DateTime.Today.AddDays(1).AddHours(11));
            Assert.IsTrue(edit2.Success);
            Assert.AreEqual(DateTime.Today.AddDays(1).AddHours(11), edit2.Cita!.FechaHora);
            _mockAudit.Verify(a => a.RegistrarAccionAsync("Reprogramar Cita", "Cita", cita.Id.ToString(), It.IsAny<string>()), Times.Once);
        }

        [TestMethod]
        public async Task CancelarCitaAsync_PermisosYHorarios()
        {
            var graph = await SeedBaseGraphAsync();
            var u = graph.Cliente;
            var m = graph.Mascota;

            var cita1 = new Cita { VeterinarioId = graph.Veterinario.Id, ServicioId = graph.Servicio.Id, MascotaId = m.Id, FechaHora = DateTime.Now.AddMinutes(30), Estado = "Confirmada" }; // Menos de 2 horas
            var cita2 = new Cita { VeterinarioId = graph.Veterinario.Id, ServicioId = graph.Servicio.Id, MascotaId = m.Id, FechaHora = DateTime.Now.AddDays(1), Estado = "Confirmada" }; // Más de 2 horas
            await _context.Citas.AddRangeAsync(cita1, cita2);
            await _context.SaveChangesAsync();

            // Cliente cancela con menos de 2 horas (Falla)
            _context.ChangeTracker.Clear();
            var cancelClientFail = await _service.CancelarCitaAsync(cita1.Id, false, u.Id);
            Assert.IsFalse(cancelClientFail.Success);

            // Admin cancela con menos de 2 horas (Exitoso)
            _context.ChangeTracker.Clear();
            var cancelAdmin = await _service.CancelarCitaAsync(cita1.Id, true, null);
            Assert.IsTrue(cancelAdmin.Success);
            Assert.AreEqual("Cancelada", cancelAdmin.Cita!.Estado);

            // Cliente cancela a tiempo (Exitoso)
            _context.ChangeTracker.Clear();
            var cancelClientOk = await _service.CancelarCitaAsync(cita2.Id, false, u.Id);
            Assert.IsTrue(cancelClientOk.Success);
        }

        [TestMethod]
        public async Task CompletarCitaAsync_Y_CambiarEstadoAsync_TransicionesValidas()
        {
            var graph = await SeedBaseGraphAsync();
            var cita = new Cita { VeterinarioId = graph.Veterinario.Id, ServicioId = graph.Servicio.Id, MascotaId = graph.Mascota.Id, Estado = "Confirmada", FechaHora = DateTime.Now };
            await _context.Citas.AddAsync(cita);
            await _context.SaveChangesAsync();

            // Transición no válida (Confirmada -> Completada directamente)
            _context.ChangeTracker.Clear();
            var fail = await _service.CambiarEstadoAsync(cita.Id, "Completada");
            Assert.IsFalse(fail.Success);

            // Transición válida (Confirmada -> EnEspera)
            _context.ChangeTracker.Clear();
            var ok1 = await _service.CambiarEstadoAsync(cita.Id, "EnEspera");
            Assert.IsTrue(ok1.Success);

            // Completar cita
            _context.ChangeTracker.Clear();
            var comp = await _service.CompletarCitaAsync(cita.Id);
            Assert.IsTrue(comp.Success);
            Assert.AreEqual("Completada", comp.Cita!.Estado);
        }
    }
}
