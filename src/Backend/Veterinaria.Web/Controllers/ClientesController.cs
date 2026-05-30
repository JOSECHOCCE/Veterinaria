using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.Interfaces;
using Veterinaria.Application.DTOs;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin,Recepcionista")]
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

    // POST: api/Clientes
    [HttpPost]
    public async Task<ActionResult<Response<object>>> Create([FromBody] CrearClienteDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos del formulario inválidos."));
        }

        var result = await _clienteService.RegistrarClienteAsync(dto);
        if (result.Success)
        {
            return Ok(Response<object>.Ok(result.Cliente, result.Message));
        }
        else
        {
            if (result.Duplicados != null && result.Duplicados.Any())
            {
                return BadRequest(Response<object>.Fail(result.Message, result.Duplicados));
            }
            return BadRequest(Response<object>.Fail(result.Message));
        }
    }

    // PUT: api/Clientes/5
    [HttpPut("{id}")]
    public async Task<ActionResult<Response<object>>> Edit(int id, [FromBody] EditarClienteDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos de edición inválidos."));
        }

        var result = await _clienteService.EditarClienteAsync(id, dto);
        if (result.Success)
        {
            return Ok(Response<object>.Ok(null, result.Message));
        }
        else
        {
            if (result.Duplicados != null && result.Duplicados.Any())
            {
                return BadRequest(Response<object>.Fail(result.Message, result.Duplicados));
            }
            return BadRequest(Response<object>.Fail(result.Message));
        }
    }

    // GET: api/Clientes/check-duplicates
    [HttpGet("check-duplicates")]
    public async Task<ActionResult<Response<List<DuplicadoDto>>>> CheckDuplicates(string? dni, string? email, string? telefono, int? excluirId)
    {
        var duplicados = await _clienteService.DetectarDuplicadosAsync(dni, email, telefono, excluirId);
        return Ok(Response<List<DuplicadoDto>>.Ok(duplicados, "Verificación de duplicados completada."));
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
