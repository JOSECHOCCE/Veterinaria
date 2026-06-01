using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Application.DTOs;

public class PortalDashboardDto
{
    public IEnumerable<object> ProximasCitas { get; set; } = new List<object>();
    public IEnumerable<object> Mascotas { get; set; } = new List<object>();
    public IEnumerable<object> Alertas { get; set; } = new List<object>();
}

public class SolicitarCitaPortalDto
{
    [Required]
    public int MascotaId { get; set; }
    
    [Required]
    public int ServicioId { get; set; }
    
    [Required]
    public DateTime FechaHora { get; set; }
    
    public int? VeterinarioId { get; set; }
    
    public string? Motivo { get; set; }
}

public class RegistrarMascotaPortalDto
{
    [Required(ErrorMessage = "El nombre es obligatorio")]
    public string Nombre { get; set; } = null!;

    [Required(ErrorMessage = "La especie es obligatoria")]
    public string Especie { get; set; } = null!; // Perro, Gato, Ave, Otro
}

public class ActualizarPerfilPortalDto
{
    [Phone(ErrorMessage = "Formato de teléfono inválido")]
    public string? Telefono { get; set; }
    
    public string? Direccion { get; set; }
    
    public string? PasswordActual { get; set; }
    public string? PasswordNuevo { get; set; }
}
