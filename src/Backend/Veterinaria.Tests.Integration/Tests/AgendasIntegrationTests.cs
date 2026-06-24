using System.Net;
using System.Net.Http.Json;
using Veterinaria.Domain.Entities;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class AgendasIntegrationTests : IntegrationTestBase
{
    public AgendasIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task GetHorariosClinica_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");

        // Act
        var response = await Client.GetAsync("/api/Agendas/HorarioClinica");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task UpdateHorarioClinica_ConDatosValidos_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var request = new
        {
            DiaSemana = 1, // Lunes
            HoraApertura = "08:00:00",
            HoraCierre = "19:00:00",
            EsLaborable = true
        };

        // Act
        var response = await Client.PutAsJsonAsync("/api/Agendas/HorarioClinica", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetHorariosVet_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var vet = await SeedVeterinarioAsync();

        // Act
        var response = await Client.GetAsync($"/api/Agendas/HorarioVeterinario/{vet.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task UpdateHorarioVet_ConDatosValidos_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var vet = await SeedVeterinarioAsync();
        var request = new
        {
            VeterinarioId = vet.Id,
            DiaSemana = 2, // Martes
            HoraInicio = "08:00:00",
            HoraFin = "18:00:00",
            EsLaborable = true
        };

        // Act
        var response = await Client.PutAsJsonAsync("/api/Agendas/HorarioVeterinario", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetBloqueos_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var vet = await SeedVeterinarioAsync();
        var desde = DateTime.Today.ToString("yyyy-MM-dd");
        var hasta = DateTime.Today.AddDays(7).ToString("yyyy-MM-dd");

        // Act
        var response = await Client.GetAsync($"/api/Agendas/Bloqueos/{vet.Id}?desde={desde}&hasta={hasta}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CreateBloqueo_ConDatosValidos_DebeCrearBloqueo()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var vet = await SeedVeterinarioAsync();
        var request = new
        {
            VeterinarioId = vet.Id,
            FechaInicio = DateTime.Today.AddDays(1).AddHours(8),
            FechaFin = DateTime.Today.AddDays(1).AddHours(12),
            Motivo = "Vacaciones médicas"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/Agendas/Bloqueos", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task DeleteBloqueo_CuandoExiste_DebeRemoverBloqueo()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var vet = await SeedVeterinarioAsync();
        var start = DateTime.Today.AddDays(1).AddHours(8);
        var end = DateTime.Today.AddDays(1).AddHours(12);
        var bloqueo = await SeedBloqueoAsync(vet.Id, start, end);

        // Act
        var response = await Client.DeleteAsync($"/api/Agendas/Bloqueos/{bloqueo.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<BloqueoAgenda> SeedBloqueoAsync(int vetId, DateTime start, DateTime end, string motivo = "Vacaciones")
    {
        await using var context = GetDbContext();
        var bloqueo = new BloqueoAgenda
        {
            VeterinarioId = vetId,
            FechaInicio = start,
            FechaFin = end,
            Motivo = motivo
        };
        context.BloqueosAgenda.Add(bloqueo);
        await context.SaveChangesAsync();
        return bloqueo;
    }
}
