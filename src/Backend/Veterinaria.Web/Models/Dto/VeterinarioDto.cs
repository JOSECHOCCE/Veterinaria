using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Web.Models.Dto;

public class VeterinarioDto
{
    public int Id { get; set; }

    [Required(ErrorMessage = "El nombre es requerido")]
    [MaxLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres")]
    [Display(Name = "Nombre")]
    public string Nombre { get; set; } = default!;

    [Display(Name = "Especialidad")]
    public string? Especialidad { get; set; }

    [EmailAddress(ErrorMessage = "El formato del email no es válido")]
    [Display(Name = "Email")]
    public string? Email { get; set; }

    [Display(Name = "Teléfono")]
    public string? Telefono { get; set; }

    [Display(Name = "Horario Inicio")]
    [DataType(DataType.Time)]
    public TimeSpan HorarioInicio { get; set; }

    [Display(Name = "Horario Fin")]
    [DataType(DataType.Time)]
    public TimeSpan HorarioFin { get; set; }

    [Display(Name = "Activo")]
    public bool Activo { get; set; } = true;
}
