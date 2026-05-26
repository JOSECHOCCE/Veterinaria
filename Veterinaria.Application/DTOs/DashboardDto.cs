namespace Veterinaria.Application.DTOs;

public class DashboardDto
{
    public int CitasHoyTotal { get; set; }
    public int CitasHoyPendientes { get; set; }
    public int CitasHoyConfirmadas { get; set; }
    public int CitasHoyEnProceso { get; set; }
    public int CitasHoyCompletadas { get; set; }
    public int CitasHoyCanceladas { get; set; }

    public int CitasSemanaTotal { get; set; }
    public int CitasSemanaCompletadas { get; set; }
    public int CitasSemanaPendientes { get; set; }

    public List<ServicioEstadisticaDto> ServiciosMasSolicitados { get; set; } = new();

    public decimal IngresosMes { get; set; }
    public int PagosConfirmadosMes { get; set; }

    public List<VeterinarioEstadisticaDto> VeterinariosMasOcupados { get; set; } = new();
    public List<EspecieEstadisticaDto> MascotasPorEspecie { get; set; } = new();
    public List<CitaProximaDto> ProximasCitas { get; set; } = new();

    public int PagosPendientesCount { get; set; }
    public decimal PagosPendientesTotal { get; set; }

    public int TotalMascotas { get; set; }
    public int TotalVeterinarios { get; set; }
    public int TotalUsuarios { get; set; }
    public int TotalServicios { get; set; }
}

public class ServicioEstadisticaDto
{
    public string Nombre { get; set; } = string.Empty;
    public int CantidadCitas { get; set; }
    public decimal Ingresos { get; set; }
}

public class VeterinarioEstadisticaDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Especialidad { get; set; }
    public int CitasSemana { get; set; }
    public int CitasMes { get; set; }
}

public class EspecieEstadisticaDto
{
    public string Especie { get; set; } = string.Empty;
    public int Cantidad { get; set; }
}

public class CitaProximaDto
{
    public int Id { get; set; }
    public DateTime FechaHora { get; set; }
    public string MascotaNombre { get; set; } = string.Empty;
    public string PropietarioNombre { get; set; } = string.Empty;
    public string VeterinarioNombre { get; set; } = string.Empty;
    public string ServicioNombre { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
}
