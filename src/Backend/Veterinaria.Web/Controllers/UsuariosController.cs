using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;
using Veterinaria.Infrastructure.Persistence;
using Veterinaria.Web.Models.Dto;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly VeterinariaDbContext _context;
    private readonly IAuditoriaService _auditoriaService;

    public UsuariosController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        VeterinariaDbContext context,
        IAuditoriaService auditoriaService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _auditoriaService = auditoriaService;
    }

    [HttpGet]
    public async Task<ActionResult<Response<List<UsuarioDto>>>> GetUsuarios()
    {
        var usuarios = await _context.Usuarios
            .OrderByDescending(u => u.FechaRegistro)
            .Select(u => new UsuarioDto
            {
                Id = u.Id,
                Nombre = u.Nombre,
                Email = u.Email,
                DNI = u.DNI,
                Telefono = u.Telefono,
                Direccion = u.Direccion,
                Rol = u.Rol,
                Activo = u.Activo,
                FechaRegistro = u.FechaRegistro
            })
            .ToListAsync();

        return Ok(Response<List<UsuarioDto>>.Ok(usuarios, "Usuarios recuperados con éxito."));
    }

    [HttpPost]
    public async Task<ActionResult<Response<object>>> CrearUsuario([FromBody] CrearUsuarioRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos de registro inválidos."));
        }

        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return BadRequest(Response<object>.Fail("El correo electrónico ya está registrado."));
        }

        var appUser = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            NombreCompleto = request.Nombre,
            FechaRegistro = DateTime.UtcNow,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(appUser, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(Response<object>.Fail("Error al crear el usuario de identidad: " + string.Join(", ", result.Errors.Select(e => e.Description))));
        }

        // Asegurar que el rol exista
        if (!await _roleManager.RoleExistsAsync(request.Rol))
        {
            await _roleManager.CreateAsync(new IdentityRole(request.Rol));
        }

        // Asignar el rol
        await _userManager.AddToRoleAsync(appUser, request.Rol);

        // Crear la entidad de dominio de Usuario
        var domainUser = new Usuario
        {
            ApplicationUserId = appUser.Id,
            Nombre = request.Nombre,
            Email = request.Email,
            DNI = request.DNI,
            Telefono = request.Telefono,
            Direccion = request.Direccion,
            Rol = request.Rol,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };

        _context.Usuarios.Add(domainUser);

        // Si el rol es Veterinario, crear también la entidad Veterinario
        if (request.Rol.Equals("Veterinario", StringComparison.OrdinalIgnoreCase))
        {
            var existeVet = await _context.Veterinarios.AnyAsync(v => v.Email == request.Email);
            if (!existeVet)
            {
                var veterinario = new Veterinario
                {
                    Nombre = request.Nombre,
                    Email = request.Email,
                    Telefono = request.Telefono,
                    Especialidad = "Medicina General",
                    HorarioInicio = new TimeSpan(9, 0, 0),
                    HorarioFin = new TimeSpan(18, 0, 0),
                    Activo = true
                };
                _context.Veterinarios.Add(veterinario);
            }
        }

        await _context.SaveChangesAsync();

        // Registrar la auditoría
        await _auditoriaService.RegistrarAccionAsync(
            "Crear Usuario",
            "Usuario",
            domainUser.Id.ToString(),
            $"Se creó la cuenta del usuario {request.Email} con el rol {request.Rol}"
        );

        return Ok(Response<object>.Ok(new { Id = domainUser.Id, Email = domainUser.Email }, "Usuario interno creado con éxito."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Response<object>>> EditarUsuario(int id, [FromBody] EditarUsuarioRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos de edición inválidos."));
        }

        var domainUser = await _context.Usuarios.FindAsync(id);
        if (domainUser == null)
        {
            return NotFound(Response<object>.Fail("Usuario no encontrado."));
        }

        var appUser = await _userManager.FindByIdAsync(domainUser.ApplicationUserId ?? string.Empty);
        if (appUser == null)
        {
            return NotFound(Response<object>.Fail("Cuenta de identidad asociada no encontrada."));
        }

        string rolAnterior = domainUser.Rol;

        // Actualizar datos en Identity
        appUser.NombreCompleto = request.Nombre;
        await _userManager.UpdateAsync(appUser);

        // Actualizar roles en Identity si cambió de rol
        if (!rolAnterior.Equals(request.Rol, StringComparison.OrdinalIgnoreCase))
        {
            var rolesActuales = await _userManager.GetRolesAsync(appUser);
            await _userManager.RemoveFromRolesAsync(appUser, rolesActuales);

            if (!await _roleManager.RoleExistsAsync(request.Rol))
            {
                await _roleManager.CreateAsync(new IdentityRole(request.Rol));
            }
            await _userManager.AddToRoleAsync(appUser, request.Rol);
        }

        // Actualizar datos en Dominio
        domainUser.Nombre = request.Nombre;
        domainUser.Telefono = request.Telefono;
        domainUser.DNI = request.DNI;
        domainUser.Direccion = request.Direccion;
        domainUser.Rol = request.Rol;

        // Sincronizar Veterinario si corresponde
        var veterinario = await _context.Veterinarios.FirstOrDefaultAsync(v => v.Email == domainUser.Email);
        if (veterinario != null)
        {
            veterinario.Nombre = request.Nombre;
            veterinario.Telefono = request.Telefono;

            // Si ya no es veterinario, lo desactivamos en la tabla de veterinarios para que no se le agenden citas
            if (!request.Rol.Equals("Veterinario", StringComparison.OrdinalIgnoreCase))
            {
                veterinario.Activo = false;
            }
        }
        else if (request.Rol.Equals("Veterinario", StringComparison.OrdinalIgnoreCase))
        {
            // Si se le cambió el rol a Veterinario pero no tiene registro en Veterinarios, se lo creamos
            var nuevoVet = new Veterinario
            {
                Nombre = request.Nombre,
                Email = domainUser.Email,
                Telefono = request.Telefono,
                Especialidad = "Medicina General",
                HorarioInicio = new TimeSpan(9, 0, 0),
                HorarioFin = new TimeSpan(18, 0, 0),
                Activo = true
            };
            _context.Veterinarios.Add(nuevoVet);
        }

        await _context.SaveChangesAsync();

        // Registrar la auditoría
        await _auditoriaService.RegistrarAccionAsync(
            "Editar Usuario",
            "Usuario",
            domainUser.Id.ToString(),
            $"Se actualizó la cuenta de {domainUser.Email}. Nombre, datos de contacto y rol cambiados (de {rolAnterior} a {request.Rol})."
        );

        return Ok(Response<object>.Ok(null, "Usuario actualizado correctamente."));
    }

    [HttpPut("{id}/estado")]
    public async Task<ActionResult<Response<object>>> CambiarEstado(int id, [FromBody] CambiarEstadoRequest request)
    {
        var domainUser = await _context.Usuarios.FindAsync(id);
        if (domainUser == null)
        {
            return NotFound(Response<object>.Fail("Usuario no encontrado."));
        }

        if (domainUser.Email.Equals("admin@veterinaria.com", StringComparison.OrdinalIgnoreCase) && !request.Activo)
        {
            return BadRequest(Response<object>.Fail("No se puede desactivar la cuenta del administrador principal."));
        }

        domainUser.Activo = request.Activo;

        // Sincronizar con Veterinario si es que existe
        var veterinario = await _context.Veterinarios.FirstOrDefaultAsync(v => v.Email == domainUser.Email);
        if (veterinario != null)
        {
            veterinario.Activo = request.Activo;
        }

        await _context.SaveChangesAsync();

        // Registrar la auditoría
        await _auditoriaService.RegistrarAccionAsync(
            request.Activo ? "Activar Usuario" : "Desactivar Usuario",
            "Usuario",
            domainUser.Id.ToString(),
            $"Se cambió el estado del usuario {domainUser.Email} a {(request.Activo ? "Activo" : "Inactivo")}."
        );

        return Ok(Response<object>.Ok(null, $"Usuario {(request.Activo ? "activado" : "desactivado")} correctamente."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<Response<object>>> EliminarUsuario(int id)
    {
        var domainUser = await _context.Usuarios.FindAsync(id);
        if (domainUser == null)
        {
            return NotFound(Response<object>.Fail("Usuario no encontrado."));
        }

        if (domainUser.Email.Equals("admin@veterinaria.com", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(Response<object>.Fail("No se puede eliminar al administrador principal del sistema."));
        }

        // VALIDACIÓN DE HISTORIAL (Eliminación segura)
        // 1. Verificar si tiene mascotas con citas, triajes o historiales
        var tieneMascotas = await _context.Mascotas.AnyAsync(m => m.UsuarioId == id);
        if (tieneMascotas)
        {
            var tieneCitas = await _context.Citas.AnyAsync(c => c.Mascota.UsuarioId == id);
            var tieneTriajes = await _context.Triages.AnyAsync(t => t.Mascota.UsuarioId == id);
            var tieneHistorial = await _context.HistorialesClinicos.AnyAsync(h => h.Cita.Mascota.UsuarioId == id);
            var tienePagos = await _context.Pagos.AnyAsync(p => p.Cita.Mascota.UsuarioId == id);

            if (tieneCitas || tieneTriajes || tieneHistorial || tienePagos)
            {
                return BadRequest(Response<object>.Fail(
                    "No se puede eliminar el usuario porque posee historial clínico, de citas o de pagos activo de sus mascotas. " +
                    "Por seguridad del negocio, utiliza la desactivación lógica en su lugar."));
            }
        }

        // 2. Si el usuario es Veterinario, verificar si tiene citas agendadas
        var veterinario = await _context.Veterinarios.FirstOrDefaultAsync(v => v.Email == domainUser.Email);
        if (veterinario != null)
        {
            var tieneCitasVet = await _context.Citas.AnyAsync(c => c.VeterinarioId == veterinario.Id);
            if (tieneCitasVet)
            {
                return BadRequest(Response<object>.Fail(
                    "No se puede eliminar el usuario porque es un veterinario con historial de citas registradas. " +
                    "Por seguridad del negocio, utiliza la desactivación lógica en su lugar."));
            }

            // Si está libre de citas, eliminar el registro de veterinario
            _context.Veterinarios.Remove(veterinario);
        }

        // Si tiene mascotas libres de citas, se eliminan las mascotas primero
        if (tieneMascotas)
        {
            var mascotas = await _context.Mascotas.Where(m => m.UsuarioId == id).ToListAsync();
            _context.Mascotas.RemoveRange(mascotas);
        }

        // 3. Eliminar el usuario de dominio
        _context.Usuarios.Remove(domainUser);

        // 4. Eliminar el usuario de Identity
        var appUser = await _userManager.FindByIdAsync(domainUser.ApplicationUserId ?? string.Empty);
        if (appUser != null)
        {
            var result = await _userManager.DeleteAsync(appUser);
            if (!result.Succeeded)
            {
                return BadRequest(Response<object>.Fail("Error al eliminar la cuenta de identidad: " + string.Join(", ", result.Errors.Select(e => e.Description))));
            }
        }

        await _context.SaveChangesAsync();

        // Registrar la auditoría
        await _auditoriaService.RegistrarAccionAsync(
            "Eliminar Usuario",
            "Usuario",
            id.ToString(),
            $"Se eliminó físicamente el usuario {domainUser.Email} y sus registros asociados libres de historial."
        );

        return Ok(Response<object>.Ok(null, "Usuario eliminado físicamente del sistema de forma segura."));
    }
}

public class CrearUsuarioRequest
{
    [Required(ErrorMessage = "El nombre es requerido")]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El email es requerido")]
    [EmailAddress(ErrorMessage = "Formato de email incorrecto")]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es requerida")]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
    public string Password { get; set; } = string.Empty;

    public string? DNI { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }

    [Required(ErrorMessage = "El rol es requerido")]
    public string Rol { get; set; } = "Usuario";
}

public class EditarUsuarioRequest
{
    [Required(ErrorMessage = "El nombre es requerido")]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    public string? DNI { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }

    [Required(ErrorMessage = "El rol es requerido")]
    public string Rol { get; set; } = "Usuario";
}

public class CambiarEstadoRequest
{
    [Required]
    public bool Activo { get; set; }
}
