using System;

namespace Veterinaria.Application.DTOs;

public class ProductoAlertaDto
{
    public int Id { get; set; }

    public string Nombre { get; set; } = default!;

    public string Categoria { get; set; } = default!;

    public int Stock { get; set; }

    public int StockMinimo { get; set; }

    public int RopCalculado { get; set; }

    public DateTime? FechaVencimiento { get; set; }

    public string TipoAlerta { get; set; } = default!; // "StockBajo", "PorVencer", "Ambos"
}
