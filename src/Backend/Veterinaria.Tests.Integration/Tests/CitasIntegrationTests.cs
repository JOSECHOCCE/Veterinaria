using System.Net;
using System.Net.Http.Json;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class CitasIntegrationTests : IntegrationTestBase
{
    public CitasIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task CalendarioData_DebeRetornarOkYEventos()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(2).AddHours(10);
        await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date);

        var start = DateTime.Today.ToString("yyyy-MM-dd");
        var end = DateTime.Today.AddDays(7).ToString("yyyy-MM-dd");

        // Act
        var response = await Client.GetAsync($"/api/Citas/CalendarioData?start={start}&end={end}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task HorariosDisponibles_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var vet = await SeedVeterinarioAsync();
        var dateStr = DateTime.Today.AddDays(2).ToString("yyyy-MM-dd");

        // Act
        var response = await Client.GetAsync($"/api/Citas/HorariosDisponibles?veterinarioId={vet.Id}&fecha={dateStr}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ValidarDisponibilidad_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var targetDate = DateTime.Today.AddDays(2).AddHours(10);
        var targetDateStr = targetDate.ToString("yyyy-MM-ddTHH:mm");

        // Act
        var response = await Client.GetAsync($"/api/Citas/ValidarDisponibilidad?veterinarioId={vet.Id}&fechaHora={targetDateStr}&servicioId={servicio.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ReservaTemporal_ConDatosValidos_DebeReservar()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var targetDate = DateTime.Today.AddDays(2).AddHours(10);

        var request = new
        {
            FechaHora = targetDate,
            Motivo = "Consulta de Control",
            MascotaId = mascota.Id,
            VeterinarioId = vet.Id,
            ServicioId = servicio.Id,
            Estado = "ReservaTemporal"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/Citas/ReservaTemporal", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CreateCita_ConDatosValidos_DebeCrearCita()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var targetDate = DateTime.Today.AddDays(2).AddHours(11);

        var request = new
        {
            FechaHora = targetDate,
            Motivo = "Consulta Urgente",
            MascotaId = mascota.Id,
            VeterinarioId = vet.Id,
            ServicioId = servicio.Id,
            Estado = "Confirmada"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/Citas", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task EditCita_ConDatosValidos_DebeActualizarCita()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(2).AddHours(10);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date);

        var request = new
        {
            Id = cita.Id,
            FechaHora = date.AddHours(1), // cambiar hora
            Motivo = "Motivo modificado",
            MascotaId = mascota.Id,
            VeterinarioId = vet.Id,
            ServicioId = servicio.Id,
            Estado = "Confirmada"
        };

        // Act
        var response = await Client.PutAsJsonAsync($"/api/Citas/{cita.Id}", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CambiarEstado_DebeModificarEstado()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(2).AddHours(10);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date);

        // Act
        var response = await Client.PostAsync($"/api/Citas/CambiarEstado/{cita.Id}?nuevoEstado=Confirmada", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CancelCita_DebeCancelarCita()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(2).AddHours(10);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, estado: "Confirmada");

        // Act
        var response = await Client.PostAsync($"/api/Citas/Cancel/{cita.Id}", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
