using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class Venta
{
    public int Id { get; set; }

    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Total { get; set; }

    [Required]
    [MaxLength(50)]
    public string MetodoPago { get; set; } = "Efectivo"; // "Efectivo", "Tarjeta", "Transferencia"

    public int? ClienteId { get; set; }

    [ForeignKey("ClienteId")]
    public virtual Usuario? Cliente { get; set; }

    [Required]
    [MaxLength(30)]
    public string Estado { get; set; } = "Completada"; // "Completada", "Cancelada"

    public virtual ICollection<DetalleVenta> Detalles { get; set; } = new List<DetalleVenta>();
}
