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
public class ClienteServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private Mock<UserManager<ApplicationUser>> _userManagerMock = null!;
    private Mock<IAuditoriaService> _auditoriaServiceMock = null!;
    private ClienteService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Cliente_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        
        _auditoriaServiceMock = new Mock<IAuditoriaService>();

        _sut = new ClienteService(_unitOfWork, _userManagerMock.Object, _auditoriaServiceMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task GetClientesAsync_DebeRetornarCorrectosYFiltrados()
    {
        // Arrange
        var c1 = new Usuario { Id = 1, Nombre = "Juan Perez", Rol = "Cliente", Activo = true, Email = "juan@test.com", DNI = "11111", Telefono = "999" };
        var c2 = new Usuario { Id = 2, Nombre = "Maria Lopez", Rol = "Cliente", Activo = false, Email = "maria@test.com", DNI = "22222", Telefono = "888" };
        var admin = new Usuario { Id = 3, Nombre = "Admin", Rol = "Administrador", Activo = true, Email = "admin@test.com" };

        await _context.Usuarios.AddRangeAsync(c1, c2, admin);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act & Assert 1: Solo activos
        var (list1, stats1) = await _sut.GetClientesAsync(buscar: "", mostrarInactivos: false);
        Assert.AreEqual(1, list1.Count());
        Assert.AreEqual("Juan Perez", list1.First().Nombre);

        // Act & Assert 2: Mostrar inactivos también
        var (list2, stats2) = await _sut.GetClientesAsync(buscar: "", mostrarInactivos: true);
        Assert.AreEqual(2, list2.Count());

        // Act & Assert 3: Buscar por nombre
        var (list3, stats3) = await _sut.GetClientesAsync(buscar: "maria", mostrarInactivos: true);
        Assert.AreEqual(1, list3.Count());
        Assert.AreEqual("Maria Lopez", list3.First().Nombre);
    }

    [TestMethod]
    public async Task GetClienteDetailsAsync_DebeCalcularTotalesYPendientes()
    {
        // Arrange
        var client = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente", Email = "juan@test.com" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1 };
        
        var servicio = new Servicio { Id = 1, Nombre = "Consulta", Activo = true };
        var vet = new Veterinario { Id = 1, Nombre = "Vet", Activo = true };

        var cita1 = new Cita { Id = 1, MascotaId = 1, ServicioId = 1, VeterinarioId = 1, Estado = "Completada", EstadoPago = "Pendiente", MontoTotal = 100m, MontoPagado = 0m };
        var cita2 = new Cita { Id = 2, MascotaId = 1, ServicioId = 1, VeterinarioId = 1, Estado = "Cancelada", EstadoPago = "Pendiente", MontoTotal = 50m, MontoPagado = 0m };

        var pago = new Pago { Id = 1, CitaId = 1, Monto = 40m, MetodoPago = "Efectivo" };

        await _context.Usuarios.AddAsync(client);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddRangeAsync(cita1, cita2);
        await _context.Pagos.AddAsync(pago);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetClienteDetailsAsync(1);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(2, result!.TotalCitas);
        Assert.AreEqual(1, result.CitasCompletadas);
        Assert.AreEqual(1, result.CitasCanceladas);
        Assert.AreEqual(40m, result.TotalGastado);
        Assert.AreEqual(100m, result.PagosPendientes); // MontoTotal - MontoPagado para cita1 completada
    }

    [TestMethod]
    public async Task ToggleActivoAsync_DebeCambiarEstadoYBloquearEnIdentity()
    {
        // Arrange
        var user = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente", Activo = true, ApplicationUserId = "app-user-1", Email = "j@t.com" };
        var appUser = new ApplicationUser { Id = "app-user-1", UserName = "j@t.com" };
        
        await _context.Usuarios.AddAsync(user);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(m => m.FindByIdAsync("app-user-1")).ReturnsAsync(appUser);
        _userManagerMock.Setup(m => m.SetLockoutEnabledAsync(appUser, true)).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(m => m.SetLockoutEndDateAsync(appUser, It.IsAny<DateTimeOffset?>())).ReturnsAsync(IdentityResult.Success);

        // Act
        var ok = await _sut.ToggleActivoAsync(1);

        // Assert
        Assert.IsTrue(ok);
        var inDb = await _context.Usuarios.FindAsync(1);
        Assert.IsFalse(inDb!.Activo);
        _userManagerMock.Verify(m => m.SetLockoutEndDateAsync(appUser, DateTimeOffset.MaxValue), Times.Once);
    }

    [TestMethod]
    public async Task DeleteCascadeAsync_DebeInactivarMascotasyCitas()
    {
        // Arrange
        var user = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente", Activo = true, ApplicationUserId = "app-user-1", Email = "j@t.com" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 1, Activo = true };
        
        var servicio = new Servicio { Id = 1, Activo = true };
        var vet = new Veterinario { Id = 1, Activo = true };
        var cita = new Cita { Id = 1, MascotaId = 1, VeterinarioId = 1, ServicioId = 1, Estado = "Confirmada" };

        var appUser = new ApplicationUser { Id = "app-user-1" };

        await _context.Usuarios.AddAsync(user);
        await _context.Mascotas.AddAsync(mascota);
        await _context.Servicios.AddAsync(servicio);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(m => m.FindByIdAsync("app-user-1")).ReturnsAsync(appUser);

        // Act
        var (success, msg) = await _sut.DeleteCascadeAsync(1);

        // Assert
        Assert.IsTrue(success);
        var dbUser = await _context.Usuarios.FindAsync(1);
        var dbMascota = await _context.Mascotas.FindAsync(1);
        var dbCita = await _context.Citas.FindAsync(1);

        Assert.IsFalse(dbUser!.Activo);
        Assert.IsFalse(dbMascota!.Activo);
        Assert.AreEqual("Cancelada", dbCita!.Estado);
    }

    [TestMethod]
    public async Task RegistrarClienteAsync_CuandoDniDuplicado_DebeRetornarError()
    {
        // Arrange
        var existente = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente", Email = "juan@test.com", DNI = "12345" };
        await _context.Usuarios.AddAsync(existente);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new CrearClienteDto { Nombre = "Pedro", Email = "pedro@test.com", DNI = "12345" };

        // Act
        var result = await _sut.RegistrarClienteAsync(dto);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.IsTrue(result.Message.Contains("documento de identidad"));
    }

    [TestMethod]
    public async Task RegistrarClienteAsync_CuandoExitoso_DebeCrearEnIdentityYBaseDatos()
    {
        // Arrange
        var dto = new CrearClienteDto { Nombre = "Pedro", Email = "pedro@test.com", DNI = "54321", Telefono = "999888" };
        
        _userManagerMock.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _sut.RegistrarClienteAsync(dto);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.IsNotNull(result.Cliente);
        Assert.AreEqual("Pedro", result.Cliente.Nombre);
        var inDb = await _context.Usuarios.FirstOrDefaultAsync(u => u.DNI == "54321");
        Assert.IsNotNull(inDb);
    }

    [TestMethod]
    public async Task GetClienteByIdAsync_DebeRetornarClienteConMascotas()
    {
        // Arrange
        var cliente = new Usuario { Id = 10, Nombre = "Juan", Rol = "Cliente", Activo = true };
        var mascota = new Mascota { Id = 5, Nombre = "Fido", UsuarioId = 10 };
        await _context.Usuarios.AddAsync(cliente);
        await _context.Mascotas.AddAsync(mascota);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetClienteByIdAsync(10);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("Juan", result.Nombre);
        Assert.AreEqual(1, result.Mascotas.Count);
        Assert.AreEqual("Fido", result.Mascotas.First().Nombre);
    }

    [TestMethod]
    public async Task GetClientesPaginadosAsync_DebeRetornarPaginaYTotal()
    {
        // Arrange
        var c1 = new Usuario { Id = 10, Nombre = "Alex", Rol = "Cliente", Activo = true, FechaRegistro = DateTime.Today.AddDays(-1) };
        var c2 = new Usuario { Id = 11, Nombre = "Bella", Rol = "Cliente", Activo = false, FechaRegistro = DateTime.Today };
        await _context.Usuarios.AddRangeAsync(c1, c2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act & Assert 1: Only active
        var (list1, total1) = await _sut.GetClientesPaginadosAsync(buscar: "", mostrarInactivos: false, pagina: 1, tamanoPagina: 10);
        Assert.AreEqual(1, total1);
        Assert.AreEqual("Alex", list1.First().Nombre);

        // Act & Assert 2: Include inactive, sorted desc by FechaRegistro
        var (list2, total2) = await _sut.GetClientesPaginadosAsync(buscar: "", mostrarInactivos: true, pagina: 1, tamanoPagina: 10);
        Assert.AreEqual(2, total2);
        Assert.AreEqual("Bella", list2.First().Nombre);

        // Act & Assert 3: Search filter
        var (list3, total3) = await _sut.GetClientesPaginadosAsync(buscar: "bella", mostrarInactivos: true, pagina: 1, tamanoPagina: 10);
        Assert.AreEqual(1, total3);
        Assert.AreEqual("Bella", list3.First().Nombre);
    }

    [TestMethod]
    public async Task DetectarDuplicadosAsync_DebeDetectarDuplicados()
    {
        // Arrange
        var c1 = new Usuario { Id = 10, Nombre = "Cliente 1", Rol = "Cliente", DNI = "123", Email = "c1@test.com", Telefono = "999" };
        await _context.Usuarios.AddAsync(c1);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var dupDni = await _sut.DetectarDuplicadosAsync(dni: "123", email: null, telefono: null);
        var dupEmail = await _sut.DetectarDuplicadosAsync(dni: null, email: "c1@test.com", telefono: null);
        var dupTel = await _sut.DetectarDuplicadosAsync(dni: null, email: null, telefono: "999");
        var dupExcluir = await _sut.DetectarDuplicadosAsync(dni: "123", email: null, telefono: null, excluirId: 10);

        // Assert
        Assert.AreEqual(1, dupDni.Count);
        Assert.AreEqual("DNI", dupDni[0].Tipo);
        Assert.AreEqual(1, dupEmail.Count);
        Assert.AreEqual("Email", dupEmail[0].Tipo);
        Assert.AreEqual(1, dupTel.Count);
        Assert.AreEqual("Telefono", dupTel[0].Tipo);
        Assert.AreEqual(0, dupExcluir.Count);
    }

    [TestMethod]
    public async Task EditarClienteAsync_CuandoClienteNoExiste_DebeRetornarError()
    {
        // Arrange
        var dto = new EditarClienteDto { Nombre = "Nuevo" };

        // Act
        var result = await _sut.EditarClienteAsync(999, dto);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Cliente no encontrado.", result.Message);
    }

    [TestMethod]
    public async Task EditarClienteAsync_CuandoEmailDuplicado_DebeRetornarError()
    {
        // Arrange
        var c1 = new Usuario { Id = 10, Nombre = "C1", Rol = "Cliente", Email = "c1@test.com" };
        var c2 = new Usuario { Id = 11, Nombre = "C2", Rol = "Cliente", Email = "c2@test.com" };
        await _context.Usuarios.AddRangeAsync(c1, c2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new EditarClienteDto { Nombre = "C2 Modificado", Email = "c1@test.com" };

        // Act
        var result = await _sut.EditarClienteAsync(11, dto);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.IsTrue(result.Message.Contains("ya está registrado por C1"));
    }

    [TestMethod]
    public async Task EditarClienteAsync_CuandoDniDuplicado_DebeRetornarError()
    {
        // Arrange
        var c1 = new Usuario { Id = 10, Nombre = "C1", Rol = "Cliente", DNI = "111", Email = "c1@test.com" };
        var c2 = new Usuario { Id = 11, Nombre = "C2", Rol = "Cliente", DNI = "222", Email = "c2@test.com" };
        await _context.Usuarios.AddRangeAsync(c1, c2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new EditarClienteDto { Nombre = "C2 Modificado", DNI = "111", Email = "c2@test.com" };

        // Act
        var result = await _sut.EditarClienteAsync(11, dto);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.IsTrue(result.Message.Contains("ya está registrado por C1"));
    }

    [TestMethod]
    public async Task EditarClienteAsync_CuandoTelefonoDuplicadoSinIgnorar_DebeRetornarError()
    {
        // Arrange
        var c1 = new Usuario { Id = 10, Nombre = "C1", Rol = "Cliente", Telefono = "999", Email = "c1@test.com" };
        var c2 = new Usuario { Id = 11, Nombre = "C2", Rol = "Cliente", Telefono = "888", Email = "c2@test.com" };
        await _context.Usuarios.AddRangeAsync(c1, c2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new EditarClienteDto { Nombre = "C2 Modificado", Telefono = "999", Email = "c2@test.com", IgnorarDuplicados = false };

        // Act
        var result = await _sut.EditarClienteAsync(11, dto);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Se detectaron posibles clientes duplicados en el sistema.", result.Message);
    }

    [TestMethod]
    public async Task EditarClienteAsync_CuandoExitoso_DebeEditarYAuditar()
    {
        // Arrange
        var cliente = new Usuario { Id = 10, Nombre = "C1", Rol = "Cliente", DNI = "111", Email = "c1@test.com", ApplicationUserId = "app-user-1" };
        var appUser = new ApplicationUser { Id = "app-user-1", Email = "c1@test.com" };
        await _context.Usuarios.AddAsync(cliente);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(m => m.FindByIdAsync("app-user-1")).ReturnsAsync(appUser);
        _userManagerMock.Setup(m => m.UpdateAsync(appUser)).ReturnsAsync(IdentityResult.Success);

        var dto = new EditarClienteDto { Nombre = "C1 Editado", DNI = "111", Email = "c1_nuevo@test.com", Telefono = "777", IgnorarDuplicados = true };

        // Act
        var result = await _sut.EditarClienteAsync(10, dto);

        // Assert
        Assert.IsTrue(result.Success);
        var inDb = await _context.Usuarios.FindAsync(10);
        Assert.AreEqual("C1 Editado", inDb!.Nombre);
        Assert.AreEqual("c1_nuevo@test.com", inDb.Email);
        Assert.AreEqual("777", inDb.Telefono);
        _auditoriaServiceMock.Verify(a => a.RegistrarAccionAsync("Editar", "Cliente", "10", It.IsAny<string>()), Times.Once);
    }

    [TestMethod]
    public async Task EditarClienteAsync_CuandoRemueveEmail_DebeGenerarPlaceholderYBloquear()
    {
        // Arrange
        var cliente = new Usuario { Id = 10, Nombre = "C1", Rol = "Cliente", DNI = "111", Email = "c1@test.com", ApplicationUserId = "app-user-1" };
        var appUser = new ApplicationUser { Id = "app-user-1", Email = "c1@test.com" };
        await _context.Usuarios.AddAsync(cliente);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(m => m.FindByIdAsync("app-user-1")).ReturnsAsync(appUser);
        _userManagerMock.Setup(m => m.SetLockoutEnabledAsync(appUser, true)).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(m => m.SetLockoutEndDateAsync(appUser, DateTimeOffset.MaxValue)).ReturnsAsync(IdentityResult.Success);

        var dto = new EditarClienteDto { Nombre = "C1 Editado", DNI = "111", Email = "", Telefono = "777" };

        // Act
        var result = await _sut.EditarClienteAsync(10, dto);

        // Assert
        Assert.IsTrue(result.Success);
        var inDb = await _context.Usuarios.FindAsync(10);
        Assert.IsTrue(inDb!.Email.StartsWith("sin_correo_"));
        _userManagerMock.Verify(m => m.SetLockoutEndDateAsync(appUser, DateTimeOffset.MaxValue), Times.Once);
    }

    [TestMethod]
    public async Task GetClienteDetailsAsync_CuandoNoExiste_DebeRetornarNull()
    {
        var result = await _sut.GetClienteDetailsAsync(999);
        Assert.IsNull(result);
    }

    [TestMethod]
    public async Task ToggleActivoAsync_CuandoNoExiste_DebeRetornarFalse()
    {
        var result = await _sut.ToggleActivoAsync(999);
        Assert.IsFalse(result);
    }

    [TestMethod]
    public async Task DeleteCascadeAsync_CuandoNoExiste_DebeRetornarError()
    {
        var (success, msg) = await _sut.DeleteCascadeAsync(999);
        Assert.IsFalse(success);
        Assert.AreEqual("Cliente no encontrado.", msg);
    }

    [TestMethod]
    public async Task DeleteCascadeAsync_CuandoExcepcion_DebeRetornarError()
    {
        // Arrange
        var user = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente", Activo = true, ApplicationUserId = "app-user-1" };
        await _context.Usuarios.AddAsync(user);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Cause UserManager to throw an exception to hit the catch block
        _userManagerMock.Setup(m => m.FindByIdAsync("app-user-1")).ThrowsAsync(new Exception("Mock identity exception"));

        // Act
        var (success, msg) = await _sut.DeleteCascadeAsync(1);

        // Assert
        Assert.IsFalse(success);
        Assert.IsTrue(msg.Contains("Error al desactivar el cliente"));
    }

    [TestMethod]
    public async Task RegistrarClienteAsync_CuandoEmailDuplicado_DebeRetornarError()
    {
        // Arrange
        var existente = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente", Email = "juan@test.com" };
        await _context.Usuarios.AddAsync(existente);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new CrearClienteDto { Nombre = "Pedro", Email = "juan@test.com" };

        // Act
        var result = await _sut.RegistrarClienteAsync(dto);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.IsTrue(result.Message.Contains("El correo electrónico"));
    }

    [TestMethod]
    public async Task RegistrarClienteAsync_CuandoTelefonoDuplicadoSinIgnorar_DebeRetornarError()
    {
        // Arrange
        var existente = new Usuario { Id = 1, Nombre = "Juan", Rol = "Cliente", Telefono = "999888", Email = "j@t.com" };
        await _context.Usuarios.AddAsync(existente);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new CrearClienteDto { Nombre = "Pedro", Email = "p@t.com", Telefono = "999888", IgnorarDuplicados = false };

        // Act
        var result = await _sut.RegistrarClienteAsync(dto);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Se detectaron posibles clientes duplicados en el sistema.", result.Message);
    }

    [TestMethod]
    public async Task RegistrarClienteAsync_CuandoCreateIdentityFalla_DebeRetornarError()
    {
        // Arrange
        var dto = new CrearClienteDto { Nombre = "Pedro", Email = "pedro@test.com" };
        _userManagerMock.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Pwd too simple" }));

        // Act
        var result = await _sut.RegistrarClienteAsync(dto);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.IsTrue(result.Message.Contains("Error al crear cuenta de identidad"));
    }

    [TestMethod]
    public async Task RegistrarClienteAsync_CuandoSinEmail_DebeGenerarPlaceholder()
    {
        // Arrange
        var dto = new CrearClienteDto { Nombre = "Pedro", Email = "" };

        // Act
        var result = await _sut.RegistrarClienteAsync(dto);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.IsTrue(result.Cliente!.Email.StartsWith("sin_correo_"));
    }

    [TestMethod]
    public async Task EditarClienteAsync_CuandoAntesSinIdentityYSeAgregaEmail_DebeCrearIdentityUser()
    {
        // Arrange
        var user = new Usuario { Id = 10, Nombre = "Juan", Rol = "Cliente", Email = "sin_correo_123@vetcare.pro", ApplicationUserId = null };
        await _context.Usuarios.AddAsync(user);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        var dto = new EditarClienteDto { Nombre = "Juan Modificado", Email = "juan@new.com" };

        // Act
        var result = await _sut.EditarClienteAsync(10, dto);

        // Assert
        Assert.IsTrue(result.Success);
        var inDb = await _context.Usuarios.FindAsync(10);
        Assert.AreEqual("juan@new.com", inDb!.Email);
        _userManagerMock.Verify(m => m.CreateAsync(It.Is<ApplicationUser>(u => u.Email == "juan@new.com"), It.IsAny<string>()), Times.Once);
    }

    [TestMethod]
    public async Task EditarClienteAsync_CuandoAntesSinIdentityYFallaCreateIdentity_DebeRetornarError()
    {
        // Arrange
        var user = new Usuario { Id = 10, Nombre = "Juan", Rol = "Cliente", Email = "sin_correo_123@vetcare.pro", ApplicationUserId = null };
        await _context.Usuarios.AddAsync(user);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Pwd too simple" }));

        var dto = new EditarClienteDto { Nombre = "Juan Modificado", Email = "juan@new.com" };

        // Act
        var result = await _sut.EditarClienteAsync(10, dto);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.IsTrue(result.Message.Contains("Error al crear cuenta de identidad"));
    }
}
