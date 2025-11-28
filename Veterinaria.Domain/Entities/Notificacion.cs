namespace Veterinaria.Domain.Entities;

public class Notificacion
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public string Tipo { get; set; } = "Info"; // Info, Success, Warning, Error
    public string? Icono { get; set; }
    public string? UrlAccion { get; set; } // URL para redirigir al hacer clic
    public bool Leida { get; set; } = false;
    public DateTime FechaCreacion { get; set; } = DateTime.Now;
    public DateTime? FechaLectura { get; set; }
    
    // Navegación
    public virtual Usuario? Usuario { get; set; }
}
