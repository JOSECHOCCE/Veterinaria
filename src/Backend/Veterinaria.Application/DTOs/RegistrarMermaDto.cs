using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Application.DTOs;

public class RegistrarMermaDto
{
    [Required]
    public int ProductoId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser al menos 1")]
    public int Cantidad { get; set; }

    [Required]
    [MaxLength(50)]
    public string Motivo { get; set; } = default!; // "Merma_Vencido", "Merma_Dañado", "Merma_Perdida", "Ajuste"

    [MaxLength(250)]
    public string? Observaciones { get; set; }
}
