using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
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
    public IGenericRepository<Producto> Productos { get; }
    public IGenericRepository<Venta> Ventas { get; private set; }
    public IGenericRepository<DetalleVenta> DetallesVentas { get; private set; }
    public IGenericRepository<HorarioClinica> HorariosClinica { get; private set; }
    public IGenericRepository<HorarioVeterinario> HorariosVeterinario { get; private set; }
    public IGenericRepository<BloqueoAgenda> BloqueosAgenda { get; private set; }
    public IGenericRepository<Consultorio> Consultorios { get; private set; }
    public IGenericRepository<ListaEspera> ListaEsperas { get; private set; }
    public IGenericRepository<Presupuesto> Presupuestos { get; private set; }
    public IGenericRepository<DetallePresupuesto> DetallePresupuestos { get; private set; }
    public IGenericRepository<Receta> Recetas { get; private set; }
    public IGenericRepository<DetalleReceta> DetalleRecetas { get; private set; }
    public IGenericRepository<MovimientoInventario> MovimientosInventario { get; private set; }
    public IGenericRepository<OrdenCobro> OrdenesCobro { get; private set; }
    public IGenericRepository<DetalleOrdenCobro> DetallesOrdenCobro { get; private set; }
    public IGenericRepository<SeguimientoPostAtencion> SeguimientosPostAtencion { get; private set; }
    public IGenericRepository<RecordatorioVacuna> RecordatoriosVacunas { get; private set; }
    public IGenericRepository<AuditoriaLog> AuditoriaLogs { get; private set; }

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
        Productos = new GenericRepository<Producto>(_context);
        Ventas = new GenericRepository<Venta>(_context);
        DetallesVentas = new GenericRepository<DetalleVenta>(_context);
        HorariosClinica = new GenericRepository<HorarioClinica>(_context);
        HorariosVeterinario = new GenericRepository<HorarioVeterinario>(_context);
        BloqueosAgenda = new GenericRepository<BloqueoAgenda>(_context);
        Consultorios = new GenericRepository<Consultorio>(_context);
        ListaEsperas = new GenericRepository<ListaEspera>(_context);
        Presupuestos = new GenericRepository<Presupuesto>(_context);
        DetallePresupuestos = new GenericRepository<DetallePresupuesto>(_context);
        Recetas = new GenericRepository<Receta>(_context);
        DetalleRecetas = new GenericRepository<DetalleReceta>(_context);
        MovimientosInventario = new GenericRepository<MovimientoInventario>(_context);
        OrdenesCobro = new GenericRepository<OrdenCobro>(_context);
        DetallesOrdenCobro = new GenericRepository<DetalleOrdenCobro>(_context);
        SeguimientosPostAtencion = new GenericRepository<SeguimientoPostAtencion>(_context);
        RecordatoriosVacunas = new GenericRepository<RecordatorioVacuna>(_context);
        AuditoriaLogs = new GenericRepository<AuditoriaLog>(_context);
    }

    public async Task<int> CommitAsync()
    {
        return await _context.SaveChangesAsync();
    }

    // T6 SHOULD: transacciones explícitas; no-op cuando el provider no es relacional (tests InMemory).
    private IDbContextTransaction? _transaccionActual;

    public bool SoportaTransacciones => _context.Database.IsRelational();

    public async Task BeginTransactionAsync()
    {
        if (!SoportaTransacciones || _transaccionActual != null)
            return;
        _transaccionActual = await _context.Database.BeginTransactionAsync();
    }

    public async Task CommitTransactionAsync()
    {
        if (_transaccionActual == null)
            return;
        await _transaccionActual.CommitAsync();
        await _transaccionActual.DisposeAsync();
        _transaccionActual = null;
    }

    public async Task RollbackTransactionAsync()
    {
        if (_transaccionActual == null)
            return;
        await _transaccionActual.RollbackAsync();
        await _transaccionActual.DisposeAsync();
        _transaccionActual = null;
    }

    public async ValueTask DisposeAsync()
    {
        await _context.DisposeAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}

