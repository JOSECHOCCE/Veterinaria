using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using System.Linq;
using System;
using Veterinaria.Domain.Entities;
using Veterinaria.Application.DTOs;

namespace Veterinaria.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly UserManager<ApplicationUser> _userManager;

    public AuthController(SignInManager<ApplicationUser> signInManager, UserManager<ApplicationUser> userManager)
    {
        _signInManager = signInManager;
        _userManager = userManager;
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

        // Intentar iniciar sesión
        var result = await _signInManager.PasswordSignInAsync(user.UserName, request.Password, request.RememberMe, lockoutOnFailure: false);
        if (result.Succeeded)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault() ?? "Usuario";

            var data = new
            {
                Email = user.Email,
                NombreCompleto = user.NombreCompleto,
                Role = userRole
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
