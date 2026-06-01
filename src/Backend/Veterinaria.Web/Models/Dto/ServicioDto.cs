using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Web.Models.Dto;

public class ServicioDto
{
    public int Id { get; set; }

    [Required(ErrorMessage = "El nombre es requerido")]
    [MaxLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres")]
    [Display(Name = "Nombre")]
    public string Nombre { get; set; } = default!;

    [Display(Name = "Descripción")]
    public string? Descripcion { get; set; }

    [Range(15, 480, ErrorMessage = "La duración debe estar entre 15 y 480 minutos")]
    [Display(Name = "Duración (minutos)")]
    public int DuracionMinutos { get; set; }

    [Range(0.01, 10000, ErrorMessage = "El precio debe estar entre 0.01 y 10,000")]
    [Display(Name = "Precio")]
    [DataType(DataType.Currency)]
    public decimal Precio { get; set; }

    [Display(Name = "Requiere Veterinario Asignado")]
    public bool RequiereVeterinario { get; set; } = true;

    [Display(Name = "Especialidad Requerida")]
    [MaxLength(100, ErrorMessage = "La especialidad no puede exceder 100 caracteres")]
    public string? EspecialidadRequerida { get; set; }

    [Display(Name = "Activo")]
    public bool Activo { get; set; } = true;
}
