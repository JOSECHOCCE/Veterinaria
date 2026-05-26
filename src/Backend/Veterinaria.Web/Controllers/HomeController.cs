using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.DTOs;
using Veterinaria.Domain.Contracts;
using Veterinaria.Web.Models;

namespace Veterinaria.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HomeController : ControllerBase
{
    private readonly ILogger<HomeController> _logger;
    private readonly IUnitOfWork _unitOfWork;

    public HomeController(ILogger<HomeController> logger, IUnitOfWork unitOfWork)
    {
        _logger = logger;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public ActionResult<Response<object>> Index()
    {
        return Ok(Response<object>.Ok("Welcome to Veterinaria API"));
    }

    // Página pública de servicios para clientes
    [HttpGet("servicios")]
    public async Task<ActionResult<Response<object>>> Servicios()
    {
        var servicios = await _unitOfWork.Servicios.GetAll()
            .Where(s => s.Activo)
            .OrderBy(s => s.Nombre)
            .ToListAsync();

        return Ok(Response<object>.Ok(servicios));
    }

    // Página pública de veterinarios para clientes
    [HttpGet("veterinarios")]
    public async Task<ActionResult<Response<object>>> Veterinarios()
    {
        var veterinarios = await _unitOfWork.Veterinarios.GetAll()
            .Where(v => v.Activo)
            .OrderBy(v => v.Nombre)
            .ToListAsync();

        return Ok(Response<object>.Ok(veterinarios));
    }

    [HttpGet("privacy")]
    public ActionResult<Response<object>> Privacy()
    {
        return Ok(Response<object>.Ok("Privacy policy"));
    }

    [HttpGet("error")]
    public ActionResult<Response<object>> Error()
    {
        var errorViewModel = new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier };
        return BadRequest(Response<object>.Fail("An error occurred")); // Or wrap errorViewModel if preferred
    }
}
