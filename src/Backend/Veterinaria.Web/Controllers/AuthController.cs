using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using System.Linq;
using System;
using Veterinaria.Domain.Entities;
using Veterinaria.Application.DTOs;
using Veterinaria.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;

namespace Veterinaria.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly VeterinariaDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(SignInManager<ApplicationUser> signInManager, UserManager<ApplicationUser> userManager, VeterinariaDbContext context, IConfiguration configuration)
    {
        _signInManager = signInManager;
        _userManager = userManager;
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<ActionResult<Response<object>>> Login([FromBody] LoginRequest request)
    {
        if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(Response<object>.Fail("El correo y la contraseña son requeridos."));
        }

        // Buscar el usuario por email
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            return BadRequest(Response<object>.Fail("Credenciales inválidas."));
        }

        // Verificar si el usuario de dominio está activo
        var domainUser = await _context.Usuarios.FirstOrDefaultAsync(u => u.ApplicationUserId == user.Id);
        if (domainUser != null && !domainUser.Activo)
        {
            return BadRequest(Response<object>.Fail("Tu cuenta ha sido desactivada. Contacta al administrador."));
        }

        // Intentar iniciar sesión
        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (isPasswordValid)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault() ?? "Usuario";

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

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(double.Parse(_configuration["Jwt:ExpiryInMinutes"] ?? "1440")),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            var data = new
            {
                Email = user.Email,
                NombreCompleto = user.NombreCompleto,
                Role = userRole,
                Token = tokenString
            };

            return Ok(Response<object>.Ok(data, "Sesión iniciada con éxito."));
        }

        return BadRequest(Response<object>.Fail("Credenciales inválidas."));
    }

    [HttpPost("logout")]
    public async Task<ActionResult<Response<string>>> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(Response<string>.Ok("Sesión cerrada correctamente."));
    }

    [HttpGet("me")]
    public async Task<ActionResult<Response<object>>> Me()
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user != null)
            {
                var roles = await _userManager.GetRolesAsync(user);
                var userRole = roles.FirstOrDefault() ?? "Usuario";

                var data = new
                {
                    Email = user.Email,
                    NombreCompleto = user.NombreCompleto,
                    Role = userRole
                };

                return Ok(Response<object>.Ok(data, "Sesión activa recuperada."));
            }
        }

        return Unauthorized(Response<object>.Fail("No estás autenticado."));
    }

    [HttpPost("register")]
    public async Task<ActionResult<Response<object>>> Register([FromBody] RegisterRequest request)
    {
        if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(Response<object>.Fail("Datos de registro inválidos."));
        }

        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return BadRequest(Response<object>.Fail("El correo electrónico ya está registrado."));
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            NombreCompleto = request.NombreCompleto
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (result.Succeeded)
        {
            // Asignar rol de Usuario (Cliente) por defecto
            await _userManager.AddToRoleAsync(user, "Usuario");

            // Crear el registro de dominio
            var domainUser = new Usuario
            {
                ApplicationUserId = user.Id,
                Nombre = request.NombreCompleto,
                Email = request.Email,
                DNI = request.DNI,
                Telefono = request.Telefono,
                Rol = "Usuario",
                Activo = true,
                FechaRegistro = DateTime.UtcNow
            };

            _context.Usuarios.Add(domainUser);
            await _context.SaveChangesAsync();

            return Ok(Response<object>.Ok(new { Email = user.Email }, "Usuario registrado con éxito."));
        }

        return BadRequest(Response<object>.Fail("Error al registrar el usuario: " + string.Join(", ", result.Errors.Select(e => e.Description))));
    }

    [Microsoft.AspNetCore.Authorization.Authorize]
    [HttpGet("profile")]
    public async Task<ActionResult<Response<object>>> GetProfile()
    {
        var appUser = await _userManager.GetUserAsync(User);
        if (appUser == null) return Unauthorized(Response<object>.Fail("No autenticado."));

        var domainUser = await _context.Usuarios.FirstOrDefaultAsync(u => u.ApplicationUserId == appUser.Id);

        return Ok(Response<object>.Ok(new
        {
            NombreCompleto = appUser.NombreCompleto,
            Email = appUser.Email,
            Telefono = domainUser?.Telefono ?? "",
            DNI = domainUser?.DNI ?? "",
            Direccion = domainUser?.Direccion ?? ""
        }));
    }

    [Microsoft.AspNetCore.Authorization.Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<Response<object>>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var appUser = await _userManager.GetUserAsync(User);
        if (appUser == null) return Unauthorized(Response<object>.Fail("No autenticado."));

        var domainUser = await _context.Usuarios.FirstOrDefaultAsync(u => u.ApplicationUserId == appUser.Id);
        if (domainUser == null) return NotFound(Response<object>.Fail("Perfil no encontrado."));

        // Actualizar nombre en Identity
        appUser.NombreCompleto = request.NombreCompleto;
        await _userManager.UpdateAsync(appUser);

        // Actualizar datos en dominio
        domainUser.Nombre = request.NombreCompleto;
        domainUser.Telefono = request.Telefono;
        domainUser.DNI = request.DNI;
        domainUser.Direccion = request.Direccion;
        await _context.SaveChangesAsync();

        return Ok(Response<object>.Ok("Perfil actualizado correctamente."));
    }

    [Microsoft.AspNetCore.Authorization.Authorize]
    [HttpPost("change-password")]
    public async Task<ActionResult<Response<object>>> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var appUser = await _userManager.GetUserAsync(User);
        if (appUser == null) return Unauthorized(Response<object>.Fail("No autenticado."));

        var result = await _userManager.ChangePasswordAsync(appUser, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
            return BadRequest(Response<object>.Fail("Error: " + string.Join(", ", result.Errors.Select(e => e.Description))));

        return Ok(Response<object>.Ok("Contraseña actualizada correctamente."));
    }
}

public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; } = false;
}

public class RegisterRequest
{
    [Required]
    public string NombreCompleto { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    public string? DNI { get; set; }
    public string? Telefono { get; set; }
}

public class UpdateProfileRequest
{
    [Required]
    public string NombreCompleto { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? DNI { get; set; }
    public string? Direccion { get; set; }
}

public class ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;
    [Required]
    public string NewPassword { get; set; } = string.Empty;
}
