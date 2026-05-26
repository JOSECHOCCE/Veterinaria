using System.Threading.Tasks;
using Veterinaria.Domain.Entities;
using System.Collections.Generic;

namespace Veterinaria.Application.Interfaces;

public class ClienteDetalleDto
{
    public Usuario Usuario { get; set; } = null!;
    public int TotalCitas { get; set; }
    public int CitasCompletadas { get; set; }
    public int CitasCanceladas { get; set; }
    public int CitasPendientes { get; set; }
    public decimal TotalGastado { get; set; }
    public decimal PagosPendientes { get; set; }
    public List<Cita> UltimasCitas { get; set; } = new List<Cita>();
}

public interface IClienteService
{
    Task<(IEnumerable<Usuario> Usuarios, Dictionary<int, int> CitasPorUsuario)> GetClientesAsync(string buscar, bool mostrarInactivos);
    Task<ClienteDetalleDto?> GetClienteDetailsAsync(int id);
    Task<bool> ToggleActivoAsync(int id);
    Task<(bool Success, string Message)> DeleteCascadeAsync(int id);
}
