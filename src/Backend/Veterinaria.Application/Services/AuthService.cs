using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class AuthService : IAuthService
{
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly IAuditoriaService _auditoriaService;

    public AuthService(
        SignInManager<ApplicationUser> signInManager,
        UserManager<ApplicationUser> userManager,
        IUnitOfWork unitOfWork,
        IConfiguration configuration,
        IAuditoriaService auditoriaService)
    {
        _signInManager = signInManager;
        _userManager = userManager;
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _auditoriaService = auditoriaService;
    }

    public async Task<Response<LoginResponseDto>> LoginAsync(LoginRequestDto request)
    {
        if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return Response<LoginResponseDto>.Fail("El correo y la contraseña son requeridos.");
        }

        // Buscar el usuario por email
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            return Response<LoginResponseDto>.Fail("Credenciales inválidas.");
        }

        // 1. Verificar primero si la contraseña es válida (medida de seguridad)
        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
        {
            return Response<LoginResponseDto>.Fail("Credenciales inválidas.");
        }

        // 2. Solo después de validar la contraseña, verificamos si la cuenta está desactivada
        // Esto evita revelar si un correo existe en el sistema a través del mensaje de cuenta inactiva
        var domainUser = await _unitOfWork.Usuarios.GetAll()
            .FirstOrDefaultAsync(u => u.ApplicationUserId == user.Id);

        if (domainUser != null && !domainUser.Activo)
        {
            return Response<LoginResponseDto>.Fail("Tu cuenta ha sido desactivada. Contacta al administrador.");
        }

        // Obtener el rol del usuario
        var roles = await _userManager.GetRolesAsync(user);
        var userRole = roles.FirstOrDefault() ?? "Cliente";

        // Generar Token JWT
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "SuperSecretKeyForVeterinariaApp2026!AwesomeKeyWithLength32");

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim(ClaimTypes.Name, user.NombreCompleto ?? ""),
            new Claim(ClaimTypes.Role, userRole)
        };

        var expiryMinutes = double.Parse(_configuration["Jwt:ExpiryInMinutes"] ?? "1440");
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        var data = new LoginResponseDto
        {
            Email = user.Email ?? string.Empty,
            NombreCompleto = user.NombreCompleto,
            Role = userRole,
            Token = tokenString
        };

        return Response<LoginResponseDto>.Ok(data, "Sesión iniciada con éxito.");
    }

    public async Task<Response<string>> RegisterAsync(RegisterRequestDto request)
    {
        if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return Response<string>.Fail("Datos de registro inválidos.");
        }

        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return Response<string>.Fail("El correo electrónico ya está registrado.");
        }

        // Verificar también que no esté registrado en la tabla de dominio
        var existingDomainUser = await _unitOfWork.Usuarios.GetAll()
            .AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (existingDomainUser)
        {
            return Response<string>.Fail("El correo electrónico ya está registrado en el sistema.");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            NombreCompleto = request.NombreCompleto,
            FechaRegistro = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (result.Succeeded)
        {
            // Asignar rol de Cliente y Usuario por defecto para asegurar compatibilidad
            await _userManager.AddToRoleAsync(user, "Cliente");
            await _userManager.AddToRoleAsync(user, "Usuario");

            // Crear el registro de dominio
            var domainUser = new Usuario
            {
                ApplicationUserId = user.Id,
                Nombre = request.NombreCompleto,
                Email = request.Email,
                DNI = request.DNI,
                Telefono = request.Telefono,
                Direccion = request.Direccion,
                Rol = "Cliente", // Rol unificado en dominio
                Activo = true,
                FechaRegistro = DateTime.UtcNow
            };

            await _unitOfWork.Usuarios.AddAsync(domainUser);
            await _unitOfWork.CommitAsync();

            // Auditoría
            await _auditoriaService.RegistrarAccionAsync(
                "Auto-Registro Cliente",
                "Usuario",
                domainUser.Id.ToString(),
                $"Cliente se autoregistró en la plataforma web: {domainUser.Email}"
            );

            return Response<string>.Ok(user.Email, "Usuario registrado con éxito.");
        }

        var errors = string.Join(", ", result.Errors.Select(e => e.Description));
        return Response<string>.Fail($"Error al registrar el usuario: {errors}");
    }

    public async Task<Response<object>> GetProfileAsync(string appUserId)
    {
        if (string.IsNullOrEmpty(appUserId))
        {
            return Response<object>.Fail("Identificador de usuario no válido.");
        }

        var appUser = await _userManager.FindByIdAsync(appUserId);
        if (appUser == null)
        {
            return Response<object>.Fail("Cuenta no encontrada.");
        }

        var domainUser = await _unitOfWork.Usuarios.GetAll()
            .FirstOrDefaultAsync(u => u.ApplicationUserId == appUser.Id);

        var profile = new
        {
            NombreCompleto = appUser.NombreCompleto,
            Email = appUser.Email,
            Telefono = domainUser?.Telefono ?? "",
            DNI = domainUser?.DNI ?? "",
            Direccion = domainUser?.Direccion ?? ""
        };

        return Response<object>.Ok(profile, "Perfil recuperado con éxito.");
    }

    public async Task<Response<string>> UpdateProfileAsync(string appUserId, UpdateProfileRequestDto request)
    {
        if (string.IsNullOrEmpty(appUserId))
        {
            return Response<string>.Fail("Identificador de usuario no válido.");
        }

        var appUser = await _userManager.FindByIdAsync(appUserId);
        if (appUser == null)
        {
            return Response<string>.Fail("Cuenta no encontrada.");
        }

        var domainUser = await _unitOfWork.Usuarios.GetAll()
            .FirstOrDefaultAsync(u => u.ApplicationUserId == appUser.Id);
        if (domainUser == null)
        {
            return Response<string>.Fail("Perfil no encontrado.");
        }

        // Actualizar nombre en Identity
        appUser.NombreCompleto = request.NombreCompleto;
        var identityResult = await _userManager.UpdateAsync(appUser);
        if (!identityResult.Succeeded)
        {
            var errors = string.Join(", ", identityResult.Errors.Select(e => e.Description));
            return Response<string>.Fail($"Error al actualizar perfil de identidad: {errors}");
        }

        // Actualizar datos en dominio
        domainUser.Nombre = request.NombreCompleto;
        domainUser.Telefono = request.Telefono;
        domainUser.DNI = request.DNI;
        domainUser.Direccion = request.Direccion;

        _unitOfWork.Usuarios.Update(domainUser);
        await _unitOfWork.CommitAsync();

        // Auditoría
        await _auditoriaService.RegistrarAccionAsync(
            "Actualizar Perfil",
            "Usuario",
            domainUser.Id.ToString(),
            $"El usuario {domainUser.Email} actualizó su información de perfil"
        );

        return Response<string>.Ok("Perfil actualizado correctamente.", "Perfil actualizado correctamente.");
    }

    public async Task<Response<string>> ChangePasswordAsync(string appUserId, ChangePasswordRequestDto request)
    {
        if (string.IsNullOrEmpty(appUserId))
        {
            return Response<string>.Fail("Identificador de usuario no válido.");
        }

        var appUser = await _userManager.FindByIdAsync(appUserId);
        if (appUser == null)
        {
            return Response<string>.Fail("Cuenta no encontrada.");
        }

        var result = await _userManager.ChangePasswordAsync(appUser, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return Response<string>.Fail($"Error al cambiar la contraseña: {errors}");
        }

        // Auditoría
        var domainUser = await _unitOfWork.Usuarios.GetAll()
            .FirstOrDefaultAsync(u => u.ApplicationUserId == appUser.Id);
        if (domainUser != null)
        {
            await _auditoriaService.RegistrarAccionAsync(
                "Cambio Contraseña",
                "Usuario",
                domainUser.Id.ToString(),
                $"El usuario {domainUser.Email} realizó un cambio de contraseña"
            );
        }

        return Response<string>.Ok("Contraseña actualizada correctamente.", "Contraseña actualizada correctamente.");
    }
}
