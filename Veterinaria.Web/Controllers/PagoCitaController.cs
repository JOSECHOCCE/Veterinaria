using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;
using Veterinaria.Web.Models.ViewModels;
using Veterinaria.Web.Services;
using System.Security.Claims;

namespace Veterinaria.Web.Controllers;

[Authorize]
public class PagoCitaController : Controller
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly PdfService _pdfService;
    private readonly IPagoService _pagoService;

    public PagoCitaController(IUnitOfWork unitOfWork, IMapper mapper, PdfService pdfService, IPagoService pagoService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _pdfService = pdfService;
        _pagoService = pagoService;
    }

    private async Task<Usuario?> GetCurrentUsuarioAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return null;
        return await _unitOfWork.Usuarios.GetAll()
            .FirstOrDefaultAsync(u => u.ApplicationUserId == userId);
    }

    // GET: PagoCita/Pagar/5 - Pantalla de pago para una cita
    public async Task<IActionResult> Pagar(int citaId)
    {
        var cita = await _pagoService.GetCitaForPagoAsync(citaId);

        if (cita == null)
        {
            TempData["Error"] = "Cita no encontrada.";
            return RedirectToAction("Index", "Citas");
        }

        // Verificar que la cita le pertenece al usuario o es admin
        Usuario? currentUsuario = null;
        if (!User.IsInRole("Admin"))
        {
            currentUsuario = await GetCurrentUsuarioAsync();
            if (currentUsuario == null || cita.Mascota?.UsuarioId != currentUsuario.Id)
            {
                return Forbid();
            }
        }
        else
        {
            currentUsuario = cita.Mascota?.Usuario;
        }

        // Verificar que la cita no esté ya pagada completamente
        if (cita.EstadoPago == "Pagado")
        {
            TempData["Info"] = "Esta cita ya está pagada completamente.";
            return RedirectToAction("Details", "Citas", new { id = citaId });
        }

        // Buscar tarjeta guardada del usuario
        TarjetaGuardada? tarjetaGuardada = null;
        if (currentUsuario != null)
        {
            tarjetaGuardada = await _pagoService.GetTarjetaGuardadaAsync(currentUsuario.Id);
        }

        var viewModel = new PagoTarjetaViewModel
        {
            CitaId = citaId,
            MontoTotal = cita.MontoTotal > 0 ? cita.MontoTotal : cita.Servicio?.Precio ?? 0,
            MontoPagar = cita.MontoTotal > 0 ? cita.MontoTotal : cita.Servicio?.Precio ?? 0,
            TipoPago = "Completo",
            MascotaNombre = cita.Mascota?.Nombre,
            ServicioNombre = cita.Servicio?.Nombre,
            VeterinarioNombre = cita.Veterinario?.Nombre,
            FechaCita = cita.FechaHora,
            // Datos de tarjeta guardada
            TieneTarjetaGuardada = tarjetaGuardada != null,
            TarjetaGuardadaUltimosDigitos = tarjetaGuardada?.UltimosDigitos,
            UsarTarjetaGuardada = tarjetaGuardada != null,
            // Autocompletar datos si tiene tarjeta guardada
            NombreTitular = tarjetaGuardada != null ? DesencriptarSimple(tarjetaGuardada.NombreTitular) : string.Empty,
            NumeroTarjeta = tarjetaGuardada != null ? DesencriptarSimple(tarjetaGuardada.NumeroTarjetaEncriptado) : string.Empty,
            FechaVencimiento = tarjetaGuardada?.FechaExpiracion ?? string.Empty,
            CVV = tarjetaGuardada != null ? DesencriptarSimple(tarjetaGuardada.CVVEncriptado) : string.Empty
        };

        return View(viewModel);
    }

    // POST: PagoCita/ProcesarPago
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ProcesarPago(PagoTarjetaViewModel model)
    {
        var cita = await _pagoService.GetCitaForPagoAsync(model.CitaId);

        if (cita == null)
        {
            TempData["Error"] = "Cita no encontrada.";
            return RedirectToAction("Index", "Citas");
        }

        // Validar modelo
        if (!ModelState.IsValid)
        {
            model.MontoTotal = cita.Servicio?.Precio ?? 0;
            model.MascotaNombre = cita.Mascota?.Nombre;
            model.ServicioNombre = cita.Servicio?.Nombre;
            model.VeterinarioNombre = cita.Veterinario?.Nombre;
            model.FechaCita = cita.FechaHora;
            return View("Pagar", model);
        }

        // Validar fecha de vencimiento
        if (!model.EsFechaVencimientoValida())
        {
            ModelState.AddModelError("FechaVencimiento", "La tarjeta está vencida o la fecha no es válida.");
            model.MontoTotal = cita.Servicio?.Precio ?? 0;
            model.MascotaNombre = cita.Mascota?.Nombre;
            model.ServicioNombre = cita.Servicio?.Nombre;
            model.VeterinarioNombre = cita.Veterinario?.Nombre;
            model.FechaCita = cita.FechaHora;
            return View("Pagar", model);
        }

        // Calcular monto a pagar
        var montoTotal = cita.Servicio?.Precio ?? 0;
        var montoPagar = model.TipoPago == "Parcial" ? montoTotal * 0.5m : montoTotal;

        var pago = await _pagoService.ProcesarPagoTarjetaAsync(
            cita.Id,
            montoTotal,
            montoPagar,
            model.TipoPago,
            model.NumeroTarjeta,
            model.GuardarTarjeta,
            model.NombreTitular,
            model.FechaVencimiento,
            model.CVV,
            cita.Mascota?.UsuarioId
        );

        TempData["Success"] = $"¡Pago exitoso! Referencia: {pago.Referencia}";
        TempData["PagoId"] = pago.Id;
        TempData["CitaId"] = cita.Id;

        return RedirectToAction("Confirmacion", new { citaId = cita.Id, pagoId = pago.Id });
    }

    // GET: PagoCita/Confirmacion
    public async Task<IActionResult> Confirmacion(int citaId, int pagoId)
    {
        var cita = await _pagoService.GetCitaWithPagosAsync(citaId);
        var pago = await _pagoService.GetPagoByIdAsync(pagoId);

        if (cita == null || pago == null)
        {
            return RedirectToAction("Index", "Citas");
        }

        ViewBag.Cita = cita;
        ViewBag.Pago = pago;

        return View();
    }

    // GET: PagoCita/CompletarPago/5 - Para pagar el monto restante
    public async Task<IActionResult> CompletarPago(int citaId)
    {
        var cita = await _pagoService.GetCitaForPagoAsync(citaId);

        if (cita == null)
        {
            TempData["Error"] = "Cita no encontrada.";
            return RedirectToAction("Index", "Citas");
        }

        // Verificar que el usuario actual es el propietario de la mascota (no admin)
        var currentUsuario = await GetCurrentUsuarioAsync();
        if (currentUsuario == null || cita.Mascota?.UsuarioId != currentUsuario.Id)
        {
            TempData["Error"] = "Solo el propietario de la mascota puede completar el pago.";
            return RedirectToAction("Details", "Citas", new { id = citaId });
        }

        // Solo se puede completar pago si está en estado Parcial
        if (cita.EstadoPago != "Parcial")
        {
            TempData["Info"] = cita.EstadoPago == "Pagado"
                ? "Esta cita ya está pagada completamente."
                : "Esta cita no tiene pagos previos.";
            return RedirectToAction("Details", "Citas", new { id = citaId });
        }

        // Solo se puede completar pago después de que la cita esté Completada
        if (cita.Estado != "Completada")
        {
            TempData["Info"] = "El pago restante se habilitará cuando la cita sea atendida.";
            return RedirectToAction("Details", "Citas", new { id = citaId });
        }

        var montoRestante = cita.MontoTotal - cita.MontoPagado;

        // Buscar tarjeta guardada del usuario
        TarjetaGuardada? tarjetaGuardada = null;
        if (cita.Mascota?.UsuarioId != null)
        {
            tarjetaGuardada = await _pagoService.GetTarjetaGuardadaAsync(cita.Mascota.UsuarioId);
        }

        var viewModel = new CompletarPagoViewModel
        {
            CitaId = citaId,
            MontoRestante = montoRestante,
            MetodoPago = "Tarjeta",
            MascotaNombre = cita.Mascota?.Nombre,
            ServicioNombre = cita.Servicio?.Nombre,
            FechaCita = cita.FechaHora,
            // Datos de tarjeta guardada
            TieneTarjetaGuardada = tarjetaGuardada != null,
            TarjetaGuardadaUltimosDigitos = tarjetaGuardada?.UltimosDigitos,
            UsarTarjetaGuardada = tarjetaGuardada != null,
            // Autocompletar datos si tiene tarjeta guardada
            NombreTarjeta = tarjetaGuardada != null ? DesencriptarSimple(tarjetaGuardada.NombreTitular) : null,
            NumeroTarjeta = tarjetaGuardada != null ? DesencriptarSimple(tarjetaGuardada.NumeroTarjetaEncriptado) : null,
            FechaVencimiento = tarjetaGuardada?.FechaExpiracion,
            CVV = tarjetaGuardada != null ? DesencriptarSimple(tarjetaGuardada.CVVEncriptado) : null
        };

        return View(viewModel);
    }

    // POST: PagoCita/ProcesarPagoRestante
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ProcesarPagoRestante(CompletarPagoViewModel model)
    {
        var cita = await _pagoService.GetCitaForPagoAsync(model.CitaId);

        if (cita == null)
        {
            TempData["Error"] = "Cita no encontrada.";
            return RedirectToAction("Index", "Citas");
        }

        var montoRestante = cita.MontoTotal - cita.MontoPagado;

        if (model.MetodoPago == "Tarjeta")
        {
            // Validar datos de tarjeta
            if (string.IsNullOrEmpty(model.NumeroTarjeta) || model.NumeroTarjeta.Length != 16 ||
                string.IsNullOrEmpty(model.CVV) || model.CVV.Length != 3 ||
                string.IsNullOrEmpty(model.FechaVencimiento))
            {
                ModelState.AddModelError("", "Los datos de la tarjeta son inválidos.");
                model.MontoRestante = montoRestante;
                model.MascotaNombre = cita.Mascota?.Nombre;
                model.ServicioNombre = cita.Servicio?.Nombre;
                model.FechaCita = cita.FechaHora;
                return View("CompletarPago", model);
            }

            var pago = await _pagoService.ProcesarPagoRestanteTarjetaAsync(cita.Id, model.NumeroTarjeta);
            TempData["Success"] = $"¡Pago completado exitosamente! Referencia: {pago.Referencia}";
            return RedirectToAction("Confirmacion", new { citaId = cita.Id, pagoId = pago.Id });
        }
        else
        {
            // Pago en efectivo - Generar voucher para ir a caja
            var voucherReferencia = $"VOU-{DateTime.Now:yyyyMMdd}-{cita.Id:D4}-{new Random().Next(1000, 9999)}";
            TempData["Success"] = "Se ha generado su voucher de pago. Acérquese a caja para completar su pago.";
            return RedirectToAction("VoucherPagoEfectivo", new
            {
                citaId = cita.Id,
                montoRestante = montoRestante,
                referencia = voucherReferencia
            });
        }
    }

    // GET: PagoCita/VoucherPagoEfectivo - Vista del voucher para pago en efectivo
    public async Task<IActionResult> VoucherPagoEfectivo(int citaId, decimal montoRestante, string referencia)
    {
        var cita = await _pagoService.GetCitaForPagoAsync(citaId);

        if (cita == null)
        {
            TempData["Error"] = "Cita no encontrada.";
            return RedirectToAction("Index", "Citas");
        }

        ViewBag.Cita = cita;
        ViewBag.MontoRestante = montoRestante;
        ViewBag.MontoPagado = cita.MontoPagado;
        ViewBag.MontoTotal = cita.MontoTotal;
        ViewBag.Referencia = referencia;

        return View();
    }

    // GET: PagoCita/DescargarVoucherEfectivo
    public async Task<IActionResult> DescargarVoucherEfectivo(int citaId, decimal montoRestante, decimal montoPagado, decimal montoTotal, string referencia)
    {
        var cita = await _pagoService.GetCitaForPagoAsync(citaId);

        if (cita == null)
        {
            TempData["Error"] = "Cita no encontrada.";
            return RedirectToAction("Index", "Citas");
        }

        var pdfBytes = _pdfService.GenerarVoucherPagoEfectivo(cita, montoPagado, montoRestante, montoTotal, referencia);
        return File(pdfBytes, "application/pdf", $"Voucher_Pago_{referencia}.pdf");
    }

    // GET: PagoCita/DescargarComprobante/5
    public async Task<IActionResult> DescargarComprobante(int pagoId)
    {
        var pago = await _pagoService.GetPagoByIdAsync(pagoId);

        if (pago == null)
        {
            TempData["Error"] = "Pago no encontrado.";
            return RedirectToAction("Index", "Citas");
        }
        
        var cita = await _pagoService.GetCitaForPagoAsync(pago.CitaId);
        if (cita == null) {
            TempData["Error"] = "Cita no encontrada.";
            return RedirectToAction("Index", "Citas");
        }
        
        pago.Cita = cita; // Asegurar que tenga la cita para el PDF

        var pdfBytes = _pdfService.GenerarComprobantePago(pago.Cita, pago);
        return File(pdfBytes, "application/pdf", $"Comprobante_Pago_{pago.Referencia}.pdf");
    }

    // GET: PagoCita/DescargarFicha/5
    public async Task<IActionResult> DescargarFicha(int citaId)
    {
        var cita = await _pagoService.GetCitaForPagoAsync(citaId);

        if (cita == null)
        {
            TempData["Error"] = "Cita no encontrada.";
            return RedirectToAction("Index", "Citas");
        }

        var pdfBytes = _pdfService.GenerarFichaCita(cita);
        return File(pdfBytes, "application/pdf", $"Ficha_Cita_{cita.Id:D6}.pdf");
    }

    #region Métodos auxiliares de encriptación simple

    /// <summary>
    /// Encriptación simple para datos de tarjeta (solo para demo/autocompletado)
    /// En producción usar encriptación real como AES o guardado en vault seguro
    /// </summary>
    private string EncriptarSimple(string texto)
    {
        if (string.IsNullOrEmpty(texto)) return string.Empty;
        var bytes = System.Text.Encoding.UTF8.GetBytes(texto);
        return Convert.ToBase64String(bytes);
    }

    private string DesencriptarSimple(string textoEncriptado)
    {
        if (string.IsNullOrEmpty(textoEncriptado)) return string.Empty;
        try
        {
            var bytes = Convert.FromBase64String(textoEncriptado);
            return System.Text.Encoding.UTF8.GetString(bytes);
        }
        catch
        {
            return string.Empty;
        }
    }

    #endregion
}
