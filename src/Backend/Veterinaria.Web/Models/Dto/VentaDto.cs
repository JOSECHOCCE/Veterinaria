using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Web.Models.Dto;

public class VentaDto
{
    public int Id { get; set; }

    public DateTime Fecha { get; set; }

    public decimal Total { get; set; }

    [Required(ErrorMessage = "El método de pago es obligatorio")]
    [MaxLength(50)]
    public string MetodoPago { get; set; } = "Efectivo"; // "Efectivo", "Tarjeta", "Transferencia"

    public int? ClienteId { get; set; }

    public string? ClienteNombre { get; set; }

    [MaxLength(30)]
    public string Estado { get; set; } = "Completada"; // "Completada", "Cancelada"

    public List<DetalleVentaDto> Detalles { get; set; } = new List<DetalleVentaDto>();
}

public class DetalleVentaDto
{
    public int Id { get; set; }

    public int VentaId { get; set; }

    [Required]
    public int ProductoId { get; set; }

    public string? ProductoNombre { get; set; }

    [Range(1, 999999, ErrorMessage = "La cantidad debe ser mayor a 0")]
    public int Cantidad { get; set; }

    public decimal PrecioUnitario { get; set; }

    public decimal Subtotal { get; set; }
}
