using System;
using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Application.DTOs;

public class CrearClienteDto
{
    [Required(ErrorMessage = "El nombre completo es requerido.")]
    [MaxLength(100, ErrorMessage = "El nombre no puede exceder los 100 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es requerido.")]
    [MaxLength(20, ErrorMessage = "El teléfono no puede exceder los 20 caracteres.")]
    public string Telefono { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
    [MaxLength(150, ErrorMessage = "El correo electrónico no puede exceder los 150 caracteres.")]
    public string? Email { get; set; }

    [MaxLength(20, ErrorMessage = "El DNI no puede exceder los 20 caracteres.")]
    public string? DNI { get; set; }

    [MaxLength(200, ErrorMessage = "La dirección no puede exceder los 200 caracteres.")]
    public string? Direccion { get; set; }

    [MaxLength(500, ErrorMessage = "Las observaciones no pueden exceder los 500 caracteres.")]
    public string? Observaciones { get; set; }

    public bool IgnorarDuplicados { get; set; } = false;
}
