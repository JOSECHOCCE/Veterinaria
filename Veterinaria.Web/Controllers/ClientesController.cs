using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.Interfaces;
using X.PagedList.Extensions;
using System.Threading.Tasks;
using System.Linq;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
public class ClientesController : Controller
{
    private readonly IClienteService _clienteService;

    public ClientesController(IClienteService clienteService)
    {
        _clienteService = clienteService;
    }

    // GET: Clientes
    public async Task<IActionResult> Index(string buscar, bool? mostrarInactivos, int page = 1)
    {
        ViewBag.BuscarActual = buscar;
        ViewBag.MostrarInactivos = mostrarInactivos ?? false;

        var result = await _clienteService.GetClientesAsync(buscar, mostrarInactivos ?? false);

        ViewBag.CitasPorUsuario = result.CitasPorUsuario;

        var pagedList = result.Usuarios.ToPagedList(page, 10);
        return View(pagedList);
    }

    // GET: Clientes/Details/5
    public async Task<IActionResult> Details(int id)
    {
        var detalle = await _clienteService.GetClienteDetailsAsync(id);

        if (detalle == null)
        {
            return NotFound();
        }

        ViewBag.TotalCitas = detalle.TotalCitas;
        ViewBag.CitasCompletadas = detalle.CitasCompletadas;
        ViewBag.CitasCanceladas = detalle.CitasCanceladas;
        ViewBag.CitasPendientes = detalle.CitasPendientes;
        ViewBag.Citas = detalle.UltimasCitas;
        ViewBag.TotalGastado = detalle.TotalGastado;
        ViewBag.PagosPendientes = detalle.PagosPendientes;

        return View(detalle.Usuario);
    }

    // POST: Clientes/ToggleActivo/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleActivo(int id)
    {
        var success = await _clienteService.ToggleActivoAsync(id);
        if (!success)
        {
            return NotFound();
        }

        TempData["Success"] = "Estado del cliente actualizado exitosamente.";

        return RedirectToAction(nameof(Index));
    }

    // POST: Clientes/Delete/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _clienteService.DeleteCascadeAsync(id);

        if (result.Success)
        {
            TempData["Success"] = result.Message;
        }
        else
        {
            TempData["Error"] = result.Message;
        }

        return RedirectToAction(nameof(Index));
    }
}
