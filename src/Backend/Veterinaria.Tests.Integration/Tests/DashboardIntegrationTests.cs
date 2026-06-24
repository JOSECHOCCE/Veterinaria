using System.Net;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class DashboardIntegrationTests : IntegrationTestBase
{
    public DashboardIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Index_DebeRetornarOkConMetricas()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddHours(10); // Cita hoy
        await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, "Confirmada");

        // Act
        var response = await Client.GetAsync("/api/Dashboard");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
