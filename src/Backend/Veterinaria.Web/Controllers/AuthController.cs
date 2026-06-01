using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly UserManager<ApplicationUser> _userManager;

    public AuthController(
        IAuthService authService,
        SignInManager<ApplicationUser> signInManager,
        UserManager<ApplicationUser> userManager)
    {
        _authService = authService;
        _signInManager = signInManager;
        _userManager = userManager;
    }

    [HttpPost("login")]
    public async Task<ActionResult<Response<LoginResponseDto>>> Login([FromBody] LoginRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<LoginResponseDto>.Fail("Datos de inicio de sesión inválidos."));
        }

        var result = await _authService.LoginAsync(request);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
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
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId))
            {
                var appUser = await _userManager.FindByIdAsync(userId);
                if (appUser != null)
                {
                    var roles = await _userManager.GetRolesAsync(appUser);
                    var userRole = roles.FirstOrDefault() ?? "Usuario";

                    var data = new
                    {
                        Email = appUser.Email,
                        NombreCompleto = appUser.NombreCompleto,
                        Role = userRole
                    };

                    return Ok(Response<object>.Ok(data, "Sesión activa recuperada."));
                }
            }
        }

        return Unauthorized(Response<object>.Fail("No estás autenticado."));
    }

    [HttpPost("register")]
    public async Task<ActionResult<Response<string>>> Register([FromBody] RegisterRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<string>.Fail("Datos de registro inválidos."));
        }

        var result = await _authService.RegisterAsync(request);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<ActionResult<Response<object>>> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(Response<object>.Fail("No autenticado."));
        }

        var result = await _authService.GetProfileAsync(userId);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<Response<string>>> UpdateProfile([FromBody] UpdateProfileRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<string>.Fail("Datos de edición de perfil inválidos."));
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(Response<string>.Fail("No autenticado."));
        }

        var result = await _authService.UpdateProfileAsync(userId, request);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<ActionResult<Response<string>>> ChangePassword([FromBody] ChangePasswordRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<string>.Fail("Datos de cambio de contraseña inválidos."));
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(Response<string>.Fail("No autenticado."));
        }

        var result = await _authService.ChangePasswordAsync(userId, request);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}
