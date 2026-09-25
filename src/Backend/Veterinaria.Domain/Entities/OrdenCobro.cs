using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class OrdenCobro
{
    public int Id { get; set; }

    public int? CitaId { get; set; }

    [ForeignKey("CitaId")]
    public virtual Cita? Cita { get; set; }

    public int ClienteId { get; set; }

    [ForeignKey("ClienteId")]
    public virtual Usuario Cliente { get; set; } = default!;

    public int? MascotaId { get; set; }

    [ForeignKey("MascotaId")]
    public virtual Mascota? Mascota { get; set; }

    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "decimal(18,2)")]
    public decimal MontoTotal { get; set; }

    [Required]
    [MaxLength(30)]
    public string Estado { get; set; } = "Pendiente"; // "Pendiente", "Pagada", "Anulada"

    [MaxLength(500)]
    public string? Observaciones { get; set; }

    public virtual ICollection<DetalleOrdenCobro> Detalles { get; set; } = new List<DetalleOrdenCobro>();

    public virtual ICollection<Pago> Pagos { get; set; } = new List<Pago>();
}
