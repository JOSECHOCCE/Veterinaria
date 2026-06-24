using System.Net;
using System.Net.Http.Json;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class ConfiguracionIntegrationTests : IntegrationTestBase
{
    public ConfiguracionIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task GetConfiguracion_DebeRetornarOkConConfiguracion()
    {
        // Act
        var response = await Client.GetAsync("/api/Configuracion");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task UpdateConfiguracion_ConRolAdmin_DebeActualizarYRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var request = new
        {
            HoraApertura = "08:30",
            HoraCierre = "18:30",
            DiasHabiles = new[] { 1, 2, 3, 4, 5 },
            TiempoToleranciaMinutos = 20,
            AnticipacionCancelacionHoras = 3
        };

        // Act
        var response = await Client.PutAsJsonAsync("/api/Configuracion", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
