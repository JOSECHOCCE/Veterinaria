namespace Veterinaria.Application.DTOs;

public class DetallePagoMetodoDto
{
    public string MetodoPago { get; set; } = default!; // "Efectivo", "Tarjeta", "Yape", "Plin", "Transferencia"
    public decimal Monto { get; set; }
    public string? NumeroOperacion { get; set; }
    public string EstadoVerificacion { get; set; } = "Confirmado"; // "Confirmado", "PendienteVerificacion"
}
