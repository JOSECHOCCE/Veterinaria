using System.Threading.Tasks;
using Veterinaria.Domain.Entities;
using System.Collections.Generic;
using Veterinaria.Application.DTOs;

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
    Task<(bool Success, string Message, Usuario? Cliente, List<DuplicadoDto> Duplicados)> RegistrarClienteAsync(CrearClienteDto dto);
    Task<(bool Success, string Message, List<DuplicadoDto> Duplicados)> EditarClienteAsync(int id, EditarClienteDto dto);
    Task<List<DuplicadoDto>> DetectarDuplicadosAsync(string? dni, string? email, string? telefono, int? excluirId = null);
    Task<Usuario?> GetClienteByIdAsync(int id);
    Task<(IEnumerable<Usuario> Usuarios, int TotalItems)> GetClientesPaginadosAsync(string buscar, bool mostrarInactivos, int pagina, int tamanoPagina);
}

