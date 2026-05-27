using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Web.Models.Dto;

public class UsuarioDto
{
    public int Id { get; set; }

    [Required(ErrorMessage = "El nombre es requerido")]
    [MaxLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres")]
    [Display(Name = "Nombre")]
    public string Nombre { get; set; } = default!;

    [Required(ErrorMessage = "El email es requerido")]
    [EmailAddress(ErrorMessage = "El formato del email no es válido")]
    [MaxLength(150, ErrorMessage = "El email no puede exceder 150 caracteres")]
    [Display(Name = "Email")]
    public string Email { get; set; } = default!;

    [Display(Name = "Teléfono")]
    public string? Telefono { get; set; }

    [Display(Name = "Dirección")]
    public string? Direccion { get; set; }

    [Display(Name = "DNI")]
    public string? DNI { get; set; }

    [Display(Name = "Rol")]
    public string Rol { get; set; } = "Usuario";

    [Display(Name = "Activo")]
    public bool Activo { get; set; } = true;

    [Display(Name = "Fecha de Registro")]
    [DataType(DataType.DateTime)]
    public DateTime FechaRegistro { get; set; }
}
