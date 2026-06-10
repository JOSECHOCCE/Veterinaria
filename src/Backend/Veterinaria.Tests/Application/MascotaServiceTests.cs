using System;
using System.Linq;
using System.Threading.Tasks;
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
public class MascotaServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private Mock<IAuditoriaService> _auditoriaServiceMock = null!;
    private MascotaService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Mascota_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new VeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        _auditoriaServiceMock = new Mock<IAuditoriaService>();
        
        _sut = new MascotaService(_unitOfWork, _auditoriaServiceMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task CrearMascotaAsync_CuandoExitoso_DebeGuardarEnRepositorio()
    {
        // Arrange
        var usuario = new Usuario { Id = 1, ApplicationUserId = "app-user-1", Nombre = "Owner" };
        await _context.Usuarios.AddAsync(usuario);
        await _context.SaveChangesAsync();

        var dto = new CrearMascotaDto { Nombre = "Fido", Especie = "Perro" };

        // Act
        var result = await _sut.CrearMascotaAsync(dto, "app-user-1", false);

        // Assert
        Assert.IsTrue(result.Success);
        var mascotaDb = await _context.Mascotas.FirstOrDefaultAsync(m => m.Nombre == "Fido");
        Assert.IsNotNull(mascotaDb);
        Assert.AreEqual(1, mascotaDb!.UsuarioId);
        _auditoriaServiceMock.Verify(a => a.RegistrarAccionAsync("Crear", "Mascota", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [TestMethod]
    public async Task DeleteMascotaAsync_CuandoExitoso_DebeInactivarMascotaYCancelarCitasFuturas()
    {
        // Arrange
        var mascota = new Mascota { Id = 1, Nombre = "Fido", Activo = true };
        var citaPasada = new Cita { Id = 1, MascotaId = 1, Estado = "Confirmada", FechaHora = DateTime.Now.AddDays(-1) };
        var citaFutura = new Cita { Id = 2, MascotaId = 1, Estado = "Confirmada", FechaHora = DateTime.Now.AddDays(1) };
        
        await _context.Mascotas.AddAsync(mascota);
        await _context.Citas.AddRangeAsync(citaPasada, citaFutura);
        await _context.SaveChangesAsync();
        
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.DeleteMascotaAsync(1);

        // Assert
        Assert.IsTrue(result.Success);
        var mascotaDb = await _context.Mascotas.FindAsync(1);
        Assert.IsFalse(mascotaDb!.Activo);

        var citaPasadaDb = await _context.Citas.FindAsync(1);
        Assert.AreEqual("Confirmada", citaPasadaDb!.Estado); // No debe cambiar

        var citaFuturaDb = await _context.Citas.FindAsync(2);
        Assert.AreEqual("Cancelada", citaFuturaDb!.Estado); // Debe cancelarse
    }

    [TestMethod]
    public async Task GetMascotasPaginatedAsync_CuandoEsCliente_DebeRetornarSoloSusMascotas()
    {
        // Arrange
        var usuario1 = new Usuario { Id = 1, ApplicationUserId = "user-1", Nombre = "Owner 1" };
        var usuario2 = new Usuario { Id = 2, ApplicationUserId = "user-2", Nombre = "Owner 2" };
        
        var mascota1 = new Mascota { Id = 1, UsuarioId = 1, Nombre = "Fido 1", Activo = true };
        var mascota2 = new Mascota { Id = 2, UsuarioId = 2, Nombre = "Fido 2", Activo = true };
        
        await _context.Usuarios.AddRangeAsync(usuario1, usuario2);
        await _context.Mascotas.AddRangeAsync(mascota1, mascota2);
        await _context.SaveChangesAsync();

        // Act
        var (mascotas, total) = await _sut.GetMascotasPaginatedAsync(null, 1, "user-1", true);

        // Assert
        Assert.AreEqual(1, total);
        Assert.AreEqual(1, mascotas.Count);
        Assert.AreEqual(1, mascotas.First().Id);
    }

    [TestMethod]
    public async Task DeleteMascotaAsync_CuandoNoExiste_DebeRetornarFail()
    {
        // Act
        var result = await _sut.DeleteMascotaAsync(999);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Mascota no encontrada.", result.Message);
    }

    [TestMethod]
    public async Task GetMascotaByIdAsync_DebeRetornarMascota()
    {
        // Arrange
        var mascota = new Mascota { Id = 10, Nombre = "Coco", Activo = true };
        await _context.Mascotas.AddAsync(mascota);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetMascotaByIdAsync(10);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("Coco", result.Nombre);
    }

    [TestMethod]
    public async Task GetMascotaWithDetailsAsync_DebeRetornarMascotaConUsuario()
    {
        // Arrange
        var usuario = new Usuario { Id = 5, Nombre = "Juan" };
        var mascota = new Mascota { Id = 10, Nombre = "Coco", Activo = true, UsuarioId = 5, Usuario = usuario };
        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetMascotaWithDetailsAsync(10);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("Coco", result.Nombre);
        Assert.AreEqual("Juan", result.Usuario.Nombre);
    }

    [TestMethod]
    public async Task GetAlertasMascotaAsync_DebeCalcularAlertas()
    {
        // Arrange
        var usuario = new Usuario { Id = 10, Nombre = "User" };
        var mascota = new Mascota { Id = 1, Nombre = "Max", Peso = 35m, AlergiasConocidas = "Polen", ObservacionesGenerales = "Condición crónica", UsuarioId = 10 };
        
        await _context.Usuarios.AddAsync(usuario);
        await _context.Mascotas.AddAsync(mascota);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetAlertasMascotaAsync(1);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("Polen", result.Alergias);
        Assert.AreEqual("Condición crónica", result.CondicionCronica);
    }

    [TestMethod]
    public async Task GetActiveUsuariosAsync_DebeRetornarSoloActivos()
    {
        // Arrange
        var u1 = new Usuario { Id = 1, Nombre = "A", Activo = true };
        var u2 = new Usuario { Id = 2, Nombre = "B", Activo = false };
        await _context.Usuarios.AddRangeAsync(u1, u2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetActiveUsuariosAsync();

        // Assert
        Assert.AreEqual(1, result.Count());
        Assert.AreEqual("A", result.First().Nombre);
    }

    [TestMethod]
    public async Task EditarMascotaAsync_CuandoMascotaNoExiste_DebeRetornarFail()
    {
        // Arrange
        var dto = new EditarMascotaDto { Id = 999, Nombre = "Nuevo" };

        // Act
        var result = await _sut.EditarMascotaAsync(999, dto);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("Mascota no encontrada.", result.Message);
    }

    [TestMethod]
    public async Task EditarMascotaAsync_CuandoDiferentePropietarioNoExiste_DebeRetornarFail()
    {
        // Arrange
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 2 };
        await _context.Mascotas.AddAsync(mascota);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new EditarMascotaDto { Id = 1, Nombre = "Fido Edit", UsuarioId = 999 }; // 999 doesn't exist

        // Act
        var result = await _sut.EditarMascotaAsync(1, dto);

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("El nuevo propietario seleccionado no existe.", result.Message);
    }

    [TestMethod]
    public async Task EditarMascotaAsync_CuandoExitoso_DebeEditarYRegistrarAuditoria()
    {
        // Arrange
        var u1 = new Usuario { Id = 2, Nombre = "User1" };
        var u2 = new Usuario { Id = 3, Nombre = "User2" };
        var mascota = new Mascota { Id = 1, Nombre = "Fido", UsuarioId = 2 };
        await _context.Usuarios.AddRangeAsync(u1, u2);
        await _context.Mascotas.AddAsync(mascota);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new EditarMascotaDto 
        { 
            Id = 1,
            Nombre = "Fido Editado", 
            Especie = "Perro", 
            Raza = "Labrador", 
            FechaNacimiento = DateTime.Today.AddYears(-2), 
            Peso = 30m, 
            UsuarioId = 3 
        };

        // Act
        var result = await _sut.EditarMascotaAsync(1, dto);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual("Fido Editado", result.Data!.Nombre);
        Assert.AreEqual(3, result.Data.UsuarioId);
        _auditoriaServiceMock.Verify(a => a.RegistrarAccionAsync("Cambio de Propietario", "Mascota", "1", It.IsAny<string>()), Times.Once);
    }

    [TestMethod]
    public async Task GetMascotasPaginatedAsync_CuandoClienteNoExiste_DebeRetornarVacio()
    {
        // Act
        var (mascotas, total) = await _sut.GetMascotasPaginatedAsync(null, 1, "inexistente", true);

        // Assert
        Assert.AreEqual(0, total);
        Assert.AreEqual(0, mascotas.Count);
    }

    [TestMethod]
    public async Task GetMascotasPaginatedAsync_ConFiltroQ_DebeFiltrarPorNombreOEspecie()
    {
        // Arrange
        var owner = new Usuario { Id = 1, Nombre = "Owner 1", Email = "owner@t.com" };
        var m1 = new Mascota { Id = 1, Nombre = "Coco", Especie = "Perro", Activo = true, UsuarioId = 1 };
        var m2 = new Mascota { Id = 2, Nombre = "Luna", Especie = "Gato", Activo = true, UsuarioId = 1 };
        await _context.Usuarios.AddAsync(owner);
        await _context.Mascotas.AddRangeAsync(m1, m2);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var (result1, total1) = await _sut.GetMascotasPaginatedAsync("coco", 1, "admin", false);
        var (result2, total2) = await _sut.GetMascotasPaginatedAsync("gato", 1, "admin", false);

        // Assert
        Assert.AreEqual(1, total1);
        Assert.AreEqual("Coco", result1[0].Nombre);
        Assert.AreEqual(1, total2);
        Assert.AreEqual("Luna", result2[0].Nombre);
    }

    [TestMethod]
    public async Task GetAlertasMascotaAsync_CuandoMascotaNoExiste_DebeRetornarDtoVacio()
    {
        // Act
        var result = await _sut.GetAlertasMascotaAsync(999);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual("Ninguna registrada", result.Alergias);
        Assert.AreEqual("Ninguna registrada", result.UltimaVacuna);
    }

    [TestMethod]
    public async Task GetAlertasMascotaAsync_CuandoValoresNull_DebeRetornarPredeterminados()
    {
        // Arrange
        var owner = new Usuario { Id = 1, Nombre = "Owner 1", Email = "owner@t.com" };
        var pet = new Mascota { Id = 1, Nombre = "Coco", AlergiasConocidas = null, ObservacionesGenerales = null, UsuarioId = 1, Activo = true };
        await _context.Usuarios.AddAsync(owner);
        await _context.Mascotas.AddAsync(pet);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetAlertasMascotaAsync(1);

        // Assert
        Assert.AreEqual("Ninguna registrada", result.Alergias);
        Assert.AreEqual("Ninguna identificada", result.CondicionCronica);
        Assert.AreEqual("Ninguna registrada", result.UltimaVacuna);
    }

    [TestMethod]
    public async Task GetAlertasMascotaAsync_CuandoTieneVacunas_DebeRetornarFechaUltimaVacuna()
    {
        // Arrange
        var owner = new Usuario { Id = 1, Nombre = "Owner 1", Email = "owner@t.com" };
        var vet = new Veterinario { Id = 1, Nombre = "V1", Activo = true };
        var pet = new Mascota { Id = 1, Nombre = "Coco", UsuarioId = 1, Activo = true };
        var servicio = new Servicio { Id = 1, Nombre = "Vacuna Antirrabica", Activo = true };
        var cita = new Cita 
        { 
            Id = 1, 
            MascotaId = 1, 
            ServicioId = 1, 
            VeterinarioId = 1, 
            Estado = "Completada", 
            FechaHora = new DateTime(2026, 05, 10, 10, 0, 0) 
        };
        await _context.Usuarios.AddAsync(owner);
        await _context.Veterinarios.AddAsync(vet);
        await _context.Mascotas.AddAsync(pet);
        await _context.Servicios.AddAsync(servicio);
        await _context.Citas.AddAsync(cita);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetAlertasMascotaAsync(1);

        // Assert
        Assert.AreEqual("10/05/2026", result.UltimaVacuna);
    }

    [TestMethod]
    public async Task CrearMascotaAsync_CuandoAdminYUsuarioIdNoCero_DebePreservarUsuarioId()
    {
        // Arrange
        var user = new Usuario { Id = 5, ApplicationUserId = "app-user-admin" };
        var client = new Usuario { Id = 8, ApplicationUserId = "app-user-client" };
        await _context.Usuarios.AddRangeAsync(user, client);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new CrearMascotaDto { Nombre = "Coco", Especie = "Gato", UsuarioId = 8 };

        // Act
        var result = await _sut.CrearMascotaAsync(dto, "app-user-admin", true);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual(8, result.Data!.UsuarioId);
    }

    [TestMethod]
    public async Task CrearMascotaAsync_CuandoUsuarioLogueadoNullYUsuarioIdCero_DebeFallbackAPropietarioUno()
    {
        // Arrange
        var fallbackUser = new Usuario { Id = 1, Nombre = "Fallback Admin" };
        await _context.Usuarios.AddAsync(fallbackUser);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new CrearMascotaDto { Nombre = "Coco", Especie = "Gato", UsuarioId = 0 };

        // Act
        var result = await _sut.CrearMascotaAsync(dto, "inexistente", true);

        // Assert
        Assert.IsTrue(result.Success);
        Assert.AreEqual(1, result.Data!.UsuarioId);
    }

    [TestMethod]
    public async Task EditarMascotaAsync_CuandoIdNoCoincide_DebeRetornarFail()
    {
        // Act
        var result = await _sut.EditarMascotaAsync(1, new EditarMascotaDto { Id = 2 });

        // Assert
        Assert.IsFalse(result.Success);
        Assert.AreEqual("El ID no coincide.", result.Message);
    }
}
