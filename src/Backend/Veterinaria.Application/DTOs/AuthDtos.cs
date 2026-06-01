using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Application.DTOs;

public class LoginRequestDto
{
    [Required(ErrorMessage = "El correo electrónico es requerido.")]
    [EmailAddress(ErrorMessage = "Formato de correo electrónico incorrecto.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es requerida.")]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; } = false;
}

public class RegisterRequestDto
{
    [Required(ErrorMessage = "El nombre completo es requerido.")]
    [MaxLength(100, ErrorMessage = "El nombre no puede exceder los 100 caracteres.")]
    public string NombreCompleto { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo electrónico es requerido.")]
    [EmailAddress(ErrorMessage = "Formato de correo electrónico incorrecto.")]
    [MaxLength(150, ErrorMessage = "El correo electrónico no puede exceder los 150 caracteres.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es requerida.")]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres.")]
    public string Password { get; set; } = string.Empty;

    [MaxLength(20, ErrorMessage = "El DNI no puede exceder los 20 caracteres.")]
    public string? DNI { get; set; }

    [MaxLength(20, ErrorMessage = "El teléfono no puede exceder los 20 caracteres.")]
    public string? Telefono { get; set; }

    [MaxLength(200, ErrorMessage = "La dirección no puede exceder los 200 caracteres.")]
    public string? Direccion { get; set; }
}

public class UpdateProfileRequestDto
{
    [Required(ErrorMessage = "El nombre completo es requerido.")]
    [MaxLength(100, ErrorMessage = "El nombre no puede exceder los 100 caracteres.")]
    public string NombreCompleto { get; set; } = string.Empty;

    [MaxLength(20, ErrorMessage = "El teléfono no puede exceder los 20 caracteres.")]
    public string? Telefono { get; set; }

    [MaxLength(20, ErrorMessage = "El DNI no puede exceder los 20 caracteres.")]
    public string? DNI { get; set; }

    [MaxLength(200, ErrorMessage = "La dirección no puede exceder los 200 caracteres.")]
    public string? Direccion { get; set; }
}

public class ChangePasswordRequestDto
{
    [Required(ErrorMessage = "La contraseña actual es requerida.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "La nueva contraseña es requerida.")]
    [MinLength(6, ErrorMessage = "La nueva contraseña debe tener al menos 6 caracteres.")]
    public string NewPassword { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public string Email { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
}
