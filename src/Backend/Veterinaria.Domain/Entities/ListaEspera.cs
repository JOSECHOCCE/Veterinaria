using System.ComponentModel.DataAnnotations;

namespace Veterinaria.Domain.Entities;

public class ListaEspera
{
    public int Id { get; set; }

    public int MascotaId { get; set; }
    public int ServicioId { get; set; }
    public int? VeterinarioPreferidoId { get; set; }

    public DateTime FechaDeseada { get; set; }
    public DateTime FechaDeseadaFin { get; set; }

    [MaxLength(20)]
    public string Estado { get; set; } = "Pendiente"; // Pendiente, Notificada, Convertida, Expirada, Cancelada

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaNotificacion { get; set; }

    // Navegación
    public virtual Mascota Mascota { get; set; } = default!;
    public virtual Servicio Servicio { get; set; } = default!;
    public virtual Veterinario? VeterinarioPreferido { get; set; }
}
