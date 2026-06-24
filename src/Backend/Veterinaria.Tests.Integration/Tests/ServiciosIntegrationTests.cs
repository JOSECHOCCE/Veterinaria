using System.Net;
using System.Net.Http.Json;
using Veterinaria.Domain.Entities;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

/// <summary>
/// Pruebas de integración para el módulo de Servicios.
/// Verifica el CRUD completo del endpoint /api/servicios
/// contra una base de datos SQL Server real en Docker.
/// </summary>
public class ServiciosIntegrationTests : IntegrationTestBase
{
    public ServiciosIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task GetServicios_ConAutenticacion_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        await SeedServicioAsync($"Consulta General {Guid.NewGuid():N}", 50.00m, 30);

        // Act
        var response = await Client.GetAsync("/api/servicios");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<ServiciosListData>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
    }

    [Fact]
    public async Task GetServicios_SinAutenticacion_DebeRetornarOk()
    {
        // Arrange — El endpoint de servicios es AllowAnonymous para que clientes vean el catálogo
        Client.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await Client.GetAsync("/api/servicios");

        // Assert
        // AllowAnonymous: los clientes pueden ver la lista de servicios
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetServicioDetalle_CuandoExiste_DebeRetornarServicio()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var servicio = await SeedServicioAsync($"Vacunación Canina {Guid.NewGuid():N}", 80.00m, 45);

        // Act
        var response = await Client.GetAsync($"/api/servicios/{servicio.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<ServicioDetailData>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
    }

    [Fact]
    public async Task GetServicioDetalle_CuandoNoExiste_DebeRetornarNotFound()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");

        // Act
        var response = await Client.GetAsync("/api/servicios/99999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PostServicio_ConDatosValidos_DebeCrearServicio()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var nuevoServicio = new
        {
            Nombre = $"Cirugía Menor {Guid.NewGuid():N}",
            Descripcion = "Procedimientos quirúrgicos menores",
            DuracionMinutos = 120,
            Precio = 350.00m,
            RequiereVeterinario = true,
            EspecialidadRequerida = "Cirugía"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/servicios", nuevoServicio);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<object>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
    }

    [Fact]
    public async Task PostServicio_ConNombreDuplicado_DebeRetornarError()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var nombreUnico = $"Servicio Único {Guid.NewGuid():N}";
        await SeedServicioAsync(nombreUnico, 100.00m, 30);

        var servicioDuplicado = new
        {
            Nombre = nombreUnico, // Mismo nombre — el índice único lo impide
            Descripcion = "Duplicado",
            DuracionMinutos = 30,
            Precio = 100.00m,
            RequiereVeterinario = true
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/servicios", servicioDuplicado);

        // Assert
        // Debe fallar porque el nombre del servicio tiene índice único en la BD
        Assert.NotEqual(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task PostServicio_ConDatosInvalidos_DebeRetornarBadRequest()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var servicioInvalido = new
        {
            Nombre = "", // Nombre vacío — inválido
            DuracionMinutos = 5, // Menor a 15 — fuera de rango
            Precio = -10m // Precio negativo — inválido
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/servicios", servicioInvalido);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostServicio_SinRolAdmin_DebeRetornarForbidden()
    {
        // Arrange — autenticarse como Recepcionista (no Admin)
        await AuthenticateAsAsync("Recepcionista");
        var servicio = new
        {
            Nombre = $"Servicio Prohibido {Guid.NewGuid():N}",
            DuracionMinutos = 30,
            Precio = 50.00m
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/servicios", servicio);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task DeleteServicio_CuandoExiste_DebeDesactivarServicio()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var servicio = await SeedServicioAsync($"Servicio a Eliminar {Guid.NewGuid():N}", 20.00m, 15);

        // Act
        var response = await Client.DeleteAsync($"/api/servicios/{servicio.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ──────────────────────────────────────────────
    // Helpers para insertar datos de test
    // ──────────────────────────────────────────────

    private async Task<Servicio> SeedServicioAsync(string nombre, decimal precio, int duracion)
    {
        await using var context = GetDbContext();
        var servicio = new Servicio
        {
            Nombre = nombre,
            Descripcion = $"Descripción de {nombre}",
            Precio = precio,
            DuracionMinutos = duracion,
            RequiereVeterinario = true,
            Activo = true
        };
        context.Servicios.Add(servicio);
        await context.SaveChangesAsync();
        return servicio;
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

    private sealed class ServiciosListData
    {
        public List<ServicioData> Servicios { get; set; } = new();
    }

    private sealed class ServicioDetailData
    {
        public ServicioData? Servicio { get; set; }
        public int TotalCitas { get; set; }
        public int CitasCompletadas { get; set; }
    }

    private sealed class ServicioData
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public int DuracionMinutos { get; set; }
        public decimal Precio { get; set; }
        public bool RequiereVeterinario { get; set; }
        public string? EspecialidadRequerida { get; set; }
        public bool Activo { get; set; }
    }
}
