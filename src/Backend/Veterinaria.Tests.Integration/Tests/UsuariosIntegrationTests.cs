using System.Net;
using System.Net.Http.Json;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class UsuariosIntegrationTests : IntegrationTestBase
{
    public UsuariosIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task GetUsuarios_ConRolAdmin_DebeRetornarOkYLista()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");

        // Act
        var response = await Client.GetAsync("/api/Usuarios");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CrearUsuario_ConDatosValidos_DebeCrearUsuario()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var request = new
        {
            Nombre = "Usuario Creado Por Admin",
            Email = $"admin-created-{Guid.NewGuid():N}@vetcare.test",
            Password = "TestP@ss1",
            DNI = "DNI" + Guid.NewGuid().ToString("N").Substring(0, 5),
            Telefono = "999333444",
            Direccion = "Direccion Admin",
            Rol = "Recepcionista"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/Usuarios", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task EditarUsuario_ConDatosValidos_DebeEditarUsuario()
    {
        // Arrange
        // Primero nos autenticamos como Cliente para que se cree ese usuario completo en la BD
        await AuthenticateAsAsync("Cliente");
        int clientUserId;
        await using (var context = GetDbContext())
        {
            clientUserId = context.Usuarios.OrderByDescending(u => u.Id).First().Id;
        }

        // Ahora nos autenticamos como Admin para poder editar
        await AuthenticateAsAsync("Admin");

        var request = new
        {
            Nombre = "Cliente Modificado Por Admin",
            DNI = "DNI" + Guid.NewGuid().ToString("N").Substring(0, 5),
            Telefono = "999777888",
            Direccion = "Direccion Modificada",
            Rol = "Cliente"
        };

        // Act
        var response = await Client.PutAsJsonAsync($"/api/Usuarios/{clientUserId}", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CambiarEstado_DebeActualizarEstado()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");
        int clientUserId;
        await using (var context = GetDbContext())
        {
            clientUserId = context.Usuarios.OrderByDescending(u => u.Id).First().Id;
        }

        await AuthenticateAsAsync("Admin");

        var request = new { Activo = false };

        // Act
        var response = await Client.PutAsJsonAsync($"/api/Usuarios/{clientUserId}/estado", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task EliminarUsuario_DebeBorrarUsuario()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");
        int clientUserId;
        await using (var context = GetDbContext())
        {
            clientUserId = context.Usuarios.OrderByDescending(u => u.Id).First().Id;
        }

        await AuthenticateAsAsync("Admin");

        // Act
        var response = await Client.DeleteAsync($"/api/Usuarios/{clientUserId}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
