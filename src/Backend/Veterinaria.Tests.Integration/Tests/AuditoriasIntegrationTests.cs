using System.Net;
using Veterinaria.Domain.Entities;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class AuditoriasIntegrationTests : IntegrationTestBase
{
    public AuditoriasIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task GetAuditorias_ConRolAdmin_DebeRetornarOkConResultados()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        await SeedAuditoriaAsync("admin@vetcare.test", "Crear Mascota", "Mascota");

        // Act
        var response = await Client.GetAsync("/api/Auditorias?accion=Crear");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<Auditoria> SeedAuditoriaAsync(string email, string accion, string entidad)
    {
        await using var context = GetDbContext();
        var aud = new Auditoria
        {
            UsuarioEmail = email,
            Accion = accion,
            Entidad = entidad,
            EntidadId = "123",
            Detalle = "Acción realizada por pruebas de integración",
            Fecha = DateTime.UtcNow
        };
        context.Auditorias.Add(aud);
        await context.SaveChangesAsync();
        return aud;
    }
}
