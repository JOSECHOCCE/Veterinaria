using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Domain.Entities;

public class DetalleReceta
{
    public int Id { get; set; }

    public int RecetaId { get; set; }

    public int? ProductoId { get; set; } // Nullable for external non-inventory prescriptions

    [Required]
    [MaxLength(200)]
    public string NombreProducto { get; set; } = default!;

    [Required]
    [MaxLength(100)]
    public string Dosis { get; set; } = default!;

    [Required]
    [MaxLength(100)]
    public string Frecuencia { get; set; } = default!;

    public int DuracionDias { get; set; } = 1;

    public int CantidadPrescrita { get; set; } = 1;

    public bool EsStockInterno { get; set; } = true;

    public bool RequiereRecetaObligatoria { get; set; } = false;

    // Navegación
    public virtual Receta Receta { get; set; } = default!;
    public virtual Producto? Producto { get; set; }
}
