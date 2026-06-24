using System.Net;
using System.Net.Http.Json;
using Veterinaria.Domain.Entities;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

/// <summary>
/// Pruebas de integración para el módulo de Mascotas.
/// Verifica operaciones CRUD del endpoint /api/mascotas
/// contra una base de datos SQL Server real en Docker.
/// </summary>
public class MascotasIntegrationTests : IntegrationTestBase
{
    public MascotasIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task GetMascotas_ConAutenticacion_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");

        // Act
        var response = await Client.GetAsync("/api/mascotas");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<MascotasListData>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
    }

    [Fact]
    public async Task GetMascotas_SinAutenticacion_DebeRetornarUnauthorized()
    {
        // Arrange
        Client.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await Client.GetAsync("/api/mascotas");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetMascotaDetalle_CuandoExiste_DebeRetornarMascota()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var usuario = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(usuario.Id, "Firulais", "Perro", "Labrador");

        // Act
        var response = await Client.GetAsync($"/api/mascotas/{mascota.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<MascotaDetailData>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal("Firulais", result.Data!.Mascota!.Nombre);
        Assert.Equal("Perro", result.Data.Mascota.Especie);
    }

    [Fact]
    public async Task GetMascotaDetalle_CuandoNoExiste_DebeRetornarNotFound()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");

        // Act
        var response = await Client.GetAsync("/api/mascotas/99999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PostMascota_ConDatosValidos_DebeCrearMascota()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var usuario = await SeedUsuarioAsync();

        var nuevaMascota = new
        {
            Nombre = "Luna",
            Especie = "Gato",
            Raza = "Siamés",
            FechaNacimiento = DateTime.UtcNow.AddYears(-2),
            Peso = 4.5m,
            Color = "Blanco",
            Sexo = "Hembra",
            UsuarioId = usuario.Id,
            ObservacionesGenerales = "Gata tranquila",
            AlergiasConocidas = "Ninguna"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/mascotas", nuevaMascota);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<MascotaData>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
    }

    [Fact]
    public async Task PostMascota_ConDatosInvalidos_DebeRetornarBadRequest()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var mascotaInvalida = new
        {
            Nombre = "", // Nombre vacío — inválido
            Especie = "", // Especie vacía — inválido
            UsuarioId = 0  // Sin usuario
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/mascotas", mascotaInvalida);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task DeleteMascota_CuandoExiste_DebeEliminarMascota()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var usuario = await SeedUsuarioAsync();
        var mascota = await SeedMascotaAsync(usuario.Id, "Rex a Eliminar", "Perro");

        // Act
        var response = await Client.DeleteAsync($"/api/mascotas/{mascota.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task DeleteMascota_CuandoNoExiste_DebeRetornarNotFound()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");

        // Act
        var response = await Client.DeleteAsync("/api/mascotas/99999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ──────────────────────────────────────────────
    // Helpers para insertar datos de test
    // ──────────────────────────────────────────────

    private async Task<Mascota> SeedMascotaAsync(
        int usuarioId, string nombre, string especie, string? raza = null)
    {
        await using var context = GetDbContext();
        var mascota = new Mascota
        {
            Nombre = nombre,
            Especie = especie,
            Raza = raza,
            UsuarioId = usuarioId,
            Activo = true,
            FechaNacimiento = DateTime.UtcNow.AddYears(-3),
            Peso = 10.5m,
            Color = "Negro",
            Sexo = "Macho"
        };
        context.Mascotas.Add(mascota);
        await context.SaveChangesAsync();
        return mascota;
    }

    // ──────────────────────────────────────────────
    // DTOs internos para deserializar respuestas
    // ──────────────────────────────────────────────

    private sealed class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
    }

    private sealed class MascotasListData
    {
        public List<MascotaData> Data { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    private sealed class MascotaDetailData
    {
        public MascotaData? Mascota { get; set; }
    }

    private sealed class MascotaData
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Especie { get; set; } = string.Empty;
        public string? Raza { get; set; }
        public decimal? Peso { get; set; }
        public string? Color { get; set; }
        public string? Sexo { get; set; }
        public int UsuarioId { get; set; }
        public bool Activo { get; set; }
    }
}
