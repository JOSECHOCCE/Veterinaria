using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Linq;
using System.Threading.Tasks;
using Veterinaria.Application.Services;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;
using Veterinaria.Infrastructure.Repositories;

namespace VeterianariaAppTest
{
    [TestClass]
    public class MascotaServiceTests
    {
        private VeterinariaDbContext _context = default!;
        private UnitOfWork _unitOfWork = default!;
        private MascotaService _mascotaService = default!;

        [TestInitialize]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new VeterinariaDbContext(options);
            _unitOfWork = new UnitOfWork(_context);
            _mascotaService = new MascotaService(_unitOfWork);
        }

        [TestCleanup]
        public void Cleanup()
        {
            _context.Dispose();
        }

        [TestMethod]
        public async Task GetActiveMascotasWithUsuariosQuery_DebeRetornarSoloActivas()
        {
            // Arrange
            var propietario = new Usuario { Nombre = "Juan", Email = "juan@test.com", Rol = "Cliente", Activo = true };
            await _context.Usuarios.AddAsync(propietario);

            var mascotaActiva = new Mascota { Nombre = "Max", Especie = "Perro", Activo = true, Usuario = propietario };
            var mascotaInactiva = new Mascota { Nombre = "Rocky", Especie = "Perro", Activo = false, Usuario = propietario };
            await _context.Mascotas.AddRangeAsync(mascotaActiva, mascotaInactiva);
            await _context.SaveChangesAsync();

            // Act
            var query = _mascotaService.GetActiveMascotasWithUsuariosQuery();
            var result = await query.ToListAsync();

            // Assert
            Assert.AreEqual(1, result.Count);
            Assert.AreEqual("Max", result[0].Nombre);
            Assert.IsNotNull(result[0].Usuario);
        }

        [TestMethod]
        public async Task GetMascotaWithDetailsAsync_DebeRetornarDetallesCompletos()
        {
            // Arrange
            var propietario = new Usuario { Nombre = "Juan", Email = "juan@test.com", Rol = "Cliente", Activo = true };
            var veterinario = new Veterinario { Nombre = "Dr. Carlos", Especialidad = "Medicina", Email = "carlos@vet.com", Activo = true };
            var servicio = new Servicio { Nombre = "Consulta", Descripcion = "General", Precio = 50m, DuracionMinutos = 30, Activo = true };
            await _context.Usuarios.AddAsync(propietario);
            await _context.Veterinarios.AddAsync(veterinario);
            await _context.Servicios.AddAsync(servicio);
            await _context.SaveChangesAsync();

            var mascota = new Mascota { Nombre = "Max", Especie = "Perro", Activo = true, Usuario = propietario };
            await _context.Mascotas.AddAsync(mascota);
            await _context.SaveChangesAsync();

            var cita = new Cita 
            { 
                MascotaId = mascota.Id, 
                VeterinarioId = veterinario.Id, 
                ServicioId = servicio.Id, 
                FechaHora = DateTime.Now.AddDays(1),
                Estado = "Confirmada"
            };
            await _context.Citas.AddAsync(cita);
            await _context.SaveChangesAsync();

            // Act
            var result = await _mascotaService.GetMascotaWithDetailsAsync(mascota.Id);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual("Max", result.Nombre);
            Assert.AreEqual("Juan", result.Usuario.Nombre);
            Assert.AreEqual(1, result.Citas.Count);
            Assert.AreEqual("Dr. Carlos", result.Citas.First().Veterinario.Nombre);
            Assert.AreEqual("Consulta", result.Citas.First().Servicio.Nombre);
        }

        [TestMethod]
        public async Task GetMascotaByIdAsync_DebeRetornarMascotaCorrecta()
        {
            // Arrange
            var mascota = new Mascota { Nombre = "Max", Especie = "Perro", Activo = true };
            await _context.Mascotas.AddAsync(mascota);
            await _context.SaveChangesAsync();

            // Act
            var result = await _mascotaService.GetMascotaByIdAsync(mascota.Id);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual("Max", result.Nombre);
        }

        [TestMethod]
        public async Task GetMascotaWithUsuarioAsync_DebeRetornarMascotaConUsuario()
        {
            // Arrange
            var propietario = new Usuario { Nombre = "Juan", Email = "juan@test.com", Rol = "Cliente", Activo = true };
            await _context.Usuarios.AddAsync(propietario);
            await _context.SaveChangesAsync();

            var mascota = new Mascota { Nombre = "Max", Especie = "Perro", Activo = true, UsuarioId = propietario.Id };
            await _context.Mascotas.AddAsync(mascota);
            await _context.SaveChangesAsync();

            // Act
            var result = await _mascotaService.GetMascotaWithUsuarioAsync(mascota.Id);

            // Assert
            Assert.IsNotNull(result);
            Assert.IsNotNull(result.Usuario);
            Assert.AreEqual("Juan", result.Usuario.Nombre);
        }

