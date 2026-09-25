using System.Collections.Generic;

namespace Veterinaria.Application.DTOs;

public class ProcesarPagoMixtoDto
{
    public int OrdenCobroId { get; set; }
    public string ClaveIdempotencia { get; set; } = default!;
    public List<DetallePagoMetodoDto> MetodosPago { get; set; } = new();
    public string? Observacion { get; set; }
}
