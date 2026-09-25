using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Veterinaria.Domain.Entities;

public class AuditoriaLog
{
    public long Id { get; set; }

    public int? UsuarioId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Accion { get; set; } = default!; // "AnonimizacionCliente", "AnulacionVenta", "ModificacionHistorial", "AjusteInventario"

    [Required]
    [MaxLength(100)]
    public string EntidadNombre { get; set; } = default!; // "Usuario", "Venta", "HistorialClinico"

    [Required]
    [MaxLength(50)]
    public string EntidadId { get; set; } = default!;

    public string? DatosPreviosJson { get; set; }

    public string? DatosNuevosJson { get; set; }

    [MaxLength(45)]
    public string? IpAddress { get; set; }

    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    // Navegación
    [ForeignKey("UsuarioId")]
    public virtual Usuario? Usuario { get; set; }
}
