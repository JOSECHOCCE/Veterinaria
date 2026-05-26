using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;

namespace Veterinaria.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly VeterinariaDbContext _context;

    public IGenericRepository<Usuario> Usuarios { get; }
    public IGenericRepository<Mascota> Mascotas { get; }
    public IGenericRepository<Veterinario> Veterinarios { get; }
    public IGenericRepository<Servicio> Servicios { get; }
    public IGenericRepository<Cita> Citas { get; }
    public IGenericRepository<HistorialClinico> HistorialesClinicos { get; }
    public IGenericRepository<Pago> Pagos { get; }
    public IGenericRepository<Notificacion> Notificaciones { get; }
    public IGenericRepository<TarjetaGuardada> TarjetasGuardadas { get; }
    public IGenericRepository<Triage> Triages { get; }
    public IGenericRepository<Consentimiento> Consentimientos { get; }

    public UnitOfWork(VeterinariaDbContext context)
    {
        _context = context;
        Usuarios = new GenericRepository<Usuario>(_context);
        Mascotas = new GenericRepository<Mascota>(_context);
        Veterinarios = new GenericRepository<Veterinario>(_context);
        Servicios = new GenericRepository<Servicio>(_context);
        Citas = new GenericRepository<Cita>(_context);
        HistorialesClinicos = new GenericRepository<HistorialClinico>(_context);
        Pagos = new GenericRepository<Pago>(_context);
        Notificaciones = new GenericRepository<Notificacion>(_context);
        TarjetasGuardadas = new GenericRepository<TarjetaGuardada>(_context);
        Triages = new GenericRepository<Triage>(_context);
        Consentimientos = new GenericRepository<Consentimiento>(_context);
    }

    public async Task<int> CommitAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        await _context.DisposeAsync();
    }
}

