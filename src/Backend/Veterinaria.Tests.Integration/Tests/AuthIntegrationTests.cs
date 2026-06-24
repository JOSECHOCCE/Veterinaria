using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Veterinaria.Domain.Entities;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class AuthIntegrationTests : IntegrationTestBase
{
    public AuthIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Login_ConCredencialesValidas_DebeRetornarOkYToken()
    {
        // Arrange
        var email = $"auth-test-{Guid.NewGuid():N}@vetcare.test";
        var password = "TestP@ss1";

        using (var scope = Factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                NombreCompleto = "Auth Test User",
                EmailConfirmed = true,
                FechaRegistro = DateTime.UtcNow
            };
            await userManager.CreateAsync(user, password);
        }

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = email,
            Password = password
        });

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<LoginData>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.NotNull(result.Data?.Token);
    }

    [Fact]
    public async Task Login_ConCredencialesInvalidas_DebeRetornarBadRequest()
    {
        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "no-existe@vetcare.test",
            Password = "WrongPassword"
        });

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Logout_DebeRetornarOk()
    {
        // Act
        var response = await Client.PostAsync("/api/auth/logout", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Me_CuandoEstaAutenticado_DebeRetornarInfoUsuario()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");

        // Act
        var response = await Client.GetAsync("/api/auth/me");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<UserData>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.NotNull(result.Data?.Email);
    }

    [Fact]
    public async Task Me_CuandoNoEstaAutenticado_DebeRetornarUnauthorized()
    {
        // Arrange
        Client.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await Client.GetAsync("/api/auth/me");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Register_ConDatosValidos_DebeCrearUsuario()
    {
        // Arrange
        var newEmail = $"new-register-{Guid.NewGuid():N}@vetcare.test";
        var request = new
        {
            Email = newEmail,
            Password = "TestP@ss1",
            NombreCompleto = "Nuevo Registro",
            Dni = "DNI" + Guid.NewGuid().ToString("N").Substring(0, 5),
            Telefono = "999000111",
            Direccion = "Calle Falsa 123"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<string>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
    }

    [Fact]
    public async Task GetProfile_CuandoEstaAutenticado_DebeRetornarInfoPerfil()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");

        // Act
        var response = await Client.GetAsync("/api/auth/profile");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task UpdateProfile_ConDatosValidos_DebeActualizarPerfil()
    {
        // Arrange
        await AuthenticateAsAsync("Cliente");
        var updateRequest = new
        {
            NombreCompleto = "Nombre Editado",
            Telefono = "987654321",
            Direccion = "Nueva Direccion",
            RecibirRecordatorios = true
        };

        // Act
        var response = await Client.PutAsJsonAsync("/api/auth/profile", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ChangePassword_ConPasswordCorrecto_DebeRetornarOk()
    {
        // Arrange & Act
        // Usamos la contraseña por defecto de AuthenticateAsAsync que es "TestP@ss1"
        await AuthenticateAsAsync("Cliente");
        var changePasswordRequest = new
        {
            CurrentPassword = "TestP@ss1",
            NewPassword = "NewTestP@ss2"
        };

        var response = await Client.PostAsJsonAsync("/api/auth/change-password", changePasswordRequest);

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

    private sealed class LoginData
    {
        public string Token { get; set; } = string.Empty;
    }

    private sealed class UserData
    {
        public string Email { get; set; } = string.Empty;
        public string NombreCompleto { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
