using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Application.DTOs;

public class CrearServicioDto
{
    [Required(ErrorMessage = "El nombre es requerido")]
    [MaxLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres")]
    public string Nombre { get; set; } = default!;

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    [Range(15, 480, ErrorMessage = "La duración debe estar entre 15 y 480 minutos")]
    public int DuracionMinutos { get; set; }

    [Range(0.01, 10000, ErrorMessage = "El precio debe estar entre 0.01 y 10,000")]
    public decimal Precio { get; set; }

    public bool RequiereVeterinario { get; set; } = true;

    [MaxLength(100)]
    public string? EspecialidadRequerida { get; set; }
}
