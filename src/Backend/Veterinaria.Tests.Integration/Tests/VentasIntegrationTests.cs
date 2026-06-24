using System.Net;
using System.Net.Http.Json;
using Veterinaria.Domain.Entities;
using Veterinaria.Tests.Integration.Fixtures;

namespace Veterinaria.Tests.Integration.Tests;

public class VentasIntegrationTests : IntegrationTestBase
{
    public VentasIntegrationTests(VeterinariaWebApplicationFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task Index_DebeRetornarOkYListaVentas()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var prod = await SeedProductoAsync("Shampoo Gato", 15.00m, 10);
        await SeedVentaAsync(prod.Id, 2, 15.00m);

        // Act
        var response = await Client.GetAsync("/api/ventas");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Details_CuandoExiste_DebeRetornarOk()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var prod = await SeedProductoAsync("Juguete Ratón", 5.00m, 20);
        var venta = await SeedVentaAsync(prod.Id, 1, 5.00m);

        // Act
        var response = await Client.GetAsync($"/api/ventas/{venta.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Create_ConDatosValidos_DebeCrearVentaYReducirStock()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var clientUser = await SeedUsuarioAsync();
        var prod = await SeedProductoAsync("Comida Canina", 20.00m, 50);

        var request = new
        {
            MetodoPago = "Tarjeta",
            ClienteId = clientUser.Id,
            Estado = "Completada",
            Detalles = new[]
            {
                new { ProductoId = prod.Id, Cantidad = 5, PrecioUnitario = 20.00m }
            }
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/ventas", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verificar stock reducido en BD
        await using var context = GetDbContext();
        var prodDb = context.Productos.First(p => p.Id == prod.Id);
        Assert.Equal(45, prodDb.Stock); // 50 - 5 = 45
    }

    [Fact]
    public async Task Cancel_CuandoExiste_DebeRestablecerStock()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var prod = await SeedProductoAsync("Snacks Gatos", 8.00m, 20); // stock actual en BD es 20 (después de vender 10 del inventario de 30)
        var venta = await SeedVentaAsync(prod.Id, 10, 8.00m);

        // Act
        var response = await Client.PostAsync($"/api/ventas/Cancel/{venta.Id}", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verificar stock restablecido en BD
        await using var context = GetDbContext();
        var prodDb = context.Productos.First(p => p.Id == prod.Id);
        Assert.Equal(30, prodDb.Stock); // 20 + 10 = 30
    }

    [Fact]
    public async Task GetFacturaPdf_DebeRetornarPdf()
    {
        // Arrange
        await AuthenticateAsAsync("Admin");
        var prod = await SeedProductoAsync("Collar de Cuero", 25.00m, 5);
        var venta = await SeedVentaAsync(prod.Id, 1, 25.00m);

        // Act
        var response = await Client.GetAsync($"/api/ventas/Factura/{venta.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType?.MediaType);
    }

    private async Task<Producto> SeedProductoAsync(string nombre, decimal precio, int stock)
    {
        await using var context = GetDbContext();
        var producto = new Producto
        {
            Nombre = nombre,
            Precio = precio,
            Stock = stock,
            StockMinimo = 2,
            Categoria = "General",
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };
        context.Productos.Add(producto);
        await context.SaveChangesAsync();
        return producto;
    }

    private async Task<Venta> SeedVentaAsync(int productoId, int cantidad, decimal precio, int? clienteId = null)
    {
        await using var context = GetDbContext();
        var venta = new Venta
        {
            Fecha = DateTime.UtcNow,
            Total = cantidad * precio,
            MetodoPago = "Efectivo",
            ClienteId = clienteId,
            Estado = "Completada"
        };
        context.Ventas.Add(venta);
        await context.SaveChangesAsync();

        var detalle = new DetalleVenta
        {
            VentaId = venta.Id,
            ProductoId = productoId,
            Cantidad = cantidad,
            PrecioUnitario = precio,
            Subtotal = cantidad * precio
        };
        context.DetallesVentas.Add(detalle);
        await context.SaveChangesAsync();
        return venta;
    }
}
