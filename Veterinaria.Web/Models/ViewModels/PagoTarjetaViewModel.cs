using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Web.Models.ViewModels;

public class PagoTarjetaViewModel
{
    public int CitaId { get; set; }
    
    [Required(ErrorMessage = "El número de tarjeta es requerido")]
    [RegularExpression(@"^\d{16}$", ErrorMessage = "El número de tarjeta debe tener 16 dígitos")]
    [Display(Name = "Número de Tarjeta")]
    public string NumeroTarjeta { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre del titular es requerido")]
    [RegularExpression(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,50}$", ErrorMessage = "El nombre debe tener entre 3 y 50 caracteres (solo letras)")]
    [Display(Name = "Nombre del Titular")]
    public string NombreTitular { get; set; } = string.Empty;

    [Required(ErrorMessage = "La fecha de vencimiento es requerida")]
    [RegularExpression(@"^(0[1-9]|1[0-2])\/\d{2}$", ErrorMessage = "Formato inválido. Use MM/AA")]
    [Display(Name = "Fecha de Vencimiento")]
    public string FechaVencimiento { get; set; } = string.Empty;

    [Required(ErrorMessage = "El CVV es requerido")]
    [RegularExpression(@"^\d{3}$", ErrorMessage = "El CVV debe tener 3 dígitos")]
    [Display(Name = "CVV")]
    public string CVV { get; set; } = string.Empty;

    [Required]
    public string TipoPago { get; set; } = "Completo"; // "Completo" o "Parcial"

    public decimal MontoTotal { get; set; }
    public decimal MontoPagar { get; set; }

    // Información de la cita (solo lectura)
    public string? MascotaNombre { get; set; }
    public string? ServicioNombre { get; set; }
    public string? VeterinarioNombre { get; set; }
    public DateTime FechaCita { get; set; }

    // Tarjeta guardada
    public bool TieneTarjetaGuardada { get; set; }
    public string? TarjetaGuardadaUltimosDigitos { get; set; }
    public bool UsarTarjetaGuardada { get; set; }
    public bool GuardarTarjeta { get; set; } = true; // Por defecto guardar

    // Validación de fecha de vencimiento
    public bool EsFechaVencimientoValida()
    {
        if (string.IsNullOrEmpty(FechaVencimiento)) return false;
        
        var partes = FechaVencimiento.Split('/');
        if (partes.Length != 2) return false;

        if (!int.TryParse(partes[0], out int mes) || !int.TryParse(partes[1], out int anio))
            return false;

        if (mes < 1 || mes > 12) return false;

        // Convertir año de 2 dígitos a 4 dígitos
        anio += 2000;

        var fechaVenc = new DateTime(anio, mes, 1).AddMonths(1).AddDays(-1);
        return fechaVenc >= DateTime.Today;
    }
}
