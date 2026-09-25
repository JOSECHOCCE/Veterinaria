using System;
using System.Collections.Generic;

namespace Veterinaria.Application.DTOs;

public class OrdenCobroDto
{
    public int Id { get; set; }
    public int? CitaId { get; set; }
    public int ClienteId { get; set; }
    public string NombreCliente { get; set; } = default!;
    public int? MascotaId { get; set; }
    public string? NombreMascota { get; set; }
    public DateTime Fecha { get; set; }
    public decimal MontoTotal { get; set; }
    public string Estado { get; set; } = default!;
    public string? Observaciones { get; set; }
    public List<DetalleOrdenCobroDto> Detalles { get; set; } = new();
}

public class DetalleOrdenCobroDto
{
    public int Id { get; set; }
    public string TipoItem { get; set; } = default!;
    public int? ProductoId { get; set; }
    public int? ServicioId { get; set; }
    public string Descripcion { get; set; } = default!;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}
