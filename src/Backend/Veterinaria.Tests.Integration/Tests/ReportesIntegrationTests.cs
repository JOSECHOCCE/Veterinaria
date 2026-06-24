using System.Net;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class ReportesIntegrationTests : IntegrationTestBase
{
    public ReportesIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task GetReporteCitas_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var inicio = DateTime.Today.AddDays(-7).ToString("yyyy-MM-dd");
        var fin = DateTime.Today.AddDays(7).ToString("yyyy-MM-dd");

        // Act
        var response = await Client.GetAsync($"/api/Reportes/Citas?fechaInicio={inicio}&fechaFin={fin}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ExportarReporteCitas_ComoCsv_DebeRetornarCsv()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var inicio = DateTime.Today.AddDays(-7).ToString("yyyy-MM-dd");
        var fin = DateTime.Today.AddDays(7).ToString("yyyy-MM-dd");

        // Act
        var response = await Client.GetAsync($"/api/Reportes/Citas/Exportar?fechaInicio={inicio}&fechaFin={fin}&formato=csv");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/csv", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task ExportarReporteCitas_ComoPdf_DebeRetornarPdf()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var inicio = DateTime.Today.AddDays(-7).ToString("yyyy-MM-dd");
        var fin = DateTime.Today.AddDays(7).ToString("yyyy-MM-dd");

        // Act
        var response = await Client.GetAsync($"/api/Reportes/Citas/Exportar?fechaInicio={inicio}&fechaFin={fin}&formato=pdf");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task GetReporteIngresos_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var inicio = DateTime.Today.AddDays(-7).ToString("yyyy-MM-dd");
        var fin = DateTime.Today.AddDays(7).ToString("yyyy-MM-dd");

        // Act
        var response = await Client.GetAsync($"/api/Reportes/Ingresos?fechaInicio={inicio}&fechaFin={fin}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ExportarReporteIngresos_ComoCsv_DebeRetornarCsv()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var inicio = DateTime.Today.AddDays(-7).ToString("yyyy-MM-dd");
        var fin = DateTime.Today.AddDays(7).ToString("yyyy-MM-dd");

        // Act
        var response = await Client.GetAsync($"/api/Reportes/Ingresos/Exportar?fechaInicio={inicio}&fechaFin={fin}&formato=csv");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/csv", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task ExportarReporteIngresos_ComoPdf_DebeRetornarPdf()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var inicio = DateTime.Today.AddDays(-7).ToString("yyyy-MM-dd");
        var fin = DateTime.Today.AddDays(7).ToString("yyyy-MM-dd");

        // Act
        var response = await Client.GetAsync($"/api/Reportes/Ingresos/Exportar?fechaInicio={inicio}&fechaFin={fin}&formato=pdf");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task GetReporteNuevosClientes_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var inicio = DateTime.Today.AddDays(-7).ToString("yyyy-MM-dd");
        var fin = DateTime.Today.AddDays(7).ToString("yyyy-MM-dd");

        // Act
        var response = await Client.GetAsync($"/api/Reportes/NuevosClientes?fechaInicio={inicio}&fechaFin={fin}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
