using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Web.Models.Dto;

public class CitaDto
{
    public int Id { get; set; }

    [Required(ErrorMessage = "La fecha y hora son requeridas")]
    [Display(Name = "Fecha y Hora")]
    [DataType(DataType.DateTime)]
    public DateTime FechaHora { get; set; }

    [Display(Name = "Estado")]
    public string Estado { get; set; } = "Pendiente";

    [MaxLength(300, ErrorMessage = "El motivo no puede exceder 300 caracteres")]
    [Display(Name = "Motivo")]
    public string? Motivo { get; set; }

    [Required(ErrorMessage = "La mascota es requerida")]
    [Display(Name = "Mascota")]
    public int MascotaId { get; set; }

    [Required(ErrorMessage = "El veterinario es requerido")]
    [Display(Name = "Veterinario")]
    public int VeterinarioId { get; set; }

    [Required(ErrorMessage = "El servicio es requerido")]
    [Display(Name = "Servicio")]
    public int ServicioId { get; set; }

    // Propiedades de navegación de solo lectura
    [Display(Name = "Mascota")]
    public string? MascotaNombre { get; set; }

    [Display(Name = "Propietario")]
    public string? PropietarioNombre { get; set; }

    [Display(Name = "Veterinario")]
    public string? VeterinarioNombre { get; set; }

    [Display(Name = "Servicio")]
    public string? ServicioNombre { get; set; }

    [Display(Name = "Precio")]
    [DataType(DataType.Currency)]
    public decimal? PrecioServicio { get; set; }
}
