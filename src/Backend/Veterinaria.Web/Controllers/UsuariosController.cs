using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioService _usuarioService;

    public UsuariosController(IUsuarioService usuarioService)
    {
        _usuarioService = usuarioService;
    }

    [HttpGet]
    public async Task<ActionResult<Response<List<UsuarioDetailsDto>>>> GetUsuarios()
    {
        var result = await _usuarioService.GetUsuariosAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<Response<object>>> CrearUsuario([FromBody] CrearUsuarioDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos de creación de usuario inválidos."));
        }

        var result = await _usuarioService.CrearUsuarioAsync(request);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Response<object>>> EditarUsuario(int id, [FromBody] EditarUsuarioDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos de edición de usuario inválidos."));
        }

        var result = await _usuarioService.EditarUsuarioAsync(id, request);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPut("{id}/estado")]
    public async Task<ActionResult<Response<object>>> CambiarEstado(int id, [FromBody] CambiarEstadoControllerRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos de cambio de estado inválidos."));
        }

        var result = await _usuarioService.CambiarEstadoAsync(id, request.Activo);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<Response<object>>> EliminarUsuario(int id)
    {
        var result = await _usuarioService.EliminarUsuarioAsync(id);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}

public class CambiarEstadoControllerRequest
{
    [Required]
    public bool Activo { get; set; }
}
