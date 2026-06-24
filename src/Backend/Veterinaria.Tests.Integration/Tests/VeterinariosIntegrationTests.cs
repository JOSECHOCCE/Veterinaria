using System.Net;
using System.Net.Http.Json;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class VeterinariosIntegrationTests : IntegrationTestBase
{
    public VeterinariosIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Index_DebeRetornarOkYListaVeterinarios()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        await SeedVeterinarioAsync("Dr. Juan Pérez", "Cirugía");

        // Act
        var response = await Client.GetAsync("/api/Veterinarios");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<VeterinariosData>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.NotEmpty(result.Data.Veterinarios);
    }

    [Fact]
    public async Task Details_CuandoExiste_DebeRetornarOkYDetalle()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var vet = await SeedVeterinarioAsync("Dra. María Gómez", "Fisioterapia");

        // Act
        var response = await Client.GetAsync($"/api/Veterinarios/{vet.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<VeterinarioDetailData>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal("Dra. María Gómez", result.Data?.Veterinario?.Nombre);
    }

    [Fact]
    public async Task Details_CuandoNoExiste_DebeRetornarNotFound()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");

        // Act
        var response = await Client.GetAsync("/api/Veterinarios/99999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Create_ConDatosValidos_DebeCrearVeterinario()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var email = $"vet-create-{Guid.NewGuid():N}@vetcare.test";
        var request = new
        {
            Nombre = "Dr. Carlos Rojas",
            Especialidad = "Dermatología",
            Email = email,
            Telefono = "999222333",
            HorarioInicio = "08:00:00",
            HorarioFin = "17:00:00",
            Activo = true
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/Veterinarios", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Edit_ConDatosValidos_DebeActualizarVeterinario()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var vet = await SeedVeterinarioAsync("Dr. Luis Silva", "Cardiología");
        var request = new
        {
            Id = vet.Id,
            Nombre = "Dr. Luis Silva Editado",
            Especialidad = "Cardiología Avanzada",
            Email = vet.Email,
            Telefono = "999555666",
            HorarioInicio = "09:00:00",
            HorarioFin = "18:00:00",
            Activo = true
        };

        // Act
        var response = await Client.PutAsJsonAsync($"/api/Veterinarios/{vet.Id}", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Delete_CuandoExisteYSinCitas_DebeEliminarVeterinario()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var vet = await SeedVeterinarioAsync("Dr. Temporal", "General");

        // Act
        var response = await Client.DeleteAsync($"/api/Veterinarios/{vet.Id}");

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

    private sealed class VeterinariosData
    {
        public List<VeterinarioConCitasDto> Veterinarios { get; set; } = new();
    }

    private sealed class VeterinarioDetailData
    {
        public VeterinarioDto? Veterinario { get; set; }
    }

    private sealed class VeterinarioConCitasDto
    {
        public VeterinarioDto Veterinario { get; set; } = default!;
        public int CitasEstaSemana { get; set; }
    }

    private sealed class VeterinarioDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Especialidad { get; set; }
        public string? Email { get; set; }
        public string? Telefono { get; set; }
        public bool Activo { get; set; }
    }
}
