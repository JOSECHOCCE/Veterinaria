using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Web.Models.Dto;

public class MascotaDto
{
    public int Id { get; set; }

    [Required(ErrorMessage = "El nombre es requerido")]
    [MaxLength(50, ErrorMessage = "El nombre no puede exceder 50 caracteres")]
    [Display(Name = "Nombre")]
    public string Nombre { get; set; } = default!;

    [Required(ErrorMessage = "La especie es requerida")]
    [Display(Name = "Especie")]
    public string Especie { get; set; } = default!;

    [Display(Name = "Raza")]
    public string? Raza { get; set; }

    [Display(Name = "Fecha de Nacimiento")]
    [DataType(DataType.Date)]
    public DateTime? FechaNacimiento { get; set; }

    [Display(Name = "Peso (kg)")]
    public decimal? Peso { get; set; }

    [Display(Name = "Color")]
    public string? Color { get; set; }

    [Display(Name = "Foto")]
    public string? FotoUrl { get; set; }

    [Required(ErrorMessage = "El usuario es requerido")]
    [Display(Name = "Propietario")]
    public int UsuarioId { get; set; }

    [Display(Name = "Sexo")]
    public string? Sexo { get; set; }

    [Display(Name = "Observaciones Generales")]
    public string? ObservacionesGenerales { get; set; }

    [Display(Name = "Alergias Conocidas")]
    public string? AlergiasConocidas { get; set; }

    // Propiedad calculada
    [Display(Name = "Edad")]
    public int? Edad
    {
        get
        {
            if (FechaNacimiento == null) return null;
            var today = DateTime.Today;
            var age = today.Year - FechaNacimiento.Value.Year;
            if (FechaNacimiento.Value.Date > today.AddYears(-age)) age--;
            return age;
        }
    }

    // Propiedad de navegación para mostrar
    [Display(Name = "Propietario")]
    public string? UsuarioNombre { get; set; }
}
