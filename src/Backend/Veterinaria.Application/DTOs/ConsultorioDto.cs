namespace Veterinaria.Application.DTOs;

public class ConsultorioDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = default!;
    public string TipoEspacio { get; set; } = default!;
    public int Capacidad { get; set; }
    public bool Activo { get; set; }
}

public class CrearConsultorioDto
{
    public string Nombre { get; set; } = default!;
    public string TipoEspacio { get; set; } = "Consultorio";
    public int Capacidad { get; set; } = 1;
}

public class OcupacionConsultorioDto
{
    public int ConsultorioId { get; set; }
    public string Nombre { get; set; } = default!;
    public string TipoEspacio { get; set; } = default!;
    public string Estado { get; set; } = "Libre"; // "Libre", "Ocupado"
    public string? CitaActual { get; set; }
    public string? MascotaNombre { get; set; }
    public string? VeterinarioNombre { get; set; }
    public string? HoraInicio { get; set; }
    public string? HoraFin { get; set; }
}
