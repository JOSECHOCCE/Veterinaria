using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;
using Veterinaria.Application.Interfaces;
using Veterinaria.Application.DTOs;
using Microsoft.AspNetCore.Identity;

namespace Veterinaria.Application.Services;

public class ClienteService : IClienteService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<ApplicationUser> _userManager;

    public ClienteService(IUnitOfWork unitOfWork, UserManager<ApplicationUser> userManager)
    {
        _unitOfWork = unitOfWork;
        _userManager = userManager;
    }

    public async Task<(IEnumerable<Usuario> Usuarios, Dictionary<int, int> CitasPorUsuario)> GetClientesAsync(string buscar, bool mostrarInactivos)
    {
        var query = _unitOfWork.Usuarios.GetAll()
            .Include(u => u.Mascotas)
            .Where(u => u.Rol == "Cliente" || u.Rol == "Usuario") // Excluir personal interno (Admin, Recepcionista, Veterinario)
            .AsQueryable();

        // Filtrar por activos/inactivos
        if (!mostrarInactivos)
        {
            query = query.Where(u => u.Activo);
        }

        // Búsqueda
        if (!string.IsNullOrEmpty(buscar))
        {
            buscar = buscar.ToLower();
            query = query.Where(u => 
                u.Nombre.ToLower().Contains(buscar) ||
                u.Email.ToLower().Contains(buscar) ||
                (u.DNI != null && u.DNI.Contains(buscar)) ||
                (u.Telefono != null && u.Telefono.Contains(buscar)));
        }

        // Ordenar por fecha de registro
        query = query.OrderByDescending(u => u.FechaRegistro);

        var usuarios = await query.ToListAsync();
        
        // Obtener estadísticas
        var usuarioIds = usuarios.Select(u => u.Id).ToList();
        var citasPorUsuario = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Where(c => usuarioIds.Contains(c.Mascota.UsuarioId))
            .GroupBy(c => c.Mascota.UsuarioId)
            .Select(g => new { UsuarioId = g.Key, TotalCitas = g.Count() })
            .ToListAsync();

        return (usuarios, citasPorUsuario.ToDictionary(x => x.UsuarioId, x => x.TotalCitas));
    }

    public async Task<ClienteDetalleDto?> GetClienteDetailsAsync(int id)
    {
        var usuario = await _unitOfWork.Usuarios.GetAll()
            .Include(u => u.Mascotas)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (usuario == null) return null;

        var mascotaIds = usuario.Mascotas.Select(m => m.Id).ToList();
        var citas = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Include(c => c.Servicio)
            .Include(c => c.Veterinario)
            .Where(c => mascotaIds.Contains(c.MascotaId))
            .OrderByDescending(c => c.FechaHora)
            .Take(20)
            .ToListAsync();

        var todasLasCitas = await _unitOfWork.Citas.GetAll()
            .Where(c => mascotaIds.Contains(c.MascotaId))
            .ToListAsync();

        var pagos = await _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
            .Where(p => mascotaIds.Contains(p.Cita.MascotaId))
            .ToListAsync();

        var citasConPagoPendiente = todasLasCitas
            .Where(c => c.EstadoPago == "Parcial" && c.Estado == "Completada")
            .Sum(c => c.MontoTotal - c.MontoPagado);

        return new ClienteDetalleDto
        {
            Usuario = usuario,
            UltimasCitas = citas,
            TotalCitas = todasLasCitas.Count,
            CitasCompletadas = todasLasCitas.Count(c => c.Estado == "Completada"),
            CitasCanceladas = todasLasCitas.Count(c => c.Estado == "Cancelada"),
            CitasPendientes = todasLasCitas.Count(c => c.Estado == "Pendiente" || c.Estado == "Confirmada"),
            TotalGastado = pagos.Sum(p => p.Monto),
            PagosPendientes = citasConPagoPendiente
        };
    }

    public async Task<bool> ToggleActivoAsync(int id)
    {
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(id);
        if (usuario == null) return false;

        usuario.Activo = !usuario.Activo;
        _unitOfWork.Usuarios.Update(usuario);
        await _unitOfWork.CommitAsync();

        // Si se inactiva, bloquear su acceso en Identity también
        if (!string.IsNullOrEmpty(usuario.ApplicationUserId))
        {
            var appUser = await _userManager.FindByIdAsync(usuario.ApplicationUserId);
            if (appUser != null)
            {
                await _userManager.SetLockoutEnabledAsync(appUser, true);
                if (!usuario.Activo)
                {
                    await _userManager.SetLockoutEndDateAsync(appUser, DateTimeOffset.MaxValue);
                }
                else
                {
                    await _userManager.SetLockoutEndDateAsync(appUser, null);
                }
            }
        }

        return true;
    }

    public async Task<(bool Success, string Message)> DeleteCascadeAsync(int id)
    {
        var usuario = await _unitOfWork.Usuarios.GetAll()
            .Include(u => u.Mascotas)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (usuario == null) return (false, "Cliente no encontrado.");

        try
        {
            // Soft-delete en cascada: desactivar usuario y sus mascotas
            // en vez de eliminar físicamente, para preservar datos históricos
            usuario.Activo = false;
            _unitOfWork.Usuarios.Update(usuario);

            foreach (var mascota in usuario.Mascotas)
            {
                mascota.Activo = false;
                _unitOfWork.Mascotas.Update(mascota);
            }

            // Cancelar citas pendientes/confirmadas del cliente
            var mascotaIds = usuario.Mascotas.Select(m => m.Id).ToList();
            var citasPendientes = await _unitOfWork.Citas.GetAll()
                .Where(c => mascotaIds.Contains(c.MascotaId) &&
                       (c.Estado == "Pendiente" || c.Estado == "Confirmada"))
                .ToListAsync();

            foreach (var cita in citasPendientes)
            {
                cita.Estado = "Cancelada";
                _unitOfWork.Citas.Update(cita);
            }

            await _unitOfWork.CommitAsync();

            // Desactivar cuenta de Identity (lockout) sin eliminarla
            if (!string.IsNullOrEmpty(usuario.ApplicationUserId))
            {
                var appUser = await _userManager.FindByIdAsync(usuario.ApplicationUserId);
                if (appUser != null)
                {
                    await _userManager.SetLockoutEnabledAsync(appUser, true);
                    await _userManager.SetLockoutEndDateAsync(appUser, DateTimeOffset.MaxValue);
                }
            }

            return (true, $"Cliente '{usuario.Nombre}' y sus mascotas han sido desactivados.");
        }
        catch (Exception ex)
        {
            return (false, $"Error al desactivar el cliente: {ex.Message}");
        }
    }

    public async Task<List<DuplicadoDto>> DetectarDuplicadosAsync(string? dni, string? email, string? telefono, int? excluirId = null)
    {
        var duplicados = new List<DuplicadoDto>();
        var query = _unitOfWork.Usuarios.GetAll().Where(u => u.Rol == "Cliente" || u.Rol == "Usuario");
        
        if (excluirId.HasValue)
        {
            query = query.Where(u => u.Id != excluirId.Value);
        }

        var list = await query.ToListAsync();

        if (!string.IsNullOrEmpty(dni))
        {
            var match = list.FirstOrDefault(u => u.DNI == dni);
            if (match != null)
            {
                duplicados.Add(new DuplicadoDto 
                { 
                    Tipo = "DNI", 
                    Valor = dni, 
                    ClienteExistenteId = match.Id, 
                    ClienteExistenteNombre = match.Nombre 
                });
            }
        }

        if (!string.IsNullOrEmpty(email))
        {
            var match = list.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase) && !u.Email.StartsWith("sin_correo_"));
            if (match != null)
            {
                duplicados.Add(new DuplicadoDto 
                { 
                    Tipo = "Email", 
                    Valor = email, 
                    ClienteExistenteId = match.Id, 
                    ClienteExistenteNombre = match.Nombre 
                });
            }
        }

        if (!string.IsNullOrEmpty(telefono))
        {
            var match = list.FirstOrDefault(u => u.Telefono == telefono);
            if (match != null)
            {
                duplicados.Add(new DuplicadoDto 
                { 
                    Tipo = "Telefono", 
                    Valor = telefono, 
                    ClienteExistenteId = match.Id, 
                    ClienteExistenteNombre = match.Nombre 
                });
            }
        }

        return duplicados;
    }

    public async Task<(bool Success, string Message, Usuario? Cliente, List<DuplicadoDto> Duplicados)> RegistrarClienteAsync(CrearClienteDto dto)
    {
        // 1. Detectar duplicados en DNI, Email o Teléfono
        var duplicados = await DetectarDuplicadosAsync(dto.DNI, dto.Email, dto.Telefono);

        // Si se encuentra un correo duplicado, SIEMPRE es un bloqueo duro por índice DB
        var emailDuplicado = duplicados.FirstOrDefault(d => d.Tipo == "Email");
        if (emailDuplicado != null)
        {
            return (false, $"El correo electrónico '{dto.Email}' ya está registrado por {emailDuplicado.ClienteExistenteNombre}.", null, duplicados);
        }

        // Si se detectan duplicados y no se ignoran, retornar advertencia
        if (duplicados.Any() && !dto.IgnorarDuplicados)
        {
            return (false, "Se detectaron posibles clientes duplicados en el sistema.", null, duplicados);
        }

        string emailFinal = dto.Email ?? string.Empty;
        string? applicationUserId = null;

        // 2. Si tiene email, crear la cuenta en ASP.NET Core Identity
        if (!string.IsNullOrEmpty(dto.Email))
        {
            var appUser = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                NombreCompleto = dto.Nombre,
                FechaRegistro = DateTime.UtcNow,
                EmailConfirmed = true
            };

            var createResult = await _userManager.CreateAsync(appUser, "Client123!");
            if (!createResult.Succeeded)
            {
                return (false, "Error al crear cuenta de identidad para el cliente: " + string.Join(", ", createResult.Errors.Select(e => e.Description)), null, duplicados);
            }

            // Asignar roles
            await _userManager.AddToRoleAsync(appUser, "Cliente");
            await _userManager.AddToRoleAsync(appUser, "Usuario");
            applicationUserId = appUser.Id;
        }
        else
        {
            // Si es opcional, autogenerar un marcador inconfundible para satisfacer constraint no-nulo de DB
            emailFinal = $"sin_correo_{DateTime.UtcNow.Ticks}@vetcare.pro";
        }

        // 3. Crear entidad de Dominio
        var domainUser = new Usuario
        {
            Nombre = dto.Nombre,
            Email = emailFinal,
            Telefono = dto.Telefono,
            DNI = dto.DNI,
            Direccion = dto.Direccion,
            Rol = "Cliente",
            Activo = true,
            FechaRegistro = DateTime.UtcNow,
            ApplicationUserId = applicationUserId
        };

        await _unitOfWork.Usuarios.AddAsync(domainUser);
        await _unitOfWork.CommitAsync();

        return (true, "Cliente registrado exitosamente.", domainUser, duplicados);
    }

    public async Task<(bool Success, string Message, List<DuplicadoDto> Duplicados)> EditarClienteAsync(int id, EditarClienteDto dto)
    {
        var domainUser = await _unitOfWork.Usuarios.GetByIdAsync(id);
        if (domainUser == null)
        {
            return (false, "Cliente no encontrado.", new List<DuplicadoDto>());
        }

        // 1. Detectar duplicados en DNI, Email o Teléfono excluyendo el usuario actual
        var duplicados = await DetectarDuplicadosAsync(dto.DNI, dto.Email, dto.Telefono, id);

        // Si se encuentra un correo duplicado, SIEMPRE es un bloqueo duro por índice DB
        var emailDuplicado = duplicados.FirstOrDefault(d => d.Tipo == "Email");
        if (emailDuplicado != null)
        {
            return (false, $"El correo electrónico '{dto.Email}' ya está registrado por {emailDuplicado.ClienteExistenteNombre}.", duplicados);
        }

        // Si se detectan duplicados y no se ignoran, retornar advertencia
        if (duplicados.Any() && !dto.IgnorarDuplicados)
        {
            return (false, "Se detectaron posibles clientes duplicados en el sistema.", duplicados);
        }

        string emailFinal = domainUser.Email;

        // 2. Manejo de sincronización con Identity
        if (!string.IsNullOrEmpty(dto.Email))
        {
            emailFinal = dto.Email;
            
            // Si antes no tenía ApplicationUserId (sin correo), crearle cuenta ahora
            if (string.IsNullOrEmpty(domainUser.ApplicationUserId))
            {
                var appUser = new ApplicationUser
                {
                    UserName = dto.Email,
                    Email = dto.Email,
                    NombreCompleto = dto.Nombre,
                    FechaRegistro = DateTime.UtcNow,
                    EmailConfirmed = true
                };

                var createResult = await _userManager.CreateAsync(appUser, "Client123!");
                if (!createResult.Succeeded)
                {
                    return (false, "Error al crear cuenta de identidad: " + string.Join(", ", createResult.Errors.Select(e => e.Description)), duplicados);
                }

                await _userManager.AddToRoleAsync(appUser, "Cliente");
                await _userManager.AddToRoleAsync(appUser, "Usuario");
                domainUser.ApplicationUserId = appUser.Id;
            }
            else
            {
                // Si ya tenía cuenta, actualizar correo y nombre en Identity si cambiaron
                var appUser = await _userManager.FindByIdAsync(domainUser.ApplicationUserId);
                if (appUser != null)
                {
                    appUser.Email = dto.Email;
                    appUser.UserName = dto.Email;
                    appUser.NombreCompleto = dto.Nombre;
                    await _userManager.UpdateAsync(appUser);
                }
            }
        }
        else if (string.IsNullOrEmpty(dto.Email) && !domainUser.Email.StartsWith("sin_correo_"))
        {
            // Si antes tenía email y se lo remueven (caso raro), no podemos borrar el campo de BD, así que generamos placeholder
            emailFinal = $"sin_correo_{DateTime.UtcNow.Ticks}@vetcare.pro";
            
            // Bloquear cuenta de Identity existente si es que existía
            if (!string.IsNullOrEmpty(domainUser.ApplicationUserId))
            {
                var appUser = await _userManager.FindByIdAsync(domainUser.ApplicationUserId);
                if (appUser != null)
                {
                    await _userManager.SetLockoutEnabledAsync(appUser, true);
                    await _userManager.SetLockoutEndDateAsync(appUser, DateTimeOffset.MaxValue);
                }
            }
        }

        // 3. Actualizar campos del modelo de Dominio
        domainUser.Nombre = dto.Nombre;
        domainUser.Email = emailFinal;
        domainUser.Telefono = dto.Telefono;
        domainUser.DNI = dto.DNI;
        domainUser.Direccion = dto.Direccion;

        _unitOfWork.Usuarios.Update(domainUser);
        await _unitOfWork.CommitAsync();

        return (true, "Cliente actualizado exitosamente.", duplicados);
    }
}
