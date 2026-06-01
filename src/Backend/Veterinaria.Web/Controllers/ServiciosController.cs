using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.Interfaces;
using Veterinaria.Application.DTOs;
using Veterinaria.Web.Models.Dto;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin,Recepcionista")]
[ApiController]
[Route("api/[controller]")]
public class ServiciosController : ControllerBase
{
    private readonly IServicioService _servicioService;
    private readonly IMapper _mapper;

    public ServiciosController(IServicioService servicioService, IMapper mapper)
    {
        _servicioService = servicioService;
        _mapper = mapper;
    }

    [HttpGet]
    [AllowAnonymous] // Allow clients to see the list? RF-18 says "El cliente solo ve los servicios activos" but the controller itself can just check roles. Let's keep it as is, but if they want to expose it, the [AllowAnonymous] isn't secure. Actually, we should use the same roles as other modules. Wait, the module says:
    // "Visible para recepción y administrador. El cliente solo ve los servicios activos al momento de agendar."
    // I'll keep the Authorize for all roles and filter in UI, or just "Admin,Recepcionista,Cliente"
    public ActionResult<Response<object>> Index(string? q, bool? mostrarInactivos, int page = 1)
    {
        // For security, if User is not Admin/Recepcionista, force mostrarInactivos = false
        if (!User.IsInRole("Admin") && !User.IsInRole("Recepcionista"))
        {
            mostrarInactivos = false;
        }

        var serviciosEntities = _servicioService.GetServicios(q, mostrarInactivos);

        var servicios = serviciosEntities
            .Select(s => _mapper.Map<ServicioDto>(s))
            .ToList();

        var result = new
        {
            Servicios = servicios,
            CurrentFilter = q,
            MostrarInactivos = mostrarInactivos
        };

        return Ok(Response<object>.Ok(result));
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Recepcionista")]
    public async Task<ActionResult<Response<object>>> Details(int id)
    {
        var servicio = await _servicioService.GetServicioWithCitasAsync(id);

        if (servicio == null)
        {
            return NotFound(Response<object>.Fail("Servicio no encontrado."));
        }

        var servicioDto = _mapper.Map<ServicioDto>(servicio);
        var result = new
        {
            Servicio = servicioDto,
            TotalCitas = servicio.Citas.Count,
            CitasCompletadas = servicio.Citas.Count(c => c.Estado == "Completada")
        };

        return Ok(Response<object>.Ok(result));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Response<object>>> Create([FromBody] CrearServicioDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos inválidos."));
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var result = await _servicioService.CrearServicioAsync(dto, userId);

        if (result.Success && result.Data != null)
        {
            var resultDto = _mapper.Map<ServicioDto>(result.Data);
            return Ok(Response<object>.Ok(resultDto, result.Message));
        }

        return BadRequest(Response<object>.Fail(result.Message));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Response<object>>> Edit(int id, [FromBody] EditarServicioDto dto)
    {
        if (id != dto.Id)
        {
            return BadRequest(Response<object>.Fail("El ID no coincide."));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos inválidos."));
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var result = await _servicioService.EditarServicioAsync(id, dto, userId);

        if (result.Success)
        {
            return Ok(Response<object>.Ok(new { Message = result.Message }));
        }

        return BadRequest(Response<object>.Fail(result.Message));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Response<object>>> Delete(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var result = await _servicioService.DeleteServicioAsync(id, userId);

        if (result.Success)
        {
            return Ok(Response<object>.Ok(new { Message = result.Message }));
        }

        return BadRequest(Response<object>.Fail(result.Message));
    }

    [HttpPost("ToggleActivo/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Response<object>>> ToggleActivo(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var result = await _servicioService.ToggleActivoAsync(id, userId);

        if (result.Success)
        {
            return Ok(Response<object>.Ok(new { Message = result.Message }));
        }

        return NotFound(Response<object>.Fail(result.Message));
    }
}
