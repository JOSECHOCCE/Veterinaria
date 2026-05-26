using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.Interfaces;
using Veterinaria.Application.DTOs;
using System.Threading.Tasks;
using System.Linq;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly IClienteService _clienteService;

    public ClientesController(IClienteService clienteService)
    {
        _clienteService = clienteService;
    }

    // GET: api/Clientes
    [HttpGet]
    public async Task<ActionResult<Response<object>>> Index(string? buscar, bool? mostrarInactivos, int page = 1)
    {
        var result = await _clienteService.GetClientesAsync(buscar, mostrarInactivos ?? false);

        var usuariosList = result.Usuarios.ToList();

        var data = new
        {
            BuscarActual = buscar,
            MostrarInactivos = mostrarInactivos ?? false,
            CitasPorUsuario = result.CitasPorUsuario,
            Usuarios = usuariosList.Skip((page - 1) * 10).Take(10).ToList(),
            TotalItems = usuariosList.Count,
            Page = page
        };

        return Ok(Response<object>.Ok(data));
    }

    // GET: api/Clientes/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Response<object>>> Details(int id)
    {
        var detalle = await _clienteService.GetClienteDetailsAsync(id);

        if (detalle == null)
        {
            return NotFound(Response<object>.Fail("Cliente no encontrado."));
        }

        var data = new
        {
            TotalCitas = detalle.TotalCitas,
            CitasCompletadas = detalle.CitasCompletadas,
            CitasCanceladas = detalle.CitasCanceladas,
            CitasPendientes = detalle.CitasPendientes,
            Citas = detalle.UltimasCitas,
            TotalGastado = detalle.TotalGastado,
            PagosPendientes = detalle.PagosPendientes,
            Usuario = detalle.Usuario
        };

        return Ok(Response<object>.Ok(data));
    }

    // POST: api/Clientes/ToggleActivo/5
    [HttpPost("ToggleActivo/{id}")]
    public async Task<ActionResult<Response<object>>> ToggleActivo(int id)
    {
        var success = await _clienteService.ToggleActivoAsync(id);
        if (!success)
        {
            return NotFound(Response<object>.Fail("Cliente no encontrado."));
        }

        return Ok(Response<object>.Ok("Estado del cliente actualizado exitosamente."));
    }

    // DELETE: api/Clientes/5
    [HttpDelete("{id}")]
    public async Task<ActionResult<Response<object>>> Delete(int id)
    {
        var result = await _clienteService.DeleteCascadeAsync(id);

        if (result.Success)
        {
            return Ok(Response<object>.Ok(result.Message));
        }
        else
        {
            return BadRequest(Response<object>.Fail(result.Message));
        }
    }
}
