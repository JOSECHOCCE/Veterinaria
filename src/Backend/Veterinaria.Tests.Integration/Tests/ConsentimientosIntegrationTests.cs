using System.Net;
using System.Net.Http.Json;
using Veterinaria.Domain.Entities;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class ConsentimientosIntegrationTests : IntegrationTestBase
{
    public ConsentimientosIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Index_ConRolAdmin_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        await SeedConsentimientoAsync(clientUser.Id, mascota.Id);

        // Act
        var response = await Client.GetAsync("/api/Consentimientos");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CreateTemplate_DebeRetornarOkConTemplate()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");

        // Act
        var response = await Client.GetAsync("/api/Consentimientos/CreateTemplate?mascotaId=1&tipo=Procedimiento");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Create_ConDatosValidos_DebeCrearConsentimiento()
    {
        // Arrange
        // AuthenticateAsAsync creará tanto el IdentityUser como el Usuario de dominio asociado
        await AuthenticateAsAsync("Cliente");
        
        // Obtener el Usuario de dominio creado por el AuthenticateAsAsync
        Usuario dbUser;
        await using (var context = GetDbContext())
        {
            dbUser = context.Usuarios.OrderByDescending(u => u.Id).First();
        }

        var mascota = await SeedMascotaAsync(dbUser.Id);

        var request = new
        {
            MascotaId = mascota.Id,
            TipoConsentimiento = "Anestesia General y Cirugía",
            NombrePropietario = "Propietario Test",
            NombrePaciente = mascota.Nombre,
            DocumentoId = "FRM-2026-TEST",
            Aceptado = true,
            FirmaDigital = "data:image/png;base64,AAAA",
            Usuario = new
            {
                Id = dbUser.Id,
                Nombre = dbUser.Nombre,
                Email = dbUser.Email
            }
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/Consentimientos", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Details_CuandoExiste_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");
        var clientUser = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(clientUser.Id);
        var cons = await SeedConsentimientoAsync(clientUser.Id, mascota.Id);

        // Act
        var response = await Client.GetAsync($"/api/Consentimientos/{cons.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<Consentimiento> SeedConsentimientoAsync(int usuarioId, int mascotaId)
    {
        await using var context = GetDbContext();
        var cons = new Consentimiento
        {
            UsuarioId = usuarioId,
            MascotaId = mascotaId,
            TipoConsentimiento = "Anestesia General y Cirugía",
            NombrePropietario = "Propietario de Test",
            NombrePaciente = "Mascota de Test",
            DocumentoId = "FRM-2026-999",
            Aceptado = true,
            FechaAceptacion = DateTime.UtcNow,
            IpOrigen = "127.0.0.1",
            FechaCreacion = DateTime.UtcNow
        };
        context.Consentimientos.Add(cons);
        await context.SaveChangesAsync();
        return cons;
    }
}
