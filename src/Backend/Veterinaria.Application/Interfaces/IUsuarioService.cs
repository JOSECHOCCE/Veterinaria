using System.Threading.Tasks;
using System.Collections.Generic;
using Veterinaria.Application.DTOs;

namespace Veterinaria.Application.Interfaces;

public interface IUsuarioService
{
    Task<Response<List<UsuarioDetailsDto>>> GetUsuariosAsync();
    Task<Response<object>> CrearUsuarioAsync(CrearUsuarioDto request);
    Task<Response<object>> EditarUsuarioAsync(int id, EditarUsuarioDto request);
    Task<Response<object>> CambiarEstadoAsync(int id, bool activo);
    Task<Response<object>> EliminarUsuarioAsync(int id);
}
