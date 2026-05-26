using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;
using Veterinaria.Web.Models.Dto;
using System;
using System.Linq;
using System.Threading.Tasks;
using Veterinaria.Application.DTOs;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class VeterinariosController : ControllerBase
{
    private readonly IVeterinarioService _veterinarioService;
    private readonly IMapper _mapper;

    public VeterinariosController(IVeterinarioService veterinarioService, IMapper mapper)
    {
        _veterinarioService = veterinarioService;
        _mapper = mapper;
    }

    [HttpGet]
    public ActionResult<Response<object>> Index(string? especialidad, string? q, int page = 1)
    {
        var veterinariosEntities = _veterinarioService.GetVeterinarios(especialidad, q);

        // Calcular citas de esta semana para cada veterinario
        var inicioSemana = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek);
        var finSemana = inicioSemana.AddDays(7);

        var veterinarios = veterinariosEntities.ToList();
        
        var veterinariosConCitas = veterinarios.Select(v => new VeterinarioConCitasViewModel
        {
            Veterinario = _mapper.Map<VeterinarioDto>(v),
            CitasEstaSemana = v.Citas.Count(c => c.FechaHora >= inicioSemana && c.FechaHora < finSemana)
        }).ToList();

        // Obtener lista de especialidades para el filtro
        var especialidades = _veterinarioService.GetEspecialidades();

        var result = new
        {
            Veterinarios = veterinariosConCitas,
            Especialidades = especialidades,
            CurrentFilter = q,
            CurrentEspecialidad = especialidad
        };

        return Ok(Response<object>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Response<object>>> Details(int id)
    {
        var veterinario = await _veterinarioService.GetVeterinarioWithCitasAsync(id);

        if (veterinario == null)
        {
            return NotFound(Response<object>.Fail("Veterinario no encontrado."));
        }

        var veterinarioDto = _mapper.Map<VeterinarioDto>(veterinario);
        
        // Citas de esta semana
        var inicioSemana = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek);
        var finSemana = inicioSemana.AddDays(7);
        
        var citasEstaSemana = veterinario.Citas
            .Where(c => c.FechaHora >= inicioSemana && c.FechaHora < finSemana)
            .OrderBy(c => c.FechaHora)
            .ToList();

        var citasProximas = veterinario.Citas
            .Where(c => c.FechaHora >= DateTime.Now && c.Estado != "Cancelada")
            .OrderBy(c => c.FechaHora)
            .Take(10)
            .ToList();

        var result = new
        {
            Veterinario = veterinarioDto,
            CitasEstaSemana = citasEstaSemana,
            CitasProximas = citasProximas
        };

        return Ok(Response<object>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<Response<object>>> Create([FromBody] VeterinarioDto veterinarioDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos inválidos."));
        }

        var veterinario = _mapper.Map<Veterinario>(veterinarioDto);
        veterinario.Activo = true;

        await _veterinarioService.AddVeterinarioAsync(veterinario);

        return Ok(Response<object>.Ok("Veterinario creado exitosamente."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Response<object>>> Edit(int id, [FromBody] VeterinarioDto veterinarioDto)
    {
        if (id != veterinarioDto.Id)
        {
            return BadRequest(Response<object>.Fail("El ID no coincide."));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos inválidos."));
        }

        var veterinario = await _veterinarioService.GetVeterinarioByIdAsync(id);
        if (veterinario == null)
        {
            return NotFound(Response<object>.Fail("Veterinario no encontrado."));
        }

        _mapper.Map(veterinarioDto, veterinario);
        await _veterinarioService.UpdateVeterinarioAsync(veterinario);

        return Ok(Response<object>.Ok("Veterinario actualizado exitosamente."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<Response<object>>> Delete(int id)
    {
        var veterinario = await _veterinarioService.GetVeterinarioWithCitasAsync(id);
        if (veterinario == null)
        {
            return NotFound(Response<object>.Fail("Veterinario no encontrado."));
        }

        if (veterinario.Citas.Any())
        {
            return BadRequest(Response<object>.Fail("No se puede eliminar el veterinario porque tiene citas asociadas."));
        }

        var deleted = await _veterinarioService.DeleteVeterinarioAsync(id);
        if (!deleted)
        {
            return BadRequest(Response<object>.Fail("Error al eliminar el veterinario."));
        }

        return Ok(Response<object>.Ok("Veterinario eliminado exitosamente."));
    }
}

// ViewModel para mostrar veterinarios con cantidad de citas
public class VeterinarioConCitasViewModel
{
    public VeterinarioDto Veterinario { get; set; } = default!;
    public int CitasEstaSemana { get; set; }
}
