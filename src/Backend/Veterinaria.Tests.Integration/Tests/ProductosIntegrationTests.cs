using System.Net;
using System.Net.Http.Json;
using Veterinaria.Domain.Entities;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

/// <summary>
/// Pruebas de integración para el módulo de Productos.
/// Verifica el CRUD completo del endpoint /api/productos
/// contra una base de datos SQL Server real en Docker.
/// </summary>
public class ProductosIntegrationTests : IntegrationTestBase
{
    public ProductosIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task GetProductos_ConAutenticacion_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        await SeedProductoAsync("Vacuna Rabia", 45.00m, 100, "Medicamento");

        // Act
        var response = await Client.GetAsync("/api/productos");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<ProductosListData>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
    }

    [Fact]
    public async Task GetProductos_SinAutenticacion_DebeRetornarUnauthorized()
    {
        // Arrange — no llamamos AuthenticateAsAsync()
        Client.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await Client.GetAsync("/api/productos");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetProductoPorId_CuandoExiste_DebeRetornarProducto()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var producto = await SeedProductoAsync("Desparasitante Oral", 25.50m, 50, "Medicamento");

        // Act
        var response = await Client.GetAsync($"/api/productos/{producto.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<ProductoData>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal("Desparasitante Oral", result.Data!.Nombre);
        Assert.Equal(25.50m, result.Data.Precio);
    }

    [Fact]
    public async Task GetProductoPorId_CuandoNoExiste_DebeRetornarNotFound()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");

        // Act
        var response = await Client.GetAsync("/api/productos/99999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PostProducto_ConDatosValidos_DebeCrearProducto()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var nuevoProducto = new
        {
            Nombre = $"Shampoo Antipulgas {Guid.NewGuid():N}",
            Descripcion = "Shampoo medicado para control de pulgas",
            Precio = 35.00m,
            Stock = 200,
            StockMinimo = 10,
            Categoria = "Accesorio"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/productos", nuevoProducto);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<ProductoData>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.True(result.Data!.Id > 0);
        Assert.Contains("Shampoo Antipulgas", result.Data.Nombre);
        Assert.Equal(35.00m, result.Data.Precio);
    }

    [Fact]
    public async Task PostProducto_ConDatosInvalidos_DebeRetornarBadRequest()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var productoInvalido = new
        {
            Nombre = "", // Nombre vacío — inválido
            Precio = -10m, // Precio negativo — inválido
            Stock = 0,
            Categoria = "" // Categoría vacía — inválido
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/productos", productoInvalido);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PutProducto_ConDatosValidos_DebeActualizarProducto()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var producto = await SeedProductoAsync("Collar Original", 15.00m, 30, "Accesorio");

        var productoEditado = new
        {
            Id = producto.Id,
            Nombre = "Collar Antipulgas Premium",
            Descripcion = "Collar con tratamiento antipulgas de larga duración",
            Precio = 28.50m,
            Stock = 30,
            StockMinimo = 5,
            Categoria = "Accesorio",
            Activo = true
        };

        // Act
        var response = await Client.PutAsJsonAsync($"/api/productos/{producto.Id}", productoEditado);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verificar que los datos se actualizaron en la BD
        var getResponse = await Client.GetAsync($"/api/productos/{producto.Id}");
        var result = await getResponse.Content.ReadFromJsonAsync<ApiResponse<ProductoData>>();
        Assert.Equal("Collar Antipulgas Premium", result!.Data!.Nombre);
        Assert.Equal(28.50m, result.Data.Precio);
    }

    [Fact]
    public async Task DeleteProducto_CuandoExiste_DebeEliminarProducto()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var producto = await SeedProductoAsync("Producto a Eliminar", 10.00m, 5, "General");

        // Act
        var response = await Client.DeleteAsync($"/api/productos/{producto.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verificar que ya no se encuentra (eliminación lógica)
        var getResponse = await Client.GetAsync($"/api/productos/{producto.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task GetProductosBajoStock_DebeRetornarProductosConStockBajo()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        // Crear producto con stock por debajo del mínimo
        await SeedProductoAsync("Antibiótico Escaso", 60.00m, stock: 2, categoria: "Medicamento", stockMinimo: 10);

        // Act
        var response = await Client.GetAsync("/api/productos/bajo-stock");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ──────────────────────────────────────────────
    // Helpers para insertar datos de test
    // ──────────────────────────────────────────────

    private async Task<Producto> SeedProductoAsync(
        string nombre, decimal precio, int stock, string categoria, int stockMinimo = 5)
    {
        await using var context = GetDbContext();
        var producto = new Producto
        {
            Nombre = nombre,
            Precio = precio,
            Stock = stock,
            StockMinimo = stockMinimo,
            Categoria = categoria,
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };
        context.Productos.Add(producto);
        await context.SaveChangesAsync();
        return producto;
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

    private sealed class ProductoData
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public decimal Precio { get; set; }
        public int Stock { get; set; }
        public int StockMinimo { get; set; }
        public string Categoria { get; set; } = string.Empty;
        public bool Activo { get; set; }
    }

    private sealed class ProductosListData
    {
        public List<ProductoData> Data { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
}
