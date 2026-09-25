using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Veterinaria.Application.DTOs;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Web.Controllers;

public class ListaEsperaDto
{
    public int MascotaId { get; set; }
    public int ServicioId { get; set; }
    public int? VeterinarioPreferidoId { get; set; }
    public DateTime FechaDeseada { get; set; }
    public DateTime FechaDeseadaFin { get; set; }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ListaEsperaController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<ApplicationUser> _userManager;

    public ListaEsperaController(IUnitOfWork unitOfWork, UserManager<ApplicationUser> userManager)
    {
        _unitOfWork = unitOfWork;
        _userManager = userManager;
    }

    private async Task<int?> GetCurrentUsuarioIdAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return null;
        var usuario = await _unitOfWork.Usuarios.GetAll()
            .FirstOrDefaultAsync(u => u.ApplicationUserId == userId);
        return usuario?.Id;
    }

    /// <summary>
    /// POST /api/lista-espera — Add an entry to the waitlist.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Response<object>>> Create([FromBody] ListaEsperaDto dto)
    {
        var usuarioId = await GetCurrentUsuarioIdAsync();
        if (usuarioId == null) return Unauthorized();

        // Validate mascota belongs to user (unless admin)
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Recepcionista");
        if (!isAdmin)
        {
            var mascota = await _unitOfWork.Mascotas.GetByIdAsync(dto.MascotaId);
            if (mascota == null || mascota.UsuarioId != usuarioId.Value)
                return BadRequest(Response<object>.Fail("Mascota no válida."));
        }

        if (dto.FechaDeseadaFin < dto.FechaDeseada)
            return BadRequest(Response<object>.Fail("La fecha fin debe ser posterior a la fecha inicio."));

        var entry = new ListaEspera
        {
            MascotaId = dto.MascotaId,
            ServicioId = dto.ServicioId,
            VeterinarioPreferidoId = dto.VeterinarioPreferidoId,
            FechaDeseada = dto.FechaDeseada,
            FechaDeseadaFin = dto.FechaDeseadaFin,
            Estado = "Pendiente",
            FechaCreacion = DateTime.UtcNow
        };

        await _unitOfWork.ListaEsperas.AddAsync(entry);
        await _unitOfWork.CommitAsync();

        return StatusCode(201, Response<object>.Ok(new
        {
            entry.Id,
            entry.Estado,
            entry.FechaCreacion
        }));
    }

    /// <summary>
    /// GET /api/lista-espera — List waitlist entries for the current user.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<Response<object>>> GetAll([FromQuery] int? mascotaId)
    {
        var usuarioId = await GetCurrentUsuarioIdAsync();
        if (usuarioId == null) return Unauthorized();

        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Recepcionista");

        var query = _unitOfWork.ListaEsperas.GetAll()
            .Include(le => le.Mascota)
            .Include(le => le.Servicio)
            .AsQueryable();

        if (!isAdmin)
        {
            query = query.Where(le => le.Mascota.UsuarioId == usuarioId.Value);
        }

        if (mascotaId.HasValue)
        {
            query = query.Where(le => le.MascotaId == mascotaId.Value);
        }

        var entries = await query
            .OrderByDescending(le => le.FechaCreacion)
            .Select(le => new
            {
                le.Id,
                le.MascotaId,
                MascotaNombre = le.Mascota.Nombre,
                le.ServicioId,
                ServicioNombre = le.Servicio.Nombre,
                le.VeterinarioPreferidoId,
                le.FechaDeseada,
                le.FechaDeseadaFin,
                le.Estado,
                le.FechaCreacion,
                le.FechaNotificacion
            })
            .ToListAsync();

        return Ok(Response<object>.Ok(entries));
    }

    /// <summary>
    /// DELETE /api/lista-espera/{id} — Cancel/remove a waitlist entry.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var usuarioId = await GetCurrentUsuarioIdAsync();
        if (usuarioId == null) return Unauthorized();

        var entry = await _unitOfWork.ListaEsperas.GetByIdAsync(id);
        if (entry == null) return NotFound();

        // Validate ownership
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Recepcionista");
        if (!isAdmin)
        {
            var mascota = await _unitOfWork.Mascotas.GetByIdAsync(entry.MascotaId);
            if (mascota == null || mascota.UsuarioId != usuarioId.Value)
                return Forbid();
        }

        if (entry.Estado != "Pendiente" && entry.Estado != "Notificada")
            return BadRequest(Response<object>.Fail("Solo se pueden cancelar entradas en estado Pendiente o Notificada."));

        entry.Estado = "Cancelada";
        _unitOfWork.ListaEsperas.Update(entry);
        await _unitOfWork.CommitAsync();

        return NoContent();
    }
}
