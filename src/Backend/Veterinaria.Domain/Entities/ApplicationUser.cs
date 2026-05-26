using Microsoft.AspNetCore.Identity;

namespace Veterinaria.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public string NombreCompleto { get; set; } = string.Empty;
    
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
}
