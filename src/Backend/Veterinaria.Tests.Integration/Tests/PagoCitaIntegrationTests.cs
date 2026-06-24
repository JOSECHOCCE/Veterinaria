using System.Net;
using System.Net.Http.Json;
using Veterinaria.Domain.Entities;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class PagoCitaIntegrationTests : IntegrationTestBase
{
    public PagoCitaIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Pagar_CuandoExisteCitaPendiente_DebeRetornarOkConModelo()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, DateTime.UtcNow.AddDays(1), "Confirmada");

        // Act
        var response = await Client.GetAsync($"/api/PagoCita/Pagar/{cita.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ProcesarPago_ConDatosValidos_DebeProcesarPago()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync(precio: 100.00m);
        // Debe estar Completada para permitir el pago
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, DateTime.UtcNow.AddDays(-1), "Completada", "Pendiente");

        var request = new
        {
            CitaId = cita.Id,
            NumeroTarjeta = "1234567812345678",
            NombreTitular = "Juan Perez",
            FechaVencimiento = "12/35", // fecha en el futuro
            CVV = "123",
            TipoPago = "Completo",
            MontoTotal = 100.00m,
            MontoPagar = 100.00m,
            GuardarTarjeta = false
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/PagoCita/ProcesarPago", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Confirmacion_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, DateTime.UtcNow.AddDays(-1), "Completada");
        var pago = await SeedPagoAsync(cita.Id, 100.00m);

        // Act
        var response = await Client.GetAsync($"/api/PagoCita/Confirmacion/{cita.Id}/{pago.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CompletarPago_CuandoCitaEsParcial_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        // Cita Completada en estado Parcial de pago
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, DateTime.UtcNow.AddDays(-1), "Completada", "Parcial");

        // Act
        var response = await Client.GetAsync($"/api/PagoCita/CompletarPago/{cita.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ProcesarPagoRestante_ConDatosValidos_DebeLiquidarCita()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, DateTime.UtcNow.AddDays(-1), "Completada", "Parcial");

        var request = new
        {
            CitaId = cita.Id,
            MetodoPago = "Tarjeta",
            NumeroTarjeta = "1234567812345678",
            NombreTarjeta = "Juan Perez",
            FechaVencimiento = "12/35",
            CVV = "123",
            MontoRestante = 50.00m
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/PagoCita/ProcesarPagoRestante", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task VoucherPagoEfectivo_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, DateTime.UtcNow.AddDays(1), "Confirmada");

        // Act
        var response = await Client.GetAsync($"/api/PagoCita/VoucherPagoEfectivo/{cita.Id}?montoRestante=100&referencia=REF-123");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task DescargarComprobante_DebeRetornarOkConPDF()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, DateTime.UtcNow.AddDays(-1), "Completada");
        var pago = await SeedPagoAsync(cita.Id, 100.00m);

        // Act
        var response = await Client.GetAsync($"/api/PagoCita/DescargarComprobante/{pago.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task DescargarFicha_DebeRetornarOkConPDF()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var vet = await SeedVeterinarioAsync();
        var servicio = await SeedServicioAsync();
        var cita = await SeedCitaAsync(mascota.Id, vet.Id, servicio.Id, DateTime.UtcNow.AddDays(1), "Confirmada");

        // Act
        var response = await Client.GetAsync($"/api/PagoCita/DescargarFicha/{cita.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<Pago> SeedPagoAsync(int citaId, decimal monto)
    {
        await using var context = GetDbContext();
        var pago = new Pago
        {
            CitaId = citaId,
            Monto = monto,
            MetodoPago = "Tarjeta",
            TipoPago = "Completo",
            Referencia = $"REF-{Guid.NewGuid():N}".Substring(0, 15),
            FechaPago = DateTime.UtcNow
        };
        context.Pagos.Add(pago);
        await context.SaveChangesAsync();
        return pago;
    }
}
