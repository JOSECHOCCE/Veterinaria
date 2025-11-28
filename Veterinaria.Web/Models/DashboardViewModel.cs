namespace Veterinaria.Web.Models;

public class DashboardViewModel
{
    // 1. Citas de hoy
    public int CitasHoyTotal { get; set; }
    public int CitasHoyPendientes { get; set; }
    public int CitasHoyConfirmadas { get; set; }
    public int CitasHoyEnProceso { get; set; }
    public int CitasHoyCompletadas { get; set; }
    public int CitasHoyCanceladas { get; set; }

    // 2. Citas de la semana
    public int CitasSemanaTotal { get; set; }
    public int CitasSemanaCompletadas { get; set; }
    public int CitasSemanaPendientes { get; set; }

    // 3. Servicios más solicitados (top 5)
    public List<ServicioEstadistica> ServiciosMasSolicitados { get; set; } = new();

    // 4. Ingresos del mes
    public decimal IngresosMes { get; set; }
    public int PagosConfirmadosMes { get; set; }

    // 5. Veterinarios más ocupados
    public List<VeterinarioEstadistica> VeterinariosMasOcupados { get; set; } = new();

    // 6. Mascotas atendidas por especie
    public List<EspecieEstadistica> MascotasPorEspecie { get; set; } = new();

    // 7. Próximas citas (siguiente 3 días)
    public List<CitaProxima> ProximasCitas { get; set; } = new();

    // 8. Pagos pendientes
    public int PagosPendientesCount { get; set; }
    public decimal PagosPendientesTotal { get; set; }

    // Datos adicionales para contexto
    public int TotalMascotas { get; set; }
    public int TotalVeterinarios { get; set; }
    public int TotalUsuarios { get; set; }
    public int TotalServicios { get; set; }
}

public class ServicioEstadistica
{
    public string Nombre { get; set; } = string.Empty;
    public int CantidadCitas { get; set; }
    public decimal Ingresos { get; set; }
}

public class VeterinarioEstadistica
{
    public string Nombre { get; set; } = string.Empty;
    public string? Especialidad { get; set; }
    public int CitasSemana { get; set; }
    public int CitasMes { get; set; }
}

public class EspecieEstadistica
{
    public string Especie { get; set; } = string.Empty;
    public int Cantidad { get; set; }
}

public class CitaProxima
{
    public int Id { get; set; }
    public DateTime FechaHora { get; set; }
    public string MascotaNombre { get; set; } = string.Empty;
    public string PropietarioNombre { get; set; } = string.Empty;
    public string VeterinarioNombre { get; set; } = string.Empty;
    public string ServicioNombre { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
}
