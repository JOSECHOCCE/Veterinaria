using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;
using Veterinaria.Web.Models.Dto;
using System.Linq;
using System.Threading.Tasks;
using Veterinaria.Application.DTOs;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
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
    public ActionResult<Response<object>> Index(string? q, bool? mostrarInactivos, int page = 1)
    {
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
    public async Task<ActionResult<Response<object>>> Create([FromBody] ServicioDto servicioDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos inválidos."));
        }

        var existeNombre = await _servicioService.ExistsNombreAsync(servicioDto.Nombre);

        if (existeNombre)
        {
            return BadRequest(Response<object>.Fail("Ya existe un servicio con este nombre."));
        }

        var servicio = _mapper.Map<Servicio>(servicioDto);
        servicio.Activo = true;

        await _servicioService.AddServicioAsync(servicio);

        return Ok(Response<object>.Ok("Servicio creado exitosamente."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Response<object>>> Edit(int id, [FromBody] ServicioDto servicioDto)
    {
        if (id != servicioDto.Id)
        {
            return BadRequest(Response<object>.Fail("El ID no coincide."));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos inválidos."));
        }

        var existeNombre = await _servicioService.ExistsNombreAsync(servicioDto.Nombre, id);

        if (existeNombre)
        {
            return BadRequest(Response<object>.Fail("Ya existe un servicio con este nombre."));
        }

        var servicio = await _servicioService.GetServicioByIdAsync(id);
        if (servicio == null)
        {
            return NotFound(Response<object>.Fail("Servicio no encontrado."));
        }

        _mapper.Map(servicioDto, servicio);
        await _servicioService.UpdateServicioAsync(servicio);

        return Ok(Response<object>.Ok("Servicio actualizado exitosamente."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<Response<object>>> Delete(int id)
    {
        var servicio = await _servicioService.GetServicioWithCitasAsync(id);
        if (servicio == null)
        {
            return NotFound(Response<object>.Fail("Servicio no encontrado."));
        }
        
        if (servicio.Citas.Any())
        {
            return BadRequest(Response<object>.Fail("No se puede eliminar el servicio porque tiene citas asociadas. Puede desactivarlo en su lugar."));
        }

        var deleted = await _servicioService.DeleteServicioAsync(id);

        if (!deleted)
        {
            return BadRequest(Response<object>.Fail("Error al eliminar el servicio."));
        }

        return Ok(Response<object>.Ok("Servicio eliminado exitosamente."));
    }

    [HttpPost("ToggleActivo/{id}")]
    public async Task<ActionResult<Response<object>>> ToggleActivo(int id)
    {
        var servicio = await _servicioService.GetServicioByIdAsync(id);
        if (servicio == null)
        {
            return NotFound(Response<object>.Fail("Servicio no encontrado."));
        }

        await _servicioService.ToggleActivoAsync(id);

        var message = !servicio.Activo 
            ? "Servicio activado exitosamente." 
            : "Servicio desactivado exitosamente.";

        return Ok(Response<object>.Ok(message));
    }

    // Método auxiliar para formatear duración (maybe can be removed or kept as public static)
    public static string FormatearDuracion(int minutos)
    {
        if (minutos < 60)
        {
            return $"{minutos} min";
        }

        var horas = minutos / 60;
        var mins = minutos % 60;

        if (mins == 0)
        {
            return horas == 1 ? "1 hora" : $"{horas} horas";
        }

        return horas == 1 
            ? $"1 hora {mins} min" 
            : $"{horas} horas {mins} min";
    }
}
