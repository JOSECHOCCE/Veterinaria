using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class UsuarioService : IUsuarioService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditoriaService _auditoriaService;

    public UsuarioService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IUnitOfWork unitOfWork,
        IAuditoriaService auditoriaService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _unitOfWork = unitOfWork;
        _auditoriaService = auditoriaService;
    }

    public async Task<Response<List<UsuarioDetailsDto>>> GetUsuariosAsync()
    {
        var usuarios = await _unitOfWork.Usuarios.GetAll()
            .OrderByDescending(u => u.FechaRegistro)
            .Select(u => new UsuarioDetailsDto
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

        return Response<List<UsuarioDetailsDto>>.Ok(usuarios, "Usuarios recuperados con éxito.");
    }

    public async Task<Response<object>> CrearUsuarioAsync(CrearUsuarioDto request)
    {
        if (request == null)
        {
            return Response<object>.Fail("Datos de registro inválidos.");
        }

        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return Response<object>.Fail("El correo electrónico ya está registrado.");
        }

        // Verificar también en el dominio
        var existingDomainUser = await _unitOfWork.Usuarios.GetAll()
            .AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (existingDomainUser)
        {
            return Response<object>.Fail("El correo electrónico ya está registrado en la base de datos.");
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
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return Response<object>.Fail($"Error al crear el usuario de identidad: {errors}");
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

        await _unitOfWork.Usuarios.AddAsync(domainUser);

        // Si el rol es Veterinario, crear también la entidad Veterinario
        if (request.Rol.Equals("Veterinario", StringComparison.OrdinalIgnoreCase))
        {
            var existeVet = await _unitOfWork.Veterinarios.GetAll().AnyAsync(v => v.Email == request.Email);
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
                await _unitOfWork.Veterinarios.AddAsync(veterinario);
            }
        }

        await _unitOfWork.CommitAsync();

        // Registrar la auditoría
        await _auditoriaService.RegistrarAccionAsync(
            "Crear Usuario",
            "Usuario",
            domainUser.Id.ToString(),
            $"Se creó la cuenta del usuario {request.Email} con el rol {request.Rol}"
        );

        var responseData = new { Id = domainUser.Id, Email = domainUser.Email };
        return Response<object>.Ok(responseData, "Usuario interno creado con éxito.");
    }

    public async Task<Response<object>> EditarUsuarioAsync(int id, EditarUsuarioDto request)
    {
        if (request == null)
        {
            return Response<object>.Fail("Datos de edición inválidos.");
        }

        var domainUser = await _unitOfWork.Usuarios.GetByIdAsync(id);
        if (domainUser == null)
        {
            return Response<object>.Fail("Usuario no encontrado.");
        }

        var appUser = await _userManager.FindByIdAsync(domainUser.ApplicationUserId ?? string.Empty);
        if (appUser == null)
        {
            return Response<object>.Fail("Cuenta de identidad asociada no encontrada.");
        }

        string rolAnterior = domainUser.Rol;

        // Actualizar datos en Identity
        appUser.NombreCompleto = request.Nombre;
        var identityResult = await _userManager.UpdateAsync(appUser);
        if (!identityResult.Succeeded)
        {
            var errors = string.Join(", ", identityResult.Errors.Select(e => e.Description));
            return Response<object>.Fail($"Error al actualizar la identidad del usuario: {errors}");
        }

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

        _unitOfWork.Usuarios.Update(domainUser);

        // Sincronizar Veterinario si corresponde
        var veterinario = await _unitOfWork.Veterinarios.GetAll().FirstOrDefaultAsync(v => v.Email == domainUser.Email);
        if (veterinario != null)
        {
            veterinario.Nombre = request.Nombre;
            veterinario.Telefono = request.Telefono;

            // Si ya no es veterinario, lo desactivamos en la tabla de veterinarios para que no se le agenden citas
            if (!request.Rol.Equals("Veterinario", StringComparison.OrdinalIgnoreCase))
            {
                veterinario.Activo = false;
            }
            _unitOfWork.Veterinarios.Update(veterinario);
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
            await _unitOfWork.Veterinarios.AddAsync(nuevoVet);
        }

        await _unitOfWork.CommitAsync();

        // Registrar la auditoría
        await _auditoriaService.RegistrarAccionAsync(
            "Editar Usuario",
            "Usuario",
            domainUser.Id.ToString(),
            $"Se actualizó la cuenta de {domainUser.Email}. Nombre, datos de contacto y rol cambiados (de {rolAnterior} a {request.Rol})."
        );

        return Response<object>.Ok(null, "Usuario actualizado correctamente.");
    }

    public async Task<Response<object>> CambiarEstadoAsync(int id, bool activo)
    {
        var domainUser = await _unitOfWork.Usuarios.GetByIdAsync(id);
        if (domainUser == null)
        {
            return Response<object>.Fail("Usuario no encontrado.");
        }

        if (domainUser.Email.Equals("admin@veterinaria.com", StringComparison.OrdinalIgnoreCase) && !activo)
        {
            return Response<object>.Fail("No se puede desactivar la cuenta del administrador principal.");
        }

        domainUser.Activo = activo;
        _unitOfWork.Usuarios.Update(domainUser);

        // Sincronizar con Veterinario si es que existe
        var veterinario = await _unitOfWork.Veterinarios.GetAll().FirstOrDefaultAsync(v => v.Email == domainUser.Email);
        if (veterinario != null)
        {
            veterinario.Activo = activo;
            _unitOfWork.Veterinarios.Update(veterinario);
        }

        await _unitOfWork.CommitAsync();

        // Registrar la auditoría
        await _auditoriaService.RegistrarAccionAsync(
            activo ? "Activar Usuario" : "Desactivar Usuario",
            "Usuario",
            domainUser.Id.ToString(),
            $"Se cambió el estado del usuario {domainUser.Email} a {(activo ? "Activo" : "Inactivo")}."
        );

        return Response<object>.Ok(null, $"Usuario {(activo ? "activado" : "desactivado")} correctamente.");
    }

    public async Task<Response<object>> EliminarUsuarioAsync(int id)
    {
        var domainUser = await _unitOfWork.Usuarios.GetByIdAsync(id);
        if (domainUser == null)
        {
            return Response<object>.Fail("Usuario no encontrado.");
        }

        if (domainUser.Email.Equals("admin@veterinaria.com", StringComparison.OrdinalIgnoreCase))
        {
            return Response<object>.Fail("No se puede eliminar al administrador principal del sistema.");
        }

        // VALIDACIÓN DE HISTORIAL (Eliminación segura)
        // 1. Verificar si tiene mascotas con citas, triajes o historiales
        var tieneMascotas = await _unitOfWork.Mascotas.GetAll().AnyAsync(m => m.UsuarioId == id);
        if (tieneMascotas)
        {
            var tieneCitas = await _unitOfWork.Citas.GetAll().AnyAsync(c => c.Mascota.UsuarioId == id);
            var tieneTriajes = await _unitOfWork.Triages.GetAll().AnyAsync(t => t.Mascota.UsuarioId == id);
            var tieneHistorial = await _unitOfWork.HistorialesClinicos.GetAll().AnyAsync(h => h.Cita.Mascota.UsuarioId == id);
            var tienePagos = await _unitOfWork.Pagos.GetAll().AnyAsync(p => p.Cita.Mascota.UsuarioId == id);

            if (tieneCitas || tieneTriajes || tieneHistorial || tienePagos)
            {
                return Response<object>.Fail(
                    "No se puede eliminar el usuario porque posee historial clínico, de citas o de pagos activo de sus mascotas. " +
                    "Por seguridad del negocio, utiliza la desactivación lógica en su lugar.");
            }
        }

        // 2. Si el usuario es Veterinario, verificar si tiene citas agendadas
        var veterinario = await _unitOfWork.Veterinarios.GetAll().FirstOrDefaultAsync(v => v.Email == domainUser.Email);
        if (veterinario != null)
        {
            var tieneCitasVet = await _unitOfWork.Citas.GetAll().AnyAsync(c => c.VeterinarioId == veterinario.Id);
            if (tieneCitasVet)
            {
                return Response<object>.Fail(
                    "No se puede eliminar el usuario porque es un veterinario con historial de citas registradas. " +
                    "Por seguridad del negocio, utiliza la desactivación lógica en su lugar.");
            }

            // Si está libre de citas, eliminar el registro de veterinario
            _unitOfWork.Veterinarios.Remove(veterinario);
        }

        // Si tiene mascotas libres de citas, se eliminan las mascotas primero
        if (tieneMascotas)
        {
            var mascotas = await _unitOfWork.Mascotas.GetAll().Where(m => m.UsuarioId == id).ToListAsync();
            foreach (var mascota in mascotas)
            {
                _unitOfWork.Mascotas.Remove(mascota);
            }
        }

        // 3. Eliminar el usuario de dominio
        _unitOfWork.Usuarios.Remove(domainUser);

        // 4. Eliminar el usuario de Identity
        var appUser = await _userManager.FindByIdAsync(domainUser.ApplicationUserId ?? string.Empty);
        if (appUser != null)
        {
            var result = await _userManager.DeleteAsync(appUser);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return Response<object>.Fail($"Error al eliminar la cuenta de identidad: {errors}");
            }
        }

        await _unitOfWork.CommitAsync();

        // Registrar la auditoría
        await _auditoriaService.RegistrarAccionAsync(
            "Eliminar Usuario",
            "Usuario",
            id.ToString(),
            $"Se eliminó físicamente el usuario {domainUser.Email} y sus registros asociados libres de historial."
        );

        return Response<object>.Ok(null, "Usuario eliminado físicamente del sistema de forma segura.");
    }
}
