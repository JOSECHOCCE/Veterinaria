using System.Net;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class HomeIntegrationTests : IntegrationTestBase
{
    public HomeIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Index_DebeRetornarOkConMensaje()
    {
        // Act
        var response = await Client.GetAsync("/api/Home");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Servicios_DebeRetornarOkConServiciosActivos()
    {
        // Arrange
        await SeedServicioAsync("Servicio Publico");

        // Act
        var response = await Client.GetAsync("/api/Home/servicios");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Veterinarios_DebeRetornarOkConVeterinariosActivos()
    {
        // Arrange
        await SeedVeterinarioAsync("Dr. Publico", "General");

        // Act
        var response = await Client.GetAsync("/api/Home/veterinarios");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Privacy_DebeRetornarOk()
    {
        // Act
        var response = await Client.GetAsync("/api/Home/privacy");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Error_DebeRetornarBadRequest()
    {
        // Act
        var response = await Client.GetAsync("/api/Home/error");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
