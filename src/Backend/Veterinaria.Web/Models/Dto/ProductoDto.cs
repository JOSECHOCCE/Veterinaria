using System;
using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Web.Models.Dto;

public class ProductoDto
{
    public int Id { get; set; }

    [Required(ErrorMessage = "El nombre es obligatorio")]
    [MaxLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres")]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(500, ErrorMessage = "La descripción no puede superar los 500 caracteres")]
    public string? Descripcion { get; set; }

    [Range(0.01, 999999.99, ErrorMessage = "El precio debe ser mayor a 0")]
    public decimal Precio { get; set; }

    [Range(0, 999999, ErrorMessage = "El stock no puede ser negativo")]
    public int Stock { get; set; }

    [Range(0, 999999, ErrorMessage = "El stock mínimo no puede ser negativo")]
    public int StockMinimo { get; set; }

    [Required(ErrorMessage = "La categoría es obligatoria")]
    [MaxLength(50)]
    public string Categoria { get; set; } = "General"; // "Medicamento", "Alimento", "Accesorio"

    public bool Activo { get; set; } = true;

    public DateTime FechaCreacion { get; set; }
}