        [TestMethod]
        public async Task AddMascotaAsync_DebeGuardarEnBaseDatos()
        {
            // Arrange
            var mascota = new Mascota { Nombre = "Max", Especie = "Perro", Activo = true };

            // Act
            await _mascotaService.AddMascotaAsync(mascota);

            // Assert
            var saved = await _context.Mascotas.FindAsync(mascota.Id);
            Assert.IsNotNull(saved);
            Assert.AreEqual("Max", saved.Nombre);
        }

        [TestMethod]
        public async Task UpdateMascotaAsync_DebeActualizarEnBaseDatos()
        {
            // Arrange
            var mascota = new Mascota { Nombre = "Max", Especie = "Perro", Activo = true };
            await _context.Mascotas.AddAsync(mascota);
            await _context.SaveChangesAsync();

            mascota.Nombre = "Maximus";

            // Act
            await _mascotaService.UpdateMascotaAsync(mascota);

            // Assert
            var saved = await _context.Mascotas.FindAsync(mascota.Id);
            Assert.IsNotNull(saved);
            Assert.AreEqual("Maximus", saved.Nombre);
        }

        [TestMethod]
        public async Task DeleteMascotaAsync_DebeHacerSoftDeleteYCancelarCitasFuturas()
        {
            // Arrange
            var mascota = new Mascota { Nombre = "Max", Especie = "Perro", Activo = true };
            await _context.Mascotas.AddAsync(mascota);
            await _context.SaveChangesAsync();

            var citaFuturaPendiente = new Cita { MascotaId = mascota.Id, FechaHora = DateTime.Now.AddDays(1), Estado = "Pendiente" };
            var citaFuturaConfirmada = new Cita { MascotaId = mascota.Id, FechaHora = DateTime.Now.AddDays(2), Estado = "Confirmada" };
            var citaPasada = new Cita { MascotaId = mascota.Id, FechaHora = DateTime.Now.AddDays(-1), Estado = "Confirmada" };
            var citaCompletada = new Cita { MascotaId = mascota.Id, FechaHora = DateTime.Now.AddDays(1), Estado = "Completada" };
            await _context.Citas.AddRangeAsync(citaFuturaPendiente, citaFuturaConfirmada, citaPasada, citaCompletada);
            await _context.SaveChangesAsync();

            // Act
            _context.ChangeTracker.Clear();
            await _mascotaService.DeleteMascotaAsync(mascota.Id);

            // Assert
            var deletedMascota = await _context.Mascotas.FindAsync(mascota.Id);
            Assert.IsNotNull(deletedMascota);
            Assert.IsFalse(deletedMascota.Activo);

            var dbCitaPendiente = await _context.Citas.FindAsync(citaFuturaPendiente.Id);
            Assert.IsNotNull(dbCitaPendiente);
            Assert.AreEqual("Cancelada", dbCitaPendiente.Estado);

            var dbCitaConfirmada = await _context.Citas.FindAsync(citaFuturaConfirmada.Id);
            Assert.IsNotNull(dbCitaConfirmada);
            Assert.AreEqual("Cancelada", dbCitaConfirmada.Estado);

            var dbCitaPasada = await _context.Citas.FindAsync(citaPasada.Id);
            Assert.IsNotNull(dbCitaPasada);
            Assert.AreEqual("Confirmada", dbCitaPasada.Estado); // No se cancela porque es pasada

            var dbCitaCompletada = await _context.Citas.FindAsync(citaCompletada.Id);
            Assert.IsNotNull(dbCitaCompletada);
            Assert.AreEqual("Completada", dbCitaCompletada.Estado); // No se cancela porque ya está completada
        }

        [TestMethod]
        public async Task GetActiveUsuariosAsync_DebeRetornarSoloActivosOrdenados()
        {
            // Arrange
            var u1 = new Usuario { Nombre = "Carlos", Email = "carlos@test.com", Rol = "Cliente", Activo = true };
            var u2 = new Usuario { Nombre = "Ana", Email = "ana@test.com", Rol = "Cliente", Activo = true };
            var u3 = new Usuario { Nombre = "Beto", Email = "beto@test.com", Rol = "Cliente", Activo = false };
            await _context.Usuarios.AddRangeAsync(u1, u2, u3);
            await _context.SaveChangesAsync();

            // Act
            var result = (await _mascotaService.GetActiveUsuariosAsync()).ToList();

            // Assert
            Assert.AreEqual(2, result.Count);
            Assert.AreEqual("Ana", result[0].Nombre); // Primero Ana por orden alfabético
            Assert.AreEqual("Carlos", result[1].Nombre); // Luego Carlos
        }
    }
}
