using Veterinaria.Domain.Entities;

namespace Veterinaria.Domain.Contracts;

public interface IUnitOfWork : IAsyncDisposable
{
    IGenericRepository<Usuario> Usuarios { get; }
    IGenericRepository<Mascota> Mascotas { get; }
    IGenericRepository<Veterinario> Veterinarios { get; }
    IGenericRepository<Servicio> Servicios { get; }
    IGenericRepository<Cita> Citas { get; }
    IGenericRepository<HistorialClinico> HistorialesClinicos { get; }
    IGenericRepository<Pago> Pagos { get; }
    IGenericRepository<Notificacion> Notificaciones { get; }
    IGenericRepository<TarjetaGuardada> TarjetasGuardadas { get; }
    IGenericRepository<Triage> Triages { get; }
    IGenericRepository<Consentimiento> Consentimientos { get; }

    Task<int> CommitAsync();
}
