using System.Net;
using System.Net.Http.Json;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class ClientesIntegrationTests : IntegrationTestBase
{
    public ClientesIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Index_DebeRetornarOkYListaClientes()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        await SeedUsuarioAsync("Cliente Uno", $"c1-{Guid.NewGuid():N}@vetcare.test", "Cliente");

        // Act
        var response = await Client.GetAsync("/api/Clientes?page=1");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<ClientesData>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.True(result.Data.Usuarios.Count > 0);
    }

    [Fact]
    public async Task Details_CuandoExiste_DebeRetornarOkYDetalles()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync("Cliente Dos", $"c2-{Guid.NewGuid():N}@vetcare.test", "Cliente");

        // Act
        var response = await Client.GetAsync($"/api/Clientes/{clientUser.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<ClienteDetailData>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal(clientUser.Nombre, result.Data?.Usuario?.Nombre);
    }

    [Fact]
    public async Task Details_CuandoNoExiste_DebeRetornarNotFound()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");

        // Act
        var response = await Client.GetAsync("/api/Clientes/99999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Create_ConDatosValidos_DebeCrearCliente()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var dni = "DNI" + Guid.NewGuid().ToString("N").Substring(0, 5);
        var email = $"create-cli-{Guid.NewGuid():N}@vetcare.test";
        var request = new
        {
            Nombre = "Cliente Nuevo Creacion",
            Dni = dni,
            Email = email,
            Telefono = "999888123",
            Direccion = "Direccion de Creacion",
            Password = "TestP@ss1"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/Clientes", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<object>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
    }

    [Fact]
    public async Task Create_ConDatosInvalidos_DebeRetornarBadRequest()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var request = new
        {
            Nombre = "", // vacio
            Email = "invalid-email"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/Clientes", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Edit_ConDatosValidos_DebeActualizarCliente()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync("Cliente A Editar", $"c-edit-{Guid.NewGuid():N}@vetcare.test", "Cliente");
        var request = new
        {
            Id = clientUser.Id,
            Nombre = "Cliente Editado Exitoso",
            Dni = "DNI" + Guid.NewGuid().ToString("N").Substring(0, 5),
            Email = $"edited-{Guid.NewGuid():N}@vetcare.test",
            Telefono = "999444555",
            Direccion = "Direccion Editada",
            Activo = true
        };

        // Act
        var response = await Client.PutAsJsonAsync($"/api/Clientes/{clientUser.Id}", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CheckDuplicates_DebeRetornarOkConDuplicados()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var dni = "DNI" + Guid.NewGuid().ToString("N").Substring(0, 5);
        var email = $"dup-{Guid.NewGuid():N}@vetcare.test";
        var client = await SeedUsuarioAsync("Cliente Duplicado", email, "Cliente");
        // Update DNI directly in DB since SeedUsuario doesn't have DNI
        await using (var context = GetDbContext())
        {
            var dbUser = context.Usuarios.First(u => u.Id == client.Id);
            dbUser.DNI = dni;
            await context.SaveChangesAsync();
        }

        // Act
        var response = await Client.GetAsync($"/api/Clientes/check-duplicates?dni={dni}&email={email}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<List<DuplicadoDto>>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.NotEmpty(result.Data!);
    }

    [Fact]
    public async Task ToggleActivo_CuandoExiste_DebeCambiarEstado()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync("Cliente Toggle", $"toggle-{Guid.NewGuid():N}@vetcare.test", "Cliente");

        // Act
        var response = await Client.PostAsync($"/api/Clientes/ToggleActivo/{clientUser.Id}", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Delete_CuandoExiste_DebeEliminarCliente()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync("Cliente A Eliminar", $"del-{Guid.NewGuid():N}@vetcare.test", "Cliente");

        // Act
        var response = await Client.DeleteAsync($"/api/Clientes/{clientUser.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // DTOs internos
    private sealed class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
    }

    private sealed class ClientesData
    {
        public List<UsuarioDto> Usuarios { get; set; } = new();
        public int TotalItems { get; set; }
        public int Page { get; set; }
    }

    private sealed class ClienteDetailData
    {
        public UsuarioDto? Usuario { get; set; }
    }

    private sealed class UsuarioDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public bool Activo { get; set; }
    }

    private sealed class DuplicadoDto
    {
        public string Campo { get; set; } = string.Empty;
        public string Valor { get; set; } = string.Empty;
    }
}
