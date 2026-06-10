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
public class UsuarioServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private Mock<UserManager<ApplicationUser>> _userManagerMock = null!;
    private Mock<RoleManager<IdentityRole>> _roleManagerMock = null!;
    private Mock<IAuditoriaService> _auditoriaServiceMock = null!;
    private UsuarioService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_User_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null, null, null, null, null, null, null, null);

        var roleStoreMock = new Mock<IRoleStore<IdentityRole>>();
        _roleManagerMock = new Mock<RoleManager<IdentityRole>>(
            roleStoreMock.Object, null, null, null, null);

        _auditoriaServiceMock = new Mock<IAuditoriaService>();

        _sut = new UsuarioService(
            _userManagerMock.Object,
            _roleManagerMock.Object,
            _unitOfWork,
            _auditoriaServiceMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task CrearUsuarioAsync_CuandoEmailDuplicado_DebeRetornarError()
    {
        // Arrange
        var request = new CrearUsuarioDto { Email = "test@test.com", Password = "pwd", Rol = "Cliente" };
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync(new ApplicationUser());

        // Act
        var result = await _sut.CrearUsuarioAsync(request);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("El correo electrónico ya está registrado.", result.Message);
    }

    [TestMethod]
    public async Task CrearUsuarioAsync_CuandoExitoso_DebeRetornarExito()
    {
        // Arrange
        var request = new CrearUsuarioDto { Email = "nuevo@test.com", Password = "pwd", Nombre = "Nuevo User", Rol = "Veterinario" };
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync((ApplicationUser)null!);
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password)).ReturnsAsync(IdentityResult.Success);
        _roleManagerMock.Setup(x => x.RoleExistsAsync(request.Rol)).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), request.Rol)).ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _sut.CrearUsuarioAsync(request);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual("Usuario interno creado con éxito.", result.Message);

        var domainUser = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);
        Assert.IsNotNull(domainUser);
        Assert.AreEqual("Veterinario", domainUser.Rol);

        // Verificar si se creó el veterinario
        var vet = await _context.Veterinarios.FirstOrDefaultAsync(v => v.Email == request.Email);
        Assert.IsNotNull(vet);
    }

    [TestMethod]
    public async Task CambiarEstadoAsync_CuandoExitoso_DebeActualizarEstado()
    {
        // Arrange
        var usuario = new Usuario { Id = 1, Email = "user@test.com", Nombre = "Test", Activo = true };
        await _context.Usuarios.AddAsync(usuario);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.CambiarEstadoAsync(1, false);

        // Assert
        Assert.IsTrue(result.Success);
        var updatedUser = await _context.Usuarios.FindAsync(1);
        Assert.IsFalse(updatedUser!.Activo);
        _auditoriaServiceMock.Verify(a => a.RegistrarAccionAsync("Desactivar Usuario", "Usuario", "1", It.IsAny<string>()), Times.Once);
    }

    [TestMethod]
    public async Task EditarUsuarioAsync_CuandoExitoso_DebeActualizarRolesYDatos()
    {
        // Arrange
        var appUser = new ApplicationUser { Id = "app-user-1", Email = "user@test.com" };
        var usuario = new Usuario { Id = 1, ApplicationUserId = "app-user-1", Email = "user@test.com", Nombre = "Old", Rol = "Cliente", Activo = true };
        
        await _context.Usuarios.AddAsync(usuario);
        await _context.SaveChangesAsync();

        var request = new EditarUsuarioDto { Nombre = "New Name", Rol = "Recepcionista", DNI = "123", Telefono = "456", Direccion = "Dir" };
        
        _userManagerMock.Setup(x => x.FindByIdAsync("app-user-1")).ReturnsAsync(appUser);
        _userManagerMock.Setup(x => x.UpdateAsync(appUser)).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.GetRolesAsync(appUser)).ReturnsAsync(new List<string> { "Cliente" });
        _roleManagerMock.Setup(x => x.RoleExistsAsync("Recepcionista")).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.RemoveFromRolesAsync(appUser, It.IsAny<IEnumerable<string>>())).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.AddToRoleAsync(appUser, "Recepcionista")).ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _sut.EditarUsuarioAsync(1, request);

        // Assert
        Assert.IsTrue(result.Success);
        var updatedUser = await _context.Usuarios.FindAsync(1);
        Assert.AreEqual("New Name", updatedUser!.Nombre);
        Assert.AreEqual("Recepcionista", updatedUser.Rol);
    }

    [TestMethod]
    public async Task GetUsuariosAsync_DebeRetornarListaUsuarios()
    {
        // Arrange
        var u1 = new Usuario { Id = 10, Nombre = "User A", Email = "a@test.com", FechaRegistro = DateTime.Today.AddDays(-1) };
        var u2 = new Usuario { Id = 11, Nombre = "User B", Email = "b@test.com", FechaRegistro = DateTime.Today };
        await _context.Usuarios.AddRangeAsync(u1, u2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetUsuariosAsync();

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual(2, result.Data!.Count);
        Assert.AreEqual("User B", result.Data[0].Nombre); // Ordered desc by FechaRegistro
    }

    [TestMethod]
    public async Task CrearUsuarioAsync_CuandoRolNoExiste_DebeCrearRolYProceder()
    {
        // Arrange
        var request = new CrearUsuarioDto { Email = "nuevo@test.com", Password = "pwd", Rol = "Invalido" };
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync((ApplicationUser)null!);
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password)).ReturnsAsync(IdentityResult.Success);
        _roleManagerMock.Setup(x => x.RoleExistsAsync(request.Rol)).ReturnsAsync(false);
        _roleManagerMock.Setup(x => x.CreateAsync(It.IsAny<IdentityRole>())).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), request.Rol)).ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _sut.CrearUsuarioAsync(request);

        // Assert
        Assert.IsTrue(result.Success);
        _roleManagerMock.Verify(x => x.CreateAsync(It.Is<IdentityRole>(r => r.Name == "Invalido")), Times.Once);
    }

    [TestMethod]
    public async Task EditarUsuarioAsync_CuandoUsuarioNoExiste_DebeRetornarError()
    {
        // Act
        var result = await _sut.EditarUsuarioAsync(999, new EditarUsuarioDto());

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Usuario no encontrado.", result.Message);
    }

    [TestMethod]
    public async Task EditarUsuarioAsync_CuandoAppUserNoExiste_DebeRetornarError()
    {
        // Arrange
        var usuario = new Usuario { Id = 10, ApplicationUserId = "app-user-1", Rol = "Cliente" };
        await _context.Usuarios.AddAsync(usuario);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(x => x.FindByIdAsync("app-user-1")).ReturnsAsync((ApplicationUser)null!);

        // Act
        var result = await _sut.EditarUsuarioAsync(10, new EditarUsuarioDto());

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Cuenta de identidad asociada no encontrada.", result.Message);
    }

    [TestMethod]
    public async Task EditarUsuarioAsync_CuandoRolNoExiste_DebeCrearRolYProceder()
    {
        // Arrange
        var appUser = new ApplicationUser { Id = "app-user-1" };
        var usuario = new Usuario { Id = 10, ApplicationUserId = "app-user-1", Rol = "Cliente" };
        await _context.Usuarios.AddAsync(usuario);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(x => x.FindByIdAsync("app-user-1")).ReturnsAsync(appUser);
        _userManagerMock.Setup(x => x.UpdateAsync(appUser)).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.GetRolesAsync(appUser)).ReturnsAsync(new List<string> { "Cliente" });
        _userManagerMock.Setup(x => x.RemoveFromRolesAsync(appUser, It.IsAny<IEnumerable<string>>())).ReturnsAsync(IdentityResult.Success);
        _roleManagerMock.Setup(x => x.RoleExistsAsync("Invalido")).ReturnsAsync(false);
        _roleManagerMock.Setup(x => x.CreateAsync(It.IsAny<IdentityRole>())).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.AddToRoleAsync(appUser, "Invalido")).ReturnsAsync(IdentityResult.Success);

        var request = new EditarUsuarioDto { Rol = "Invalido" };

        // Act
        var result = await _sut.EditarUsuarioAsync(10, request);

        // Assert
        Assert.IsTrue(result.Success);
        _roleManagerMock.Verify(x => x.CreateAsync(It.Is<IdentityRole>(r => r.Name == "Invalido")), Times.Once);
    }

    [TestMethod]
    public async Task EliminarUsuarioAsync_DebeEliminarFisicamente()
    {
        // Arrange
        // 1. Caso exitoso: usuario cliente con mascota sin citas
        var usuario = new Usuario { Id = 10, Rol = "Cliente", Email = "c@test.com", ApplicationUserId = "app-user-1" };
        var mascota = new Mascota { Id = 5, Nombre = "Coco", UsuarioId = 10 };
        var appUser = new ApplicationUser { Id = "app-user-1" };

        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(x => x.FindByIdAsync("app-user-1")).ReturnsAsync(appUser);
        _userManagerMock.Setup(x => x.DeleteAsync(appUser)).ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _sut.EliminarUsuarioAsync(10);

        // Assert
        Assert.IsTrue(result.Success);
        var inDbUser = await _context.Usuarios.FindAsync(10);
        Assert.IsNull(inDbUser);
        var inDbMascota = await _context.Mascotas.FindAsync(5);
        Assert.IsNull(inDbMascota);
        _auditoriaServiceMock.Verify(a => a.RegistrarAccionAsync("Eliminar Usuario", "Usuario", "10", It.IsAny<string>()), Times.Once);

        // 2. Caso Veterinario con citas (no se debe poder eliminar físicamente)
        _context.ChangeTracker.Clear();
        var vet = new Usuario { Id = 11, Rol = "Veterinario", Email = "vet@test.com" };
        var vetEntidad = new Veterinario { Id = 1, Email = "vet@test.com" };
        var cita = new Cita { Id = 1, VeterinarioId = 1 };
        await _context.Usuarios.AddAsync(vet);
        await _context.Veterinarios.AddAsync(vetEntidad);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var resultVet = await _sut.EliminarUsuarioAsync(11);
        Assert.IsFalse(resultVet.Success);
        Assert.IsTrue(resultVet.Message.Contains("historial de citas"));
    }

    [TestMethod]
    public async Task CrearUsuarioAsync_CuandoRequestEsNull_DebeRetornarError()
    {
        var result = await _sut.CrearUsuarioAsync(null!);
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Datos de registro inválidos.", result.Message);
    }

    [TestMethod]
    public async Task CrearUsuarioAsync_CuandoEmailYaExisteEnDominio_DebeRetornarError()
    {
        var usuario = new Usuario { Id = 10, Email = "existente@test.com" };
        await _context.Usuarios.AddAsync(usuario);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var request = new CrearUsuarioDto { Email = "existente@test.com", Password = "pwd", Rol = "Cliente" };
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync((ApplicationUser)null!);

        var result = await _sut.CrearUsuarioAsync(request);
        Assert.IsFalse(result.Success);
        Assert.AreEqual("El correo electrónico ya está registrado en la base de datos.", result.Message);
    }

    [TestMethod]
    public async Task CrearUsuarioAsync_CuandoCreateAsyncFalla_DebeRetornarError()
    {
        var request = new CrearUsuarioDto { Email = "nuevo@test.com", Password = "pwd", Rol = "Cliente" };
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync((ApplicationUser)null!);
        var identityError = new IdentityError { Description = "Password too simple" };
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Failed(identityError));

        var result = await _sut.CrearUsuarioAsync(request);
        Assert.IsFalse(result.Success);
        Assert.IsTrue(result.Message.Contains("Password too simple"));
    }

    [TestMethod]
    public async Task EditarUsuarioAsync_CuandoRequestEsNull_DebeRetornarError()
    {
        var result = await _sut.EditarUsuarioAsync(1, null!);
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Datos de edición inválidos.", result.Message);
    }

    [TestMethod]
    public async Task EditarUsuarioAsync_CuandoUpdateAsyncFalla_DebeRetornarError()
    {
        var appUser = new ApplicationUser { Id = "app-user-1" };
        var usuario = new Usuario { Id = 10, ApplicationUserId = "app-user-1", Rol = "Cliente", Email = "test@test.com" };
        await _context.Usuarios.AddAsync(usuario);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(x => x.FindByIdAsync("app-user-1")).ReturnsAsync(appUser);
        var identityError = new IdentityError { Description = "Update failed" };
        _userManagerMock.Setup(x => x.UpdateAsync(appUser)).ReturnsAsync(IdentityResult.Failed(identityError));

        var result = await _sut.EditarUsuarioAsync(10, new EditarUsuarioDto { Nombre = "New", Rol = "Cliente" });
        Assert.IsFalse(result.Success);
        Assert.IsTrue(result.Message.Contains("Update failed"));
    }

    [TestMethod]
    public async Task EditarUsuarioAsync_CuandoCambioARolVeterinarioYNuevoVet_DebeCrearVeterinario()
    {
        var appUser = new ApplicationUser { Id = "app-user-1" };
        var usuario = new Usuario { Id = 10, ApplicationUserId = "app-user-1", Rol = "Cliente", Email = "vet@test.com", Nombre = "Doc" };
        await _context.Usuarios.AddAsync(usuario);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(x => x.FindByIdAsync("app-user-1")).ReturnsAsync(appUser);
        _userManagerMock.Setup(x => x.UpdateAsync(appUser)).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.GetRolesAsync(appUser)).ReturnsAsync(new List<string> { "Cliente" });
        _roleManagerMock.Setup(x => x.RoleExistsAsync("Veterinario")).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.RemoveFromRolesAsync(appUser, It.IsAny<IEnumerable<string>>())).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.AddToRoleAsync(appUser, "Veterinario")).ReturnsAsync(IdentityResult.Success);

        var result = await _sut.EditarUsuarioAsync(10, new EditarUsuarioDto { Nombre = "Doc", Rol = "Veterinario" });
        Assert.IsTrue(result.Success);

        var vet = await _context.Veterinarios.FirstOrDefaultAsync(v => v.Email == "vet@test.com");
        Assert.IsNotNull(vet);
        Assert.IsTrue(vet.Activo);
    }

    [TestMethod]
    public async Task EditarUsuarioAsync_CuandoCambioARolNoVeterinarioYVetExiste_DebeDesactivarVeterinario()
    {
        var appUser = new ApplicationUser { Id = "app-user-1" };
        var usuario = new Usuario { Id = 10, ApplicationUserId = "app-user-1", Rol = "Veterinario", Email = "vet@test.com", Nombre = "Doc" };
        var vet = new Veterinario { Id = 1, Email = "vet@test.com", Nombre = "Doc", Activo = true };
        await _context.Usuarios.AddAsync(usuario);
        await _context.Veterinarios.AddAsync(vet);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(x => x.FindByIdAsync("app-user-1")).ReturnsAsync(appUser);
        _userManagerMock.Setup(x => x.UpdateAsync(appUser)).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.GetRolesAsync(appUser)).ReturnsAsync(new List<string> { "Veterinario" });
        _roleManagerMock.Setup(x => x.RoleExistsAsync("Cliente")).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.RemoveFromRolesAsync(appUser, It.IsAny<IEnumerable<string>>())).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.AddToRoleAsync(appUser, "Cliente")).ReturnsAsync(IdentityResult.Success);

        var result = await _sut.EditarUsuarioAsync(10, new EditarUsuarioDto { Nombre = "Doc", Rol = "Cliente" });
        Assert.IsTrue(result.Success);

        var updatedVet = await _context.Veterinarios.FindAsync(1);
        Assert.IsFalse(updatedVet!.Activo);
    }

    [TestMethod]
    public async Task CambiarEstadoAsync_CuandoUsuarioNoExiste_DebeRetornarError()
    {
        var result = await _sut.CambiarEstadoAsync(999, false);
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Usuario no encontrado.", result.Message);
    }

    [TestMethod]
    public async Task CambiarEstadoAsync_CuandoUsuarioEsAdminYSeDesactiva_DebeRetornarError()
    {
        var admin = new Usuario { Id = 2, Email = "admin@veterinaria.com", Activo = true };
        await _context.Usuarios.AddAsync(admin);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var result = await _sut.CambiarEstadoAsync(2, false);
        Assert.IsFalse(result.Success);
        Assert.AreEqual("No se puede desactivar la cuenta del administrador principal.", result.Message);
    }

    [TestMethod]
    public async Task CambiarEstadoAsync_CuandoVeterinarioExiste_DebeSincronizarActivo()
    {
        var usuario = new Usuario { Id = 3, Email = "vet@test.com", Activo = true };
        var vet = new Veterinario { Id = 2, Email = "vet@test.com", Activo = true };
        await _context.Usuarios.AddAsync(usuario);
        await _context.Veterinarios.AddAsync(vet);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var result = await _sut.CambiarEstadoAsync(3, false);
        Assert.IsTrue(result.Success);

        var updatedVet = await _context.Veterinarios.FindAsync(2);
        Assert.IsFalse(updatedVet!.Activo);
    }

    [TestMethod]
    public async Task EliminarUsuarioAsync_CuandoUsuarioNoExiste_DebeRetornarError()
    {
        var result = await _sut.EliminarUsuarioAsync(999);
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Usuario no encontrado.", result.Message);
    }

    [TestMethod]
    public async Task EliminarUsuarioAsync_CuandoUsuarioEsAdmin_DebeRetornarError()
    {
        var admin = new Usuario { Id = 2, Email = "admin@veterinaria.com", Activo = true };
        await _context.Usuarios.AddAsync(admin);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var result = await _sut.EliminarUsuarioAsync(2);
        Assert.IsFalse(result.Success);
        Assert.AreEqual("No se puede eliminar al administrador principal del sistema.", result.Message);
    }

    [TestMethod]
    public async Task EliminarUsuarioAsync_CuandoClienteTieneCitasTriajesHistorialOPagos_DebeRetornarError()
    {
        // 1. Caso Citas
        var client1 = new Usuario { Id = 10, Rol = "Cliente", Email = "c1@test.com" };
        var pet1 = new Mascota { Id = 1, UsuarioId = 10, Nombre = "Pet1" };
        var cita1 = new Cita { Id = 1, MascotaId = 1 };
        await _context.Usuarios.AddAsync(client1);
        await _context.Mascotas.AddAsync(pet1);
        await _context.Citas.AddAsync(cita1);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var result = await _sut.EliminarUsuarioAsync(10);
        Assert.IsFalse(result.Success);
        Assert.IsTrue(result.Message.Contains("historial clínico, de citas o de pagos"));

        // Clean
        _context.Citas.RemoveRange(_context.Citas);
        _context.Mascotas.RemoveRange(_context.Mascotas);
        _context.Usuarios.RemoveRange(_context.Usuarios);
        await _context.SaveChangesAsync();

        // 2. Caso Triajes
        var client2 = new Usuario { Id = 11, Rol = "Cliente", Email = "c2@test.com" };
        var pet2 = new Mascota { Id = 2, UsuarioId = 11, Nombre = "Pet2" };
        var triage = new Triage { Id = 1, MascotaId = 2 };
        await _context.Usuarios.AddAsync(client2);
        await _context.Mascotas.AddAsync(pet2);
        await _context.Triages.AddAsync(triage);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        result = await _sut.EliminarUsuarioAsync(11);
        Assert.IsFalse(result.Success);
        Assert.IsTrue(result.Message.Contains("historial clínico, de citas o de pagos"));

        // Clean
        _context.Triages.RemoveRange(_context.Triages);
        _context.Mascotas.RemoveRange(_context.Mascotas);
        _context.Usuarios.RemoveRange(_context.Usuarios);
        await _context.SaveChangesAsync();

        // 3. Caso Historial
        var client3 = new Usuario { Id = 12, Rol = "Cliente", Email = "c3@test.com" };
        var pet3 = new Mascota { Id = 3, UsuarioId = 12, Nombre = "Pet3" };
        var cita3 = new Cita { Id = 3, MascotaId = 3 };
        var historial = new HistorialClinico { Id = 1, CitaId = 3 };
        await _context.Usuarios.AddAsync(client3);
        await _context.Mascotas.AddAsync(pet3);
        await _context.Citas.AddAsync(cita3);
        await _context.HistorialesClinicos.AddAsync(historial);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        result = await _sut.EliminarUsuarioAsync(12);
        Assert.IsFalse(result.Success);
        Assert.IsTrue(result.Message.Contains("historial clínico, de citas o de pagos"));

        // Clean
        _context.HistorialesClinicos.RemoveRange(_context.HistorialesClinicos);
        _context.Citas.RemoveRange(_context.Citas);
        _context.Mascotas.RemoveRange(_context.Mascotas);
        _context.Usuarios.RemoveRange(_context.Usuarios);
        await _context.SaveChangesAsync();

        // 4. Caso Pagos
        var client4 = new Usuario { Id = 13, Rol = "Cliente", Email = "c4@test.com" };
        var pet4 = new Mascota { Id = 4, UsuarioId = 13, Nombre = "Pet4" };
        var cita4 = new Cita { Id = 4, MascotaId = 4 };
        var pago = new Pago { Id = 1, CitaId = 4 };
        await _context.Usuarios.AddAsync(client4);
        await _context.Mascotas.AddAsync(pet4);
        await _context.Citas.AddAsync(cita4);
        await _context.Pagos.AddAsync(pago);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        result = await _sut.EliminarUsuarioAsync(13);
        Assert.IsFalse(result.Success);
        Assert.IsTrue(result.Message.Contains("historial clínico, de citas o de pagos"));
    }

    [TestMethod]
    public async Task EliminarUsuarioAsync_CuandoDeleteIdentityFalla_DebeRetornarError()
    {
        var usuario = new Usuario { Id = 10, Rol = "Cliente", Email = "c@test.com", ApplicationUserId = "app-user-1" };
        var appUser = new ApplicationUser { Id = "app-user-1" };

        await _context.Usuarios.AddAsync(usuario);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        _userManagerMock.Setup(x => x.FindByIdAsync("app-user-1")).ReturnsAsync(appUser);
        var identityError = new IdentityError { Description = "Delete Identity failed" };
        _userManagerMock.Setup(x => x.DeleteAsync(appUser)).ReturnsAsync(IdentityResult.Failed(identityError));

        var result = await _sut.EliminarUsuarioAsync(10);
        Assert.IsFalse(result.Success);
        Assert.IsTrue(result.Message.Contains("Delete Identity failed"));
    }
}
