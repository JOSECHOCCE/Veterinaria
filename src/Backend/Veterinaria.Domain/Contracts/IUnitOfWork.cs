using Veterinaria.Domain.Entities;

namespace Veterinaria.Domain.Contracts;

public interface IUnitOfWork : IAsyncDisposable, IDisposable
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
    IGenericRepository<Producto> Productos { get; }
    IGenericRepository<Venta> Ventas { get; }
    IGenericRepository<DetalleVenta> DetallesVentas { get; }
    IGenericRepository<HorarioClinica> HorariosClinica { get; }
    IGenericRepository<HorarioVeterinario> HorariosVeterinario { get; }
    IGenericRepository<BloqueoAgenda> BloqueosAgenda { get; }
    IGenericRepository<Consultorio> Consultorios { get; }
    IGenericRepository<ListaEspera> ListaEsperas { get; }
    IGenericRepository<Presupuesto> Presupuestos { get; }
    IGenericRepository<DetallePresupuesto> DetallePresupuestos { get; }
    IGenericRepository<Receta> Recetas { get; }
    IGenericRepository<DetalleReceta> DetalleRecetas { get; }
    IGenericRepository<MovimientoInventario> MovimientosInventario { get; }
    IGenericRepository<OrdenCobro> OrdenesCobro { get; }
    IGenericRepository<DetalleOrdenCobro> DetallesOrdenCobro { get; }
    IGenericRepository<SeguimientoPostAtencion> SeguimientosPostAtencion { get; }
    IGenericRepository<RecordatorioVacuna> RecordatoriosVacunas { get; }
    IGenericRepository<AuditoriaLog> AuditoriaLogs { get; }

    Task<int> CommitAsync();

    // T6 SHOULD: transacciones explícitas para atomicidad caja (no-op en providers no relacionales).
    bool SoportaTransacciones { get; }
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}
