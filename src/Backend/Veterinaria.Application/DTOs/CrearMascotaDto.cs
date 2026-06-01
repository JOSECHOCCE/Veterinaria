using System;
using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Application.DTOs;

public class CrearMascotaDto
{
    [Required(ErrorMessage = "El nombre es requerido")]
    [MaxLength(50)]
    public string Nombre { get; set; } = default!;

    [Required(ErrorMessage = "La especie es requerida")]
    [MaxLength(20)]
    public string Especie { get; set; } = default!;

    [MaxLength(50)]
    public string? Raza { get; set; }

    public DateTime? FechaNacimiento { get; set; }

    public decimal? Peso { get; set; }

    [MaxLength(30)]
    public string? Color { get; set; }

    public string? FotoUrl { get; set; }

    public int UsuarioId { get; set; }

    [MaxLength(10)]
    public string? Sexo { get; set; }

    [MaxLength(500)]
    public string? ObservacionesGenerales { get; set; }

    [MaxLength(200)]
    public string? AlergiasConocidas { get; set; }
}
