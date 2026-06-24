using System.Net;
using System.Net.Http.Json;
using Veterinaria.Domain.Entities;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class TriageIntegrationTests : IntegrationTestBase
{
    public TriageIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Cola_DebeRetornarOkYListaTriage()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        await SeedTriageAsync(mascota.Id);

        // Act
        var response = await Client.GetAsync("/api/Triage/Cola");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Create_ConDatosValidos_DebeAñadirACola()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);

        var request = new
        {
            MascotaId = mascota.Id,
            Nivel = "N2",
            Sintomas = "Tos persistente",
            MotivoConsulta = "Control de tos",
            Temperatura = 39.1m,
            PesoEstimado = 8.5m
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/Triage", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CambiarEstado_DebeActualizarColaYCita()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(1);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, "Confirmada");
        var triage = await SeedTriageAsync(mascota.Id, cita.Id);

        // Act
        var response = await Client.PostAsync($"/api/Triage/CambiarEstado/{triage.Id}?nuevoEstado=EnAtencion", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verificar cambio de estado de la cita asociada a "EnAtencion" en la BD
        await using var context = GetDbContext();
        var citaDb = context.Citas.First(c => c.Id == cita.Id);
        Assert.Equal("EnAtencion", citaDb.Estado);
    }

    [Fact]
    public async Task Mascotas_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        await SeedMascotaAsync(clientUser.Id);

        // Act
        var response = await Client.GetAsync("/api/Triage/Mascotas");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<Triage> SeedTriageAsync(int mascotaId, int? citaId = null)
    {
        await using var context = GetDbContext();
        var triage = new Triage
        {
            MascotaId = mascotaId,
            CitaId = citaId,
            Nivel = "N2",
            PrioridadColor = "Naranja",
            TiempoEsperaEstimadoMin = 15,
            Consultorio = "Consultorio 1",
            Estado = "EnEspera",
            FechaRegistro = DateTime.UtcNow
        };
        context.Triages.Add(triage);
        await context.SaveChangesAsync();
        return triage;
    }
}
