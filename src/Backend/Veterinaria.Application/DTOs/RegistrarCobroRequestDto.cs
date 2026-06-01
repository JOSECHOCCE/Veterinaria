using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Application.DTOs;

public class RegistrarCobroRequestDto
{
    [Required]
    public int CitaId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "El monto ajustado no puede ser cero o negativo.")]
    public decimal MontoTotalAjustado { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "El monto abonado no puede ser cero o negativo.")]
    public decimal MontoAbonado { get; set; }

    [Required]
    [MaxLength(20)]
    public string MetodoPago { get; set; } = string.Empty; // Efectivo, Tarjeta, Transferencia, Yape/Plin

    [MaxLength(50)]
    public string? ReferenciaOpcional { get; set; }

    [MaxLength(500)]
    public string? Observacion { get; set; }
}
