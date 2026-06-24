using System.Net;
using System.Net.Http.Json;
using Veterinaria.Domain.Entities;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class PagosIntegrationTests : IntegrationTestBase
{
    public PagosIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Index_DebeRetornarOkYListaPagos()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(2).AddHours(10);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, "Completada");
        await SeedPagoAsync(cita.Id, 100.00m);

        // Act
        var response = await Client.GetAsync("/api/pagos");

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
        var date = DateTime.Today.AddDays(2).AddHours(10);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, "Completada");
        var pago = await SeedPagoAsync(cita.Id, 100.00m);

        // Act
        var response = await Client.GetAsync($"/api/pagos/Details/{pago.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task DetailsByCita_CuandoExiste_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(2).AddHours(10);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, "Completada");

        // Act
        var response = await Client.GetAsync($"/api/pagos/DetailsByCita?citaId={cita.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Reporte_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");

        // Act
        var response = await Client.GetAsync("/api/pagos/Reporte");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task PendientesPago_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");

        // Act
        var response = await Client.GetAsync("/api/pagos/PendientesPago");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task RegistrarCobro_ConDatosValidos_DebeCrearPago()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(2).AddHours(10);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, "Completada");

        var request = new
        {
            CitaId = cita.Id,
            MontoTotalAjustado = 120.00m,
            MontoAbonado = 120.00m,
            MetodoPago = "Efectivo",
            ReferenciaOpcional = "REF-EFECTIVO",
            Observacion = "Cobro manual"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/pagos/RegistrarCobro", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task AnularPago_DebeActualizarEstado()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var date = DateTime.Today.AddDays(2).AddHours(10);
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, date, "Completada");
        var pago = await SeedPagoAsync(cita.Id, 100.00m);

        var request = new { Motivo = "Error de digitación" };

        // Act
        var response = await Client.PostAsJsonAsync($"/api/pagos/Anular/{pago.Id}", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task MisPagos_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Usuario"); // Rol "Usuario" o "Cliente"

        // Act
        var response = await Client.GetAsync("/api/pagos/mis-pagos");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<Pago> SeedPagoAsync(int citaId, decimal monto, string metodo = "Tarjeta")
    {
        await using var context = GetDbContext();
        var pago = new Pago
        {
            CitaId = citaId,
            Monto = monto,
            MetodoPago = metodo,
            TipoPago = "Completo",
            Referencia = $"REF-{Guid.NewGuid():N}".Substring(0, 15),
            FechaPago = DateTime.UtcNow
        };
        context.Pagos.Add(pago);
        await context.SaveChangesAsync();
        return pago;
    }
}
