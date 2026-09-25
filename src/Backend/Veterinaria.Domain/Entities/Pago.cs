using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class Pago
{
    public int Id { get; set; }

    // Foreign Key
    public int CitaId { get; set; }

    public int? OrdenCobroId { get; set; }

    [ForeignKey("OrdenCobroId")]
    public virtual OrdenCobro? OrdenCobro { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Monto { get; set; }

    [MaxLength(50)]
    public string MetodoPago { get; set; } = "Tarjeta"; // "Tarjeta", "Efectivo", "Yape", "Plin", "Mixto"

    [MaxLength(20)]
    public string TipoPago { get; set; } = "Completo"; // "Completo", "Parcial", "Restante"

    [MaxLength(50)]
    public string? Referencia { get; set; } // Número de referencia del pago o voucher

    [MaxLength(20)]
    public string? UltimosDigitosTarjeta { get; set; } // Últimos 4 dígitos de la tarjeta

    [MaxLength(30)]
    public string EstadoVerificacion { get; set; } = "Confirmado"; // "Confirmado", "PendienteVerificacion", "Rechazado"

    [MaxLength(100)]
    public string? ClaveIdempotencia { get; set; }

    public int? CajeroId { get; set; }

    [MaxLength(100)]
    public string? NombreCajero { get; set; }

    public string? DesgloseMetodos { get; set; } // JSON list of sub-payments for mixed payment

    [MaxLength(500)]
    public string? Observacion { get; set; } // Justificación si el monto total varía o notas adicionales

    public DateTime FechaPago { get; set; } = DateTime.Now;

    // Navegación
    public virtual Cita Cita { get; set; } = default!;
}
