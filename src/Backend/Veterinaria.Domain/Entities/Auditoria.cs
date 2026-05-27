using System;
using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Domain.Entities;

public class Auditoria
{
    public int Id { get; set; }

    [MaxLength(450)]
    public string? UsuarioId { get; set; }

    [MaxLength(150)]
    public string? UsuarioEmail { get; set; }

    [Required]
    [MaxLength(100)]
    public string Accion { get; set; } = default!;

    [Required]
    [MaxLength(100)]
    public string Entidad { get; set; } = default!;

    [Required]
    [MaxLength(50)]
    public string EntidadId { get; set; } = default!;

    [MaxLength(2000)]
    public string? Detalle { get; set; }

    public DateTime Fecha { get; set; } = DateTime.UtcNow;
}
