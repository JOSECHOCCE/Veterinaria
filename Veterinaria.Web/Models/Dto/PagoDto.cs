using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Web.Models.Dto;

public class PagoDto
{
    public int Id { get; set; }

    [Required(ErrorMessage = "La cita es requerida")]
    [Display(Name = "Cita")]
    public int CitaId { get; set; }

    [Required(ErrorMessage = "El monto es requerido")]
    [Range(0.01, 100000, ErrorMessage = "El monto debe estar entre 0.01 y 100,000")]
    [Display(Name = "Monto")]
    [DataType(DataType.Currency)]
    public decimal Monto { get; set; }

    [Required(ErrorMessage = "El método de pago es requerido")]
    [Display(Name = "Método de Pago")]
    public string MetodoPago { get; set; } = "Efectivo";

    [Display(Name = "Tipo de Pago")]
    public string? TipoPago { get; set; } // "Completo", "Parcial", "Restante"

    [Display(Name = "Referencia")]
    public string? Referencia { get; set; }

    [Display(Name = "Últimos 4 dígitos")]
    public string? UltimosDigitosTarjeta { get; set; }

    [Display(Name = "Fecha de Pago")]
    [DataType(DataType.DateTime)]
    public DateTime FechaPago { get; set; }

    // Propiedades para mostrar información de la cita
    [Display(Name = "Mascota")]
    public string? MascotaNombre { get; set; }

    [Display(Name = "Propietario")]
    public string? PropietarioNombre { get; set; }

    [Display(Name = "Veterinario")]
    public string? VeterinarioNombre { get; set; }

    [Display(Name = "Servicio")]
    public string? ServicioNombre { get; set; }

    [Display(Name = "Fecha de la Cita")]
    public DateTime? FechaCita { get; set; }
}
