using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Web.Models.Dto;

public class HistorialClinicoDto
{
    public int Id { get; set; }

    [Required(ErrorMessage = "La cita es requerida")]
    [Display(Name = "Cita")]
    public int CitaId { get; set; }

    [Required(ErrorMessage = "El diagnóstico es requerido")]
    [MaxLength(1000, ErrorMessage = "El diagnóstico no puede exceder 1000 caracteres")]
    [Display(Name = "Diagnóstico")]
    public string Diagnostico { get; set; } = default!;

    [MaxLength(1000, ErrorMessage = "El tratamiento no puede exceder 1000 caracteres")]
    [Display(Name = "Tratamiento")]
    public string? Tratamiento { get; set; }

    [MaxLength(500, ErrorMessage = "Los medicamentos no pueden exceder 500 caracteres")]
    [Display(Name = "Medicamentos")]
    public string? Medicamentos { get; set; }

    [MaxLength(1000, ErrorMessage = "Las observaciones no pueden exceder 1000 caracteres")]
    [Display(Name = "Observaciones")]
    public string? Observaciones { get; set; }

    [Display(Name = "Fecha de Registro")]
    [DataType(DataType.DateTime)]
    public DateTime FechaRegistro { get; set; }

    // Propiedades para mostrar información de la cita
    [Display(Name = "Veterinario")]
    public string? VeterinarioNombre { get; set; }

    [Display(Name = "Servicio")]
    public string? ServicioNombre { get; set; }

    [Display(Name = "Fecha de la Cita")]
    public DateTime? FechaCita { get; set; }

    [Display(Name = "Motivo de la Cita")]
    public string? MotivoCita { get; set; }
}
