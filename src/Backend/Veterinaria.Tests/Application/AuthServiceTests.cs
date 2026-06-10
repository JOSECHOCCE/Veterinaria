using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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
public class AuthServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private Mock<UserManager<ApplicationUser>> _userManagerMock = null!;
    private Mock<SignInManager<ApplicationUser>> _signInManagerMock = null!;
    private Mock<IConfiguration> _configMock = null!;
    private Mock<IAuditoriaService> _auditoriaServiceMock = null!;
    private AuthService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Auth_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null, null, null, null, null, null, null, null);

        var contextAccessorMock = new Mock<IHttpContextAccessor>();
        var claimsFactoryMock = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
        _signInManagerMock = new Mock<SignInManager<ApplicationUser>>(
            _userManagerMock.Object, contextAccessorMock.Object, claimsFactoryMock.Object, null, null, null, null);

        _configMock = new Mock<IConfiguration>();
        _configMock.Setup(x => x["Jwt:Key"]).Returns("SuperSecretKeyForVeterinariaApp2026!AwesomeKeyWithLength32");
        _configMock.Setup(x => x["Jwt:Issuer"]).Returns("TestIssuer");
        _configMock.Setup(x => x["Jwt:Audience"]).Returns("TestAudience");
        _configMock.Setup(x => x["Jwt:ExpiryInMinutes"]).Returns("60");

        _auditoriaServiceMock = new Mock<IAuditoriaService>();

        _sut = new AuthService(
            _signInManagerMock.Object,
            _userManagerMock.Object,
            _unitOfWork,
            _configMock.Object,
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
    public async Task LoginAsync_CuandoCredencialesInvalidas_DebeRetornarError()
    {
        // Arrange
        var request = new LoginRequestDto { Email = "test@test.com", Password = "wrongpassword" };
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync((ApplicationUser)null!);

        // Act
        var result = await _sut.LoginAsync(request);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Credenciales inválidas.", result.Message);
    }

    [TestMethod]
    public async Task LoginAsync_CuandoUsuarioInactivo_DebeRetornarError()
    {
        // Arrange
        var request = new LoginRequestDto { Email = "test@test.com", Password = "password123" };
        var appUser = new ApplicationUser { Id = "user-1", Email = "test@test.com" };
        
        // Agregar usuario al dominio inactivo
        await _context.Usuarios.AddAsync(new Usuario { ApplicationUserId = "user-1", Activo = false, Email = "test@test.com", Nombre = "Test" });
        await _context.SaveChangesAsync();

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync(appUser);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(appUser, request.Password)).ReturnsAsync(true);

        // Act
        var result = await _sut.LoginAsync(request);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Tu cuenta ha sido desactivada. Contacta al administrador.", result.Message);
    }

    [TestMethod]
    public async Task LoginAsync_CuandoExitoso_DebeRetornarToken()
    {
        // Arrange
        var request = new LoginRequestDto { Email = "test@test.com", Password = "password123" };
        var appUser = new ApplicationUser { Id = "user-1", Email = "test@test.com", NombreCompleto = "Test User" };
        
        await _context.Usuarios.AddAsync(new Usuario { ApplicationUserId = "user-1", Activo = true, Email = "test@test.com", Nombre = "Test" });
        await _context.SaveChangesAsync();

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync(appUser);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(appUser, request.Password)).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.GetRolesAsync(appUser)).ReturnsAsync(new List<string> { "Cliente" });

        // Act
        var result = await _sut.LoginAsync(request);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.IsNotNull(result.Data);
        Assert.IsFalse(string.IsNullOrEmpty(result.Data.Token));
        Assert.AreEqual("test@test.com", result.Data.Email);
    }

    [TestMethod]
    public async Task RegisterAsync_CuandoEmailExiste_DebeRetornarError()
    {
        // Arrange
        var request = new RegisterRequestDto { Email = "existente@test.com", Password = "pwd" };
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync(new ApplicationUser());

        // Act
        var result = await _sut.RegisterAsync(request);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("El correo electrónico ya está registrado.", result.Message);
    }

    [TestMethod]
    public async Task RegisterAsync_CuandoExitoso_DebeAsignarRolesYRegistrarAuditoria()
    {
        // Arrange
        var request = new RegisterRequestDto { Email = "nuevo@test.com", Password = "pwd", NombreCompleto = "Nuevo Usuario" };
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync((ApplicationUser)null!);
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password)).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Cliente")).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Usuario")).ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _sut.RegisterAsync(request);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual("nuevo@test.com", result.Data);
        
        var dominioUsuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == "nuevo@test.com");
        Assert.IsNotNull(dominioUsuario);
        Assert.AreEqual("Nuevo Usuario", dominioUsuario.Nombre);
        
        _auditoriaServiceMock.Verify(a => a.RegistrarAccionAsync("Auto-Registro Cliente", "Usuario", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [TestMethod]
    [DataRow(null)]
    [DataRow("")]
    public async Task GetProfileAsync_CuandoIdEsNuloOVacio_DebeRetornarError(string appUserId)
    {
        // Arrange & Act
        var result = await _sut.GetProfileAsync(appUserId);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Identificador de usuario no válido.", result.Message);
    }

    [TestMethod]
    public async Task GetProfileAsync_CuandoUsuarioNoExiste_DebeRetornarError()
    {
        // Arrange
        var appUserId = "nonexistent-user";
        _userManagerMock.Setup(x => x.FindByIdAsync(appUserId)).ReturnsAsync((ApplicationUser)null!);

        // Act
        var result = await _sut.GetProfileAsync(appUserId);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Cuenta no encontrada.", result.Message);
    }

    [TestMethod]
    public async Task GetProfileAsync_CuandoUsuarioExisteYPerfilExiste_DebeRetornarPerfil()
    {
        // Arrange
        var appUserId = "existing-user";
        var appUser = new ApplicationUser 
        { 
            Id = appUserId, 
            NombreCompleto = "Juan Pérez", 
            Email = "juan@test.com" 
        };

        var domainUser = new Usuario
        {
            ApplicationUserId = appUserId,
            Nombre = "Juan Pérez",
            Email = "juan@test.com",
            Telefono = "987654321",
            DNI = "12345678A",
            Direccion = "Calle Falsa 123",
            Rol = "Cliente",
            Activo = true
        };

        _userManagerMock.Setup(x => x.FindByIdAsync(appUserId)).ReturnsAsync(appUser);
        await _context.Usuarios.AddAsync(domainUser);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetProfileAsync(appUserId);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual("Perfil recuperado con éxito.", result.Message);

        var data = result.Data;
        var nombre = data.GetType().GetProperty("NombreCompleto")?.GetValue(data) as string;
        var email = data.GetType().GetProperty("Email")?.GetValue(data) as string;
        var telefono = data.GetType().GetProperty("Telefono")?.GetValue(data) as string;
        var dni = data.GetType().GetProperty("DNI")?.GetValue(data) as string;
        var direccion = data.GetType().GetProperty("Direccion")?.GetValue(data) as string;

        Assert.AreEqual("Juan Pérez", nombre);
        Assert.AreEqual("juan@test.com", email);
        Assert.AreEqual("987654321", telefono);
        Assert.AreEqual("12345678A", dni);
        Assert.AreEqual("Calle Falsa 123", direccion);
    }

    [TestMethod]
    public async Task GetProfileAsync_CuandoUsuarioExistePeroPerfilEsNulo_DebeRetornarCamposVacios()
    {
        // Arrange
        var appUserId = "user-without-profile";
        var appUser = new ApplicationUser 
        { 
            Id = appUserId, 
            NombreCompleto = "Usuario Sin Perfil", 
            Email = "sinperfil@test.com" 
        };

        _userManagerMock.Setup(x => x.FindByIdAsync(appUserId)).ReturnsAsync(appUser);
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetProfileAsync(appUserId);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.IsNotNull(result.Data);

        var data = result.Data;
        var nombre = data.GetType().GetProperty("NombreCompleto")?.GetValue(data) as string;
        var email = data.GetType().GetProperty("Email")?.GetValue(data) as string;
        var telefono = data.GetType().GetProperty("Telefono")?.GetValue(data) as string;
        var dni = data.GetType().GetProperty("DNI")?.GetValue(data) as string;
        var direccion = data.GetType().GetProperty("Direccion")?.GetValue(data) as string;

        Assert.AreEqual("Usuario Sin Perfil", nombre);
        Assert.AreEqual("sinperfil@test.com", email);
        Assert.AreEqual("", telefono);
        Assert.AreEqual("", dni);
        Assert.AreEqual("", direccion);
    }

    [TestMethod]
    [DataRow(null)]
    [DataRow("")]
    public async Task UpdateProfileAsync_CuandoIdEsNuloOVacio_DebeRetornarError(string appUserId)
    {
        // Arrange
        var request = new UpdateProfileRequestDto();

        // Act
        var result = await _sut.UpdateProfileAsync(appUserId, request);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Identificador de usuario no válido.", result.Message);
    }

    [TestMethod]
    public async Task UpdateProfileAsync_CuandoUsuarioNoExiste_DebeRetornarError()
    {
        // Arrange
        var appUserId = "nonexistent-user";
        var request = new UpdateProfileRequestDto();
        _userManagerMock.Setup(x => x.FindByIdAsync(appUserId)).ReturnsAsync((ApplicationUser)null!);

        // Act
        var result = await _sut.UpdateProfileAsync(appUserId, request);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Cuenta no encontrada.", result.Message);
    }

    [TestMethod]
    public async Task UpdateProfileAsync_CuandoPerfilNoExiste_DebeRetornarError()
    {
        // Arrange
        var appUserId = "user-without-profile";
        var request = new UpdateProfileRequestDto();
        var appUser = new ApplicationUser { Id = appUserId };
        _userManagerMock.Setup(x => x.FindByIdAsync(appUserId)).ReturnsAsync(appUser);

        // Act
        var result = await _sut.UpdateProfileAsync(appUserId, request);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Perfil no encontrado.", result.Message);
    }

    [TestMethod]
    public async Task UpdateProfileAsync_CuandoActualizacionDeIdentidadFalla_DebeRetornarError()
    {
        // Arrange
        var appUserId = "existing-user";
        var request = new UpdateProfileRequestDto { NombreCompleto = "Updated Name" };
        var appUser = new ApplicationUser { Id = appUserId, NombreCompleto = "Old Name" };
        var domainUser = new Usuario
        {
            ApplicationUserId = appUserId,
            Nombre = "Old Name",
            Email = "old@test.com",
            Activo = true
        };

        _userManagerMock.Setup(x => x.FindByIdAsync(appUserId)).ReturnsAsync(appUser);
        _userManagerMock.Setup(x => x.UpdateAsync(appUser)).ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Update error description" }));
        
        await _context.Usuarios.AddAsync(domainUser);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.UpdateProfileAsync(appUserId, request);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Error al actualizar perfil de identidad: Update error description", result.Message);
    }

    [TestMethod]
    public async Task UpdateProfileAsync_CuandoActualizacionExitosa_DebeActualizarCamposGuardarYRegistrarAuditoria()
    {
        // Arrange
        var appUserId = "existing-user";
        var request = new UpdateProfileRequestDto 
        { 
            NombreCompleto = "New Name",
            Telefono = "999888777",
            DNI = "11122233B",
            Direccion = "New Address"
        };
        
        var appUser = new ApplicationUser { Id = appUserId, NombreCompleto = "Old Name", Email = "test@test.com" };
        var domainUser = new Usuario
        {
            ApplicationUserId = appUserId,
            Nombre = "Old Name",
            Email = "test@test.com",
            Telefono = "123",
            DNI = "456",
            Direccion = "Old Addr",
            Activo = true
        };

        _userManagerMock.Setup(x => x.FindByIdAsync(appUserId)).ReturnsAsync(appUser);
        _userManagerMock.Setup(x => x.UpdateAsync(appUser)).ReturnsAsync(IdentityResult.Success);
        
        await _context.Usuarios.AddAsync(domainUser);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.UpdateProfileAsync(appUserId, request);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual("Perfil actualizado correctamente.", result.Data);

        var updatedDomainUser = await _context.Usuarios.FirstOrDefaultAsync(u => u.ApplicationUserId == appUserId);
        Assert.IsNotNull(updatedDomainUser);
        Assert.AreEqual("New Name", updatedDomainUser.Nombre);
        Assert.AreEqual("999888777", updatedDomainUser.Telefono);
        Assert.AreEqual("11122233B", updatedDomainUser.DNI);
        Assert.AreEqual("New Address", updatedDomainUser.Direccion);

        _auditoriaServiceMock.Verify(a => a.RegistrarAccionAsync(
            "Actualizar Perfil", 
            "Usuario", 
            updatedDomainUser.Id.ToString(), 
            $"El usuario test@test.com actualizó su información de perfil"
        ), Times.Once);
    }

    [TestMethod]
    [DataRow(null)]
    [DataRow("")]
    public async Task ChangePasswordAsync_CuandoIdEsNuloOVacio_DebeRetornarError(string appUserId)
    {
        // Arrange
        var request = new ChangePasswordRequestDto();

        // Act
        var result = await _sut.ChangePasswordAsync(appUserId, request);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Identificador de usuario no válido.", result.Message);
    }

    [TestMethod]
    public async Task ChangePasswordAsync_CuandoUsuarioNoExiste_DebeRetornarError()
    {
        // Arrange
        var appUserId = "nonexistent-user";
        var request = new ChangePasswordRequestDto();
        _userManagerMock.Setup(x => x.FindByIdAsync(appUserId)).ReturnsAsync((ApplicationUser)null!);

        // Act
        var result = await _sut.ChangePasswordAsync(appUserId, request);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Cuenta no encontrada.", result.Message);
    }

    [TestMethod]
    public async Task ChangePasswordAsync_CuandoUserManagerFalla_DebeRetornarError()
    {
        // Arrange
        var appUserId = "existing-user";
        var request = new ChangePasswordRequestDto { CurrentPassword = "OldPassword", NewPassword = "NewPassword" };
        var appUser = new ApplicationUser { Id = appUserId };
        
        _userManagerMock.Setup(x => x.FindByIdAsync(appUserId)).ReturnsAsync(appUser);
        _userManagerMock.Setup(x => x.ChangePasswordAsync(appUser, request.CurrentPassword, request.NewPassword))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Password too simple" }));

        // Act
        var result = await _sut.ChangePasswordAsync(appUserId, request);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Error al cambiar la contraseña: Password too simple", result.Message);
    }

    [TestMethod]
    public async Task ChangePasswordAsync_CuandoCambioExitoso_DebeRegistrarAuditoriaYRetornarExito()
    {
        // Arrange
        var appUserId = "existing-user";
        var request = new ChangePasswordRequestDto { CurrentPassword = "OldPassword", NewPassword = "NewPassword" };
        var appUser = new ApplicationUser { Id = appUserId, Email = "test@test.com" };
        var domainUser = new Usuario
        {
            ApplicationUserId = appUserId,
            Nombre = "Juan",
            Email = "test@test.com",
            Activo = true
        };

        _userManagerMock.Setup(x => x.FindByIdAsync(appUserId)).ReturnsAsync(appUser);
        _userManagerMock.Setup(x => x.ChangePasswordAsync(appUser, request.CurrentPassword, request.NewPassword))
            .ReturnsAsync(IdentityResult.Success);

        await _context.Usuarios.AddAsync(domainUser);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.ChangePasswordAsync(appUserId, request);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual("Contraseña actualizada correctamente.", result.Data);

        _auditoriaServiceMock.Verify(a => a.RegistrarAccionAsync(
            "Cambio Contraseña",
            "Usuario",
            domainUser.Id.ToString(),
            $"El usuario test@test.com realizó un cambio de contraseña"
        ), Times.Once);
    }

    [TestMethod]
    public async Task RegisterAsync_CuandoUsuarioDeDominioYaExistePorEmail_DebeRetornarError()
    {
        // Arrange
        var request = new RegisterRequestDto { Email = "duplicado@test.com", Password = "pwd", NombreCompleto = "Duplicado" };
        var domainUser = new Usuario
        {
            Nombre = "Duplicado Existente",
            Email = "duplicado@test.com",
            Activo = true
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync((ApplicationUser)null!);
        await _context.Usuarios.AddAsync(domainUser);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.RegisterAsync(request);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("El correo electrónico ya está registrado en el sistema.", result.Message);
    }

    [TestMethod]
    public async Task RegisterAsync_CuandoCreacionIdentityFalla_DebeRetornarErrorConDetalles()
    {
        // Arrange
        var request = new RegisterRequestDto { Email = "fail@test.com", Password = "pwd", NombreCompleto = "Fail Test" };
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync((ApplicationUser)null!);
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Failed(
                new IdentityError { Description = "El password debe contener un dígito." },
                new IdentityError { Description = "El password debe contener una mayúscula." }
            ));

        // Act
        var result = await _sut.RegisterAsync(request);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Error al registrar el usuario: El password debe contener un dígito., El password debe contener una mayúscula.", result.Message);
    }

    [TestMethod]
    [DataRow(null, "pwd")]
    [DataRow("email@test.com", null)]
    [DataRow("", "pwd")]
    [DataRow("email@test.com", "")]
    public async Task LoginAsync_CuandoDatosRequeridosFaltan_DebeRetornarError(string email, string password)
    {
        var request = email == null && password == null ? null : new LoginRequestDto { Email = email, Password = password };
        var result = await _sut.LoginAsync(request!);
        Assert.IsFalse(result.Success);
        Assert.AreEqual("El correo y la contraseña son requeridos.", result.Message);
    }

    [TestMethod]
    public async Task LoginAsync_CuandoPasswordIncorrecta_DebeRetornarError()
    {
        // Arrange
        var request = new LoginRequestDto { Email = "test@test.com", Password = "wrongpassword" };
        var appUser = new ApplicationUser { Id = "user-1", Email = "test@test.com" };
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync(appUser);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(appUser, request.Password)).ReturnsAsync(false);

        // Act
        var result = await _sut.LoginAsync(request);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Credenciales inválidas.", result.Message);
    }

    [TestMethod]
    public async Task LoginAsync_CuandoUsuarioNoTieneRoles_DebeAsignarRolCliente()
    {
        // Arrange
        var request = new LoginRequestDto { Email = "test@test.com", Password = "password123" };
        var appUser = new ApplicationUser { Id = "user-1", Email = "test@test.com", NombreCompleto = "Test User" };
        
        await _context.Usuarios.AddAsync(new Usuario { ApplicationUserId = "user-1", Activo = true, Email = "test@test.com", Nombre = "Test" });
        await _context.SaveChangesAsync();

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync(appUser);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(appUser, request.Password)).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.GetRolesAsync(appUser)).ReturnsAsync(new List<string>()); // No roles

        // Act
        var result = await _sut.LoginAsync(request);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual("Cliente", result.Data!.Role);
    }

    [TestMethod]
    [DataRow(null, "pwd")]
    [DataRow("email@test.com", null)]
    [DataRow("", "pwd")]
    [DataRow("email@test.com", "")]
    public async Task RegisterAsync_CuandoDatosRequeridosFaltan_DebeRetornarError(string email, string password)
    {
        var request = email == null && password == null ? null : new RegisterRequestDto { Email = email, Password = password };
        var result = await _sut.RegisterAsync(request!);
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Datos de registro inválidos.", result.Message);
    }
}
