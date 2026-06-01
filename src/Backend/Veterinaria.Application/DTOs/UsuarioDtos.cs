using System;
using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Application.DTOs;

public class CrearUsuarioDto
{
    [Required(ErrorMessage = "El nombre es requerido")]
    [MaxLength(100, ErrorMessage = "El nombre no puede exceder los 100 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El email es requerido")]
    [EmailAddress(ErrorMessage = "Formato de email incorrecto")]
    [MaxLength(150, ErrorMessage = "El email no puede exceder los 150 caracteres.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es requerida")]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
    public string Password { get; set; } = string.Empty;

    [MaxLength(20, ErrorMessage = "El DNI no puede exceder los 20 caracteres.")]
    public string? DNI { get; set; }

    [MaxLength(20, ErrorMessage = "El teléfono no puede exceder los 20 caracteres.")]
    public string? Telefono { get; set; }

    [MaxLength(200, ErrorMessage = "La dirección no puede exceder los 200 caracteres.")]
    public string? Direccion { get; set; }

    [Required(ErrorMessage = "El rol es requerido")]
    public string Rol { get; set; } = "Usuario";
}

public class EditarUsuarioDto
{
    [Required(ErrorMessage = "El nombre es requerido")]
    [MaxLength(100, ErrorMessage = "El nombre no puede exceder los 100 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(20, ErrorMessage = "El DNI no puede exceder los 20 caracteres.")]
    public string? DNI { get; set; }

    [MaxLength(20, ErrorMessage = "El teléfono no puede exceder los 20 caracteres.")]
    public string? Telefono { get; set; }

    [MaxLength(200, ErrorMessage = "La dirección no puede exceder los 200 caracteres.")]
    public string? Direccion { get; set; }

    [Required(ErrorMessage = "El rol es requerido")]
    public string Rol { get; set; } = "Usuario";
}

public class UsuarioDetailsDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public string? DNI { get; set; }
    public string Rol { get; set; } = "Usuario";
    public bool Activo { get; set; } = true;
    public DateTime FechaRegistro { get; set; }
}
