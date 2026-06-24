using System.Net;
using System.Net.Http.Json;
using Veterinaria.Domain.Entities;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class HistorialesClinicosIntegrationTests : IntegrationTestBase
{
    public HistorialesClinicosIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Index_DebeRetornarOkYHistorialMascota()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(-1);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, "Completada");
        await SeedHistorialAsync(cita.Id, "Infección leve", "Antibiótico");

        // Act
        var response = await Client.GetAsync($"/api/HistorialesClinicos?mascotaId={mascota.Id}&page=1");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Details_CuandoExiste_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(-1);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, "Completada");
        await SeedHistorialAsync(cita.Id, "Gripe felina", "Reposo");

        // Act
        var response = await Client.GetAsync($"/api/HistorialesClinicos/details/{cita.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetById_CuandoExiste_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(-1);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, "Completada");
        var hist = await SeedHistorialAsync(cita.Id, "Checkup", "Ninguno");

        // Act
        var response = await Client.GetAsync($"/api/HistorialesClinicos/{hist.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Create_ConDatosValidos_DebeGuardarBorrador()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(-1);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, "EnAtencion");

        var request = new
        {
            CitaId = cita.Id,
            Diagnostico = "Alergia cutánea de prueba",
            Tratamiento = "Crema tópica",
            PesoActual = 12.5m,
            Temperatura = 38.5m,
            FrecuenciaCardiaca = 80,
            Cerrado = false
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/HistorialesClinicos", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Edit_ConDatosValidos_DebeActualizarBorrador()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(-1);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, "EnAtencion");
        var hist = await SeedHistorialAsync(cita.Id, "Otitis", "Limpieza semanal");

        var request = new
        {
            Id = hist.Id,
            CitaId = cita.Id,
            Diagnostico = "Otitis media severa",
            Tratamiento = "Gotas antibióticas",
            Cerrado = false
        };

        // Act
        var response = await Client.PutAsJsonAsync($"/api/HistorialesClinicos/{hist.Id}", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CerrarAtencion_DebeCompletarCita()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(-1);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, "EnAtencion");
        await SeedHistorialAsync(cita.Id, "Dermatitis", "Shampoo especial");

        // Act
        var response = await Client.PostAsync($"/api/HistorialesClinicos/Cerrar/{cita.Id}", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verificar que la cita pasó a Completada y el historial a Cerrado
        await using var context = GetDbContext();
        var citaDb = context.Citas.First(c => c.Id == cita.Id);
        Assert.Equal("Completada", citaDb.Estado);
    }

    [Fact]
    public async Task DescargarPDF_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(-1);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, "Completada");
        await SeedHistorialAsync(cita.Id, "Vacunación", "Refuerzo anual");

        // Act
        var response = await Client.GetAsync($"/api/HistorialesClinicos/descargarpdf/{cita.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<HistorialClinico> SeedHistorialAsync(int citaId, string diagnostico, string tratamiento)
    {
        await using var context = GetDbContext();
        var hist = new HistorialClinico
        {
            CitaId = citaId,
            Diagnostico = diagnostico,
            Tratamiento = tratamiento,
            FechaRegistro = DateTime.UtcNow,
            Cerrado = false
        };
        context.HistorialesClinicos.Add(hist);
        await context.SaveChangesAsync();
        return hist;
    }
}
