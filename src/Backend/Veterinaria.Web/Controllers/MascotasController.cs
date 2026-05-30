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

[Authorize(Roles = "Admin,Recepcionista,Veterinario,Cliente,Usuario")]
[ApiController]
[Route("api/[controller]")]
public class MascotasController : ControllerBase
{
    private readonly IMascotaService _mascotaService;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditoriaService _auditoriaService;

    public MascotasController(IMascotaService mascotaService, IMapper mapper, IUnitOfWork unitOfWork, IAuditoriaService auditoriaService)
    {
        _mascotaService = mascotaService;
        _mapper = mapper;
        _unitOfWork = unitOfWork;
        _auditoriaService = auditoriaService;
    }

    [HttpGet]
    public async Task<ActionResult<Response<object>>> Index([FromQuery] string? q, [FromQuery] int page = 1)
    {
        var query = _mascotaService.GetActiveMascotasWithUsuariosQuery();

        if (User.IsInRole("Cliente") || User.IsInRole("Usuario"))
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
        var citasDto = _mapper.Map<List<CitaDto>>(citas);

        // RF-11 — Historial de atenciones clínicas
        var historiales = mascota.Citas
            .Where(c => c.Historial != null)
            .OrderByDescending(c => c.FechaHora)
            .Select(c => {
                var h = c.Historial!;
                h.Cita = c; // Ensure Cita navigation is set for DTO mapping
                return h;
            })
            .ToList();
        var historialesDto = _mapper.Map<List<HistorialClinicoDto>>(historiales);

        // RF-11 — Alertas visibles (Alergias, Condición Crónica, Última Vacuna)
        var ultimaVacuna = mascota.Citas
            .Where(c => c.Estado == "Completada" && 
                       (c.Servicio.Nombre.ToLower().Contains("vacuna") || 
                        (c.Historial != null && (c.Historial.Tratamiento ?? "").ToLower().Contains("vacuna"))))
            .OrderByDescending(c => c.FechaHora)
            .Select(c => c.FechaHora.ToString("dd/MM/yyyy"))
            .FirstOrDefault();

        var alertas = new
        {
            Alergias = mascota.AlergiasConocidas ?? "Ninguna registrada",
            CondicionCronica = (mascota.ObservacionesGenerales ?? "").ToLower().Contains("crónic") || 
                               (mascota.ObservacionesGenerales ?? "").ToLower().Contains("cronic")
                               ? mascota.ObservacionesGenerales 
                               : "Ninguna identificada",
            UltimaVacuna = ultimaVacuna ?? "Ninguna registrada"
        };

        return Ok(Response<object>.Ok(new { 
            Mascota = mascotaDto, 
            Citas = citasDto, 
            Historiales = historialesDto,
            Alertas = alertas
        }));
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
        // Asignar dinámicamente el UsuarioId del cliente logueado si no se especificó o si es rol Usuario/Cliente
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var usuario = await _unitOfWork.Usuarios.GetAll()
            .FirstOrDefaultAsync(u => u.ApplicationUserId == userId);

        if (usuario != null && (!User.IsInRole("Admin") || mascotaDto.UsuarioId == 0))
        {
            mascotaDto.UsuarioId = usuario.Id;
        }
        else if (mascotaDto.UsuarioId == 0)
        {
            mascotaDto.UsuarioId = 1; // Fallback para Admin si no seleccionó propietario
        }

        // Limpiar el ModelState para evitar errores de validación si no venía el UsuarioId en la petición inicial
        ModelState.Clear();
        TryValidateModel(mascotaDto);

        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos inválidos para la mascota."));
        }

        var mascota = _mapper.Map<Mascota>(mascotaDto);
        mascota.Activo = true;

        await _mascotaService.AddMascotaAsync(mascota);

        // Mapear la entidad guardada de base de datos de vuelta al DTO para incluir el ID auto-generado
        var resultDto = _mapper.Map<MascotaDto>(mascota);

        return Ok(Response<object>.Ok(resultDto, "Mascota creada exitosamente."));
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

        var oldUsuarioId = mascota.UsuarioId;

        _mapper.Map(mascotaDto, mascota);
        await _mascotaService.UpdateMascotaAsync(mascota);

        // RF-14: Audit owner changes
        if (oldUsuarioId != mascota.UsuarioId)
        {
            await _auditoriaService.RegistrarAccionAsync(
                "Cambio de Propietario",
                "Mascota",
                mascota.Id.ToString(),
                $"Se cambió el propietario de la mascota '{mascota.Nombre}' del UsuarioId {oldUsuarioId} al UsuarioId {mascota.UsuarioId}."
            );
        }

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
