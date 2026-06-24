using System.Net;
using System.Net.Http.Json;
using Veterinaria.Domain.Entities;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class PortalClienteIntegrationTests : IntegrationTestBase
{
    public PortalClienteIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task GetDashboard_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");

        // Act
        var response = await Client.GetAsync("/api/PortalCliente/Dashboard");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetMisMascotas_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");

        // Act
        var response = await Client.GetAsync("/api/PortalCliente/Mascotas");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task RegistrarMascota_ConDatosValidos_DebeCrearMascota()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");
        var request = new
        {
            Nombre = "Fido Portal",
            Especie = "Perro"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/PortalCliente/Mascotas", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetHistorialMascota_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");
        int clientUserId;
        await using (var context = GetDbContext())
        {
            clientUserId = context.Usuarios.OrderByDescending(u => u.Id).First().Id;
        }
        var mascota = await SeedMascotaAsync(clientUserId, "Mascota Portal");

        // Act
        var response = await Client.GetAsync($"/api/PortalCliente/Mascotas/{mascota.Id}/Historial");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetMisCitas_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");

        // Act
        var response = await Client.GetAsync("/api/PortalCliente/Citas");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task SolicitarCita_ConDatosValidos_DebeRegistrarCita()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");
        int clientUserId;
        await using (var context = GetDbContext())
        {
            clientUserId = context.Usuarios.OrderByDescending(u => u.Id).First().Id;
        }
        var mascota = await SeedMascotaAsync(clientUserId);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var targetDate = DateTime.Today.AddDays(2).AddHours(10);

        var request = new
        {
            MascotaId = mascota.Id,
            ServicioId = servicio.Id,
            VeterinarioId = vet.Id,
            FechaHora = targetDate,
            Motivo = "Consulta de control portal"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/PortalCliente/Citas", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CancelarCita_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");
        int clientUserId;
        await using (var context = GetDbContext())
        {
            clientUserId = context.Usuarios.OrderByDescending(u => u.Id).First().Id;
        }
        var mascota = await SeedMascotaAsync(clientUserId);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(2).AddHours(10);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, "Confirmada");

        // Act
        var response = await Client.PutAsync($"/api/PortalCliente/Citas/{cita.Id}/Cancelar", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetMisPagos_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");

        // Act
        var response = await Client.GetAsync("/api/PortalCliente/Pagos");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetMiPerfil_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");

        // Act
        var response = await Client.GetAsync("/api/PortalCliente/Perfil");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ActualizarPerfil_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");
        var request = new
        {
            Telefono = "999888777",
            Direccion = "Dirección de portal"
        };

        // Act
        var response = await Client.PutAsJsonAsync("/api/PortalCliente/Perfil", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
