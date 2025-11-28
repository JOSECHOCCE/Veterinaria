using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Web.Models.ViewModels;

public class CompletarPagoViewModel
{
    public int CitaId { get; set; }

    public decimal MontoRestante { get; set; }

    [Required(ErrorMessage = "Seleccione un método de pago")]
    [Display(Name = "Método de Pago")]
    public string MetodoPago { get; set; } = "Tarjeta"; // Tarjeta o Efectivo

    // Datos de tarjeta (opcionales si paga en efectivo)
    [Display(Name = "Número de Tarjeta")]
    [RegularExpression(@"^\d{16}$", ErrorMessage = "El número de tarjeta debe tener 16 dígitos")]
    public string? NumeroTarjeta { get; set; }

    [Display(Name = "Nombre en la Tarjeta")]
    [RegularExpression(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,50}$", ErrorMessage = "Solo letras, entre 3 y 50 caracteres")]
    public string? NombreTarjeta { get; set; }

    [Display(Name = "Fecha de Vencimiento")]
    [RegularExpression(@"^(0[1-9]|1[0-2])\/\d{2}$", ErrorMessage = "Formato: MM/YY")]
    public string? FechaVencimiento { get; set; }

    [Display(Name = "CVV")]
    [RegularExpression(@"^\d{3}$", ErrorMessage = "El CVV debe tener 3 dígitos")]
    public string? CVV { get; set; }

    // Información de la cita para mostrar
    public string? MascotaNombre { get; set; }
    public string? ServicioNombre { get; set; }
    public DateTime FechaCita { get; set; }

    // Tarjeta guardada
    public bool TieneTarjetaGuardada { get; set; }
    public string? TarjetaGuardadaUltimosDigitos { get; set; }
    public bool UsarTarjetaGuardada { get; set; }
    public bool GuardarTarjeta { get; set; } = true;
}
