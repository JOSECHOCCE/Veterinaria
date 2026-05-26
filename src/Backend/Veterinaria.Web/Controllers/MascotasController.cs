using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Entities;
using Veterinaria.Application.Interfaces;
using Veterinaria.Web.Models.Dto;
using Veterinaria.Application.DTOs;
using System.Security.Claims;
using System.Threading.Tasks;
using Veterinaria.Domain.Contracts;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Usuario,Admin")]
[ApiController]
[Route("api/[controller]")]
public class MascotasController : ControllerBase
{
    private readonly IMascotaService _mascotaService;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _unitOfWork;

    public MascotasController(IMascotaService mascotaService, IMapper mapper, IUnitOfWork unitOfWork)
    {
        _mascotaService = mascotaService;
        _mapper = mapper;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<ActionResult<Response<object>>> Index([FromQuery] string? q, [FromQuery] int page = 1)
    {
        var query = _mascotaService.GetActiveMascotasWithUsuariosQuery();

        if (!User.IsInRole("Admin"))
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var usuario = await _unitOfWork.Usuarios.GetAll()
                .FirstOrDefaultAsync(u => u.ApplicationUserId == userId);

            if (usuario != null)
            {
                query = query.Where(m => m.UsuarioId == usuario.Id);
            }
            else
            {
                query = query.Where(m => false); // Si no hay perfil, no retorna nada
            }
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            q = q.ToLower();
            query = query.Where(m => m.Nombre.ToLower().Contains(q) ||
                                     m.Especie.ToLower().Contains(q));
        }

        var total = await query.CountAsync();
        var mascotas = await query.OrderBy(m => m.Nombre)
            .Skip((page - 1) * 10)
            .Take(10)
            .Select(m => _mapper.Map<MascotaDto>(m))
            .ToListAsync();

        return Ok(Response<object>.Ok(new { Data = mascotas, Total = total, Page = page, PageSize = 10, CurrentFilter = q }));
    }


    [HttpGet("{id}")]
    public async Task<ActionResult<Response<object>>> Details(int id)
    {
        var mascota = await _mascotaService.GetMascotaWithDetailsAsync(id);

        if (mascota == null)
        {
            return NotFound(Response<object>.Fail("Mascota no encontrada."));
        }

        var mascotaDto = _mapper.Map<MascotaDto>(mascota);
        var citas = mascota.Citas.OrderByDescending(c => c.FechaHora).ToList();

        return Ok(Response<object>.Ok(new { Mascota = mascotaDto, Citas = citas }));
    }

    [HttpGet("Create")]
    public async Task<ActionResult<Response<object>>> Create()
    {
        var usuarios = await _mascotaService.GetActiveUsuariosAsync();
        return Ok(Response<object>.Ok(new { Usuarios = usuarios }));
    }

    [HttpPost]
    public async Task<ActionResult<Response<object>>> Create([FromBody] MascotaDto mascotaDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos inválidos."));
        }

        var mascota = _mapper.Map<Mascota>(mascotaDto);
        mascota.Activo = true;
        
        // TODO: Obtener UsuarioId desde claims cuando se implemente autenticación
        if (mascota.UsuarioId == 0)
        {
            mascota.UsuarioId = 1; // Temporal
        }

        await _mascotaService.AddMascotaAsync(mascota);

        return Ok(Response<object>.Ok(new { Message = "Mascota creada exitosamente.", Mascota = mascotaDto }));
    }

    [HttpGet("Edit/{id}")]
    public async Task<ActionResult<Response<object>>> EditGet(int id)
    {
        var mascota = await _mascotaService.GetMascotaByIdAsync(id);
        if (mascota == null)
        {
            return NotFound(Response<object>.Fail("Mascota no encontrada."));
        }

        var mascotaDto = _mapper.Map<MascotaDto>(mascota);
        var usuarios = await _mascotaService.GetActiveUsuariosAsync();
        
        return Ok(Response<object>.Ok(new { Mascota = mascotaDto, Usuarios = usuarios }));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Response<object>>> Edit(int id, [FromBody] MascotaDto mascotaDto)
    {
        if (id != mascotaDto.Id)
        {
            return BadRequest(Response<object>.Fail("El ID no coincide."));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos inválidos."));
        }

        var mascota = await _mascotaService.GetMascotaByIdAsync(id);
        if (mascota == null)
        {
            return NotFound(Response<object>.Fail("Mascota no encontrada."));
        }

        _mapper.Map(mascotaDto, mascota);
        await _mascotaService.UpdateMascotaAsync(mascota);

        return Ok(Response<object>.Ok(new { Message = "Mascota actualizada exitosamente." }));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<Response<object>>> DeleteConfirmed(int id)
    {
        var mascota = await _mascotaService.GetMascotaByIdAsync(id);
        if (mascota == null)
        {
            return NotFound(Response<object>.Fail("Mascota no encontrada."));
        }

        await _mascotaService.DeleteMascotaAsync(id);

        return Ok(Response<object>.Ok(new { Message = "Mascota eliminada exitosamente." }));
    }
}
