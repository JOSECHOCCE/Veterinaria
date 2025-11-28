using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Contracts;
using Veterinaria.Web.Models;

namespace Veterinaria.Web.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly IUnitOfWork _unitOfWork;

    public HomeController(ILogger<HomeController> logger, IUnitOfWork unitOfWork)
    {
        _logger = logger;
        _unitOfWork = unitOfWork;
    }

    public IActionResult Index()
    {
        return View();
    }

    // Página pública de servicios para clientes
    public async Task<IActionResult> Servicios()
    {
        var servicios = await _unitOfWork.Servicios.GetAll()
            .Where(s => s.Activo)
            .OrderBy(s => s.Nombre)
            .ToListAsync();

        return View(servicios);
    }

    // Página pública de veterinarios para clientes
    public async Task<IActionResult> Veterinarios()
    {
        var veterinarios = await _unitOfWork.Veterinarios.GetAll()
            .Where(v => v.Activo)
            .OrderBy(v => v.Nombre)
            .ToListAsync();

        return View(veterinarios);
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
