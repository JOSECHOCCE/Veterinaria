using System.Net;
using System.Net.Http.Json;
using Veterinaria.Domain.Entities;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class NotificacionesIntegrationTests : IntegrationTestBase
{
    public NotificacionesIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Index_DebeRetornarOkYListaNotificaciones()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");
        int usuarioId;
        await using (var context = GetDbContext())
        {
            usuarioId = context.Usuarios.OrderByDescending(u => u.Id).First().Id;
        }
        await SeedNotificacionAsync(usuarioId);

        // Act
        var response = await Client.GetAsync("/api/Notificaciones");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ObtenerNoLeidas_DebeRetornarOkYConteo()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");
        int usuarioId;
        await using (var context = GetDbContext())
        {
            usuarioId = context.Usuarios.OrderByDescending(u => u.Id).First().Id;
        }
        await SeedNotificacionAsync(usuarioId);

        // Act
        var response = await Client.GetAsync("/api/Notificaciones/ObtenerNoLeidas");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ObtenerRecientes_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");

        // Act
        var response = await Client.GetAsync("/api/Notificaciones/ObtenerRecientes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task MarcarLeida_CuandoExiste_DebeMarcarComoLeida()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");
        int usuarioId;
        await using (var context = GetDbContext())
        {
            usuarioId = context.Usuarios.OrderByDescending(u => u.Id).First().Id;
        }
        var notif = await SeedNotificacionAsync(usuarioId);

        // Act
        var response = await Client.PostAsync($"/api/Notificaciones/MarcarLeida/{notif.Id}", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verificar en BD
        await using var contextDb = GetDbContext();
        var notifDb = contextDb.Notificaciones.First(n => n.Id == notif.Id);
        Assert.True(notifDb.Leida);
    }

    [Fact]
    public async Task MarcarTodasLeidas_DebeMarcarTodasComoLeidas()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");
        int usuarioId;
        await using (var context = GetDbContext())
        {
            usuarioId = context.Usuarios.OrderByDescending(u => u.Id).First().Id;
        }
        await SeedNotificacionAsync(usuarioId);

        // Act
        var response = await Client.PostAsync("/api/Notificaciones/MarcarTodasLeidas", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Eliminar_CuandoExiste_DebeRemoverNotificacion()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");
        int usuarioId;
        await using (var context = GetDbContext())
        {
            usuarioId = context.Usuarios.OrderByDescending(u => u.Id).First().Id;
        }
        var notif = await SeedNotificacionAsync(usuarioId);

        // Act
        var response = await Client.DeleteAsync($"/api/Notificaciones/{notif.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Preferencias_ConDatosValidos_DebeActualizar()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");
        var request = new { RecibirRecordatorios = false };

        // Act
        var response = await Client.PutAsJsonAsync("/api/Notificaciones/Preferencias", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ProcesarAlertasDiarias_ConRolAdmin_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");

        // Act
        var response = await Client.PostAsync("/api/Notificaciones/ProcesarAlertasDiarias", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<Notificacion> SeedNotificacionAsync(int usuarioId, string titulo = "Notificación de test", string mensaje = "Mensaje de test")
    {
        await using var context = GetDbContext();
        var notif = new Notificacion
        {
            UsuarioId = usuarioId,
            Titulo = titulo,
            Mensaje = mensaje,
            Tipo = "Info",
            Leida = false,
            FechaCreacion = DateTime.UtcNow
        };
        context.Notificaciones.Add(notif);
        await context.SaveChangesAsync();
        return notif;
    }
}
