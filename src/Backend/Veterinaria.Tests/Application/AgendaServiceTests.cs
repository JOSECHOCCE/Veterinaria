using System;
using System.Collections.Generic;
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
public class AgendaServiceTests
{
    private VeterinariaDbContext _context = null!;
    private UnitOfWork _unitOfWork = null!;
    private Mock<IAuditoriaService> _auditoriaServiceMock = null!;
    private AgendaService _sut = null!;

    [TestInitialize]
    public void Initialize()
    {
        var options = new DbContextOptionsBuilder<VeterinariaDbContext>()
            .UseInMemoryDatabase(databaseName: "VetCareTestDb_Agenda_" + Guid.NewGuid().ToString(), inMemoryOptionsAction: b => b.EnableNullChecks(false))
            .Options;

        _context = new TestVeterinariaDbContext(options);
        _unitOfWork = new UnitOfWork(_context);
        _auditoriaServiceMock = new Mock<IAuditoriaService>();

        _sut = new AgendaService(_unitOfWork, _auditoriaServiceMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _unitOfWork.Dispose();
    }

    [TestMethod]
    public async Task GetHorariosClinicaAsync_CuandoVacio_DebeInicializarPorDefecto()
    {
        // Act
        var result = await _sut.GetHorariosClinicaAsync();

        // Assert
        Assert.AreEqual(7, result.Count());
        var dom = result.First(h => h.DiaSemana == 0);
        Assert.IsFalse(dom.EsLaborable);
        var lun = result.First(h => h.DiaSemana == 1);
        Assert.IsTrue(lun.EsLaborable);
    }

    [TestMethod]
    public async Task ActualizarHorarioClinicaAsync_CuandoExiste_DebeActualizarYRegistrarAuditoria()
    {
        // Arrange
        await _sut.GetHorariosClinicaAsync(); // inicializa por defecto
        _context.ChangeTracker.Clear();

        var dto = new ActualizarHorarioClinicaDto
        {
            DiaSemana = 1,
            HoraApertura = new TimeSpan(9, 0, 0),
            HoraCierre = new TimeSpan(17, 0, 0),
            EsLaborable = true
        };

        // Act
        var response = await _sut.ActualizarHorarioClinicaAsync(dto, "user-1");

        // Assert
        Assert.IsTrue(response.Success);
        Assert.AreEqual(new TimeSpan(9, 0, 0), response.Data!.HoraApertura);
        _auditoriaServiceMock.Verify(a => a.RegistrarAccionAsync("Actualizar", "HorarioClinica", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [TestMethod]
    public async Task GetHorariosVeterinarioAsync_CuandoNoExisteVeterinario_DebeRetornarVacio()
    {
        // Act
        var result = await _sut.GetHorariosVeterinarioAsync(999);

        // Assert
        Assert.IsFalse(result.Any());
    }

    [TestMethod]
    public async Task GetHorariosVeterinarioAsync_CuandoExiste_DebeInicializarPorDefecto()
    {
        // Arrange
        var vet = new Veterinario
        {
            Id = 1,
            Nombre = "Dr. House",
            Activo = true,
            HorarioInicio = new TimeSpan(8, 0, 0),
            HorarioFin = new TimeSpan(16, 0, 0)
        };
        await _context.Veterinarios.AddAsync(vet);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var result = await _sut.GetHorariosVeterinarioAsync(1);

        // Assert
        Assert.AreEqual(7, result.Count());
        var lun = result.First(h => h.DiaSemana == 1);
        Assert.AreEqual(new TimeSpan(8, 0, 0), lun.HoraInicio);
        Assert.AreEqual(new TimeSpan(16, 0, 0), lun.HoraFin);
    }

    [TestMethod]
    public async Task ActualizarHorarioVeterinarioAsync_CuandoNoExiste_DebeCrearNuevo()
    {
        // Arrange
        var vet = new Veterinario
        {
            Id = 1,
            Nombre = "Dr. House",
            Activo = true
        };
        await _context.Veterinarios.AddAsync(vet);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        var dto = new ActualizarHorarioVeterinarioDto
        {
            VeterinarioId = 1,
            DiaSemana = 2,
            HoraInicio = new TimeSpan(7, 0, 0),
            HoraFin = new TimeSpan(15, 0, 0),
            EsLaborable = true,
            DescansoInicio = new TimeSpan(12, 0, 0),
            DescansoFin = new TimeSpan(13, 0, 0)
        };

        // Act
        var response = await _sut.ActualizarHorarioVeterinarioAsync(dto, "user-1");

        // Assert
        Assert.IsTrue(response.Success);
        var inDb = await _context.HorariosVeterinario.FirstOrDefaultAsync(h => h.VeterinarioId == 1 && h.DiaSemana == 2);
        Assert.IsNotNull(inDb);
        Assert.AreEqual(new TimeSpan(7, 0, 0), inDb!.HoraInicio);
    }

    [TestMethod]
    public async Task CrearBloqueoAsync_CuandoFechasInvalidas_DebeRetornarError()
    {
        // Arrange
        var dto = new CrearBloqueoAgendaDto
        {
            VeterinarioId = 1,
            FechaInicio = DateTime.Today.AddHours(10),
            FechaFin = DateTime.Today.AddHours(9),
            Motivo = "Reunión"
        };

        // Act
        var response = await _sut.CrearBloqueoAsync(dto, "user-1");

        // Assert
        Assert.IsFalse(response.Success);
        Assert.AreEqual("La fecha de inicio debe ser anterior a la fecha de fin.", response.Message);
    }

    [TestMethod]
    public async Task CrearBloqueoAsync_CuandoValido_DebeGuardarYRegistrarAuditoria()
    {
        // Arrange
        var dto = new CrearBloqueoAgendaDto
        {
            VeterinarioId = 1,
            FechaInicio = DateTime.Today.AddHours(9),
            FechaFin = DateTime.Today.AddHours(10),
            Motivo = "Reunión"
        };

        // Act
        var response = await _sut.CrearBloqueoAsync(dto, "user-1");

        // Assert
        Assert.IsTrue(response.Success);
        var list = await _sut.GetBloqueosAsync(1, DateTime.Today, DateTime.Today.AddDays(1));
        Assert.AreEqual(1, list.Count());
        _auditoriaServiceMock.Verify(a => a.RegistrarAccionAsync("Crear", "BloqueoAgenda", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [TestMethod]
    public async Task EliminarBloqueoAsync_CuandoExiste_DebeRemover()
    {
        // Arrange
        var bloqueo = new BloqueoAgenda
        {
            Id = 10,
            VeterinarioId = 1,
            FechaInicio = DateTime.Today,
            FechaFin = DateTime.Today.AddHours(1),
            Motivo = "Prueba"
        };
        await _context.BloqueosAgenda.AddAsync(bloqueo);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var response = await _sut.EliminarBloqueoAsync(10, "user-1");

        // Assert
        Assert.IsTrue(response.Success);
        var inDb = await _context.BloqueosAgenda.FindAsync(10);
        Assert.IsNull(inDb);
    }
}

public class TestVeterinariaDbContext : VeterinariaDbContext
{
    public TestVeterinariaDbContext(DbContextOptions<VeterinariaDbContext> options) : base(options)
    {
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        FixState();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        FixState();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void FixState()
    {
        foreach (var entry in ChangeTracker.Entries<HorarioVeterinario>())
        {
            if (entry.State == EntityState.Modified)
            {
                var exists = HorariosVeterinario.AsNoTracking().Any(h => h.Id == entry.Entity.Id);
                if (!exists)
                {
                    entry.State = EntityState.Added;
                }
            }
        }
    }
}
