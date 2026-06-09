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
using Veterinaria.Application.DTOs;

namespace Veterinaria.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PagoCitaController : ControllerBase
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

    private async Task<bool> UsuarioPuedeGestionarPagoAsync(Cita cita)
    {
        if (User.IsInRole("Admin") || User.IsInRole("Administrador") || User.IsInRole("Recepcionista"))
            return true;

        var currentUsuario = await GetCurrentUsuarioAsync();
        return currentUsuario != null && cita.Mascota?.UsuarioId == currentUsuario.Id;
    }

    [HttpGet("Pagar/{citaId}")]
    public async Task<ActionResult<Response<object>>> Pagar(int citaId)
    {
        var cita = await _pagoService.GetCitaForPagoAsync(citaId);

        if (cita == null)
        {
            return NotFound(Response<object>.Fail("Cita no encontrada."));
        }

        if (!await UsuarioPuedeGestionarPagoAsync(cita))
        {
            return Forbid();
        }

        var currentUsuario = await GetCurrentUsuarioAsync() ?? cita.Mascota?.Usuario;

        if (cita.EstadoPago == "Pagado")
        {
            return BadRequest(Response<object>.Fail("Esta cita ya está pagada completamente."));
        }

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
            TieneTarjetaGuardada = tarjetaGuardada != null,
            TarjetaGuardadaUltimosDigitos = tarjetaGuardada?.UltimosDigitos,
            UsarTarjetaGuardada = tarjetaGuardada != null,
            NombreTitular = tarjetaGuardada != null ? DesencriptarSimple(tarjetaGuardada.NombreTitular) : string.Empty,
            NumeroTarjeta = tarjetaGuardada != null ? DesencriptarSimple(tarjetaGuardada.NumeroTarjetaEncriptado) : string.Empty,
            FechaVencimiento = tarjetaGuardada?.FechaExpiracion ?? string.Empty,
            CVV = tarjetaGuardada != null ? DesencriptarSimple(tarjetaGuardada.CVVEncriptado) : string.Empty
        };

        return Ok(Response<object>.Ok(viewModel));
    }

    [HttpPost("ProcesarPago")]
    public async Task<ActionResult<Response<object>>> ProcesarPago([FromBody] PagoTarjetaViewModel model)
    {
        var cita = await _pagoService.GetCitaForPagoAsync(model.CitaId);

        if (cita == null)
        {
            return NotFound(Response<object>.Fail("Cita no encontrada."));
        }

        if (!await UsuarioPuedeGestionarPagoAsync(cita))
        {
            return Forbid();
        }

        if (cita.Estado != "Completada")
        {
            return BadRequest(Response<object>.Fail("El pago se habilita cuando la cita está completada."));
        }

        if (cita.EstadoPago == "Pagado")
        {
            return BadRequest(Response<object>.Fail("Esta cita ya está pagada completamente."));
        }

        if (!ModelState.IsValid || !model.EsFechaVencimientoValida())
        {
            return BadRequest(Response<object>.Fail("Datos de pago inválidos o tarjeta vencida."));
        }

        var montoTotal = cita.MontoTotal > 0 ? cita.MontoTotal : cita.Servicio?.Precio ?? 0;
        var saldoPendiente = montoTotal - cita.MontoPagado;
        var montoPagar = model.TipoPago == "Parcial" ? montoTotal * 0.5m : saldoPendiente;

        if (montoPagar <= 0)
        {
            return BadRequest(Response<object>.Fail("No existe saldo pendiente para esta cita."));
        }

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

        return Ok(Response<object>.Ok(new
        {
            Message = $"¡Pago exitoso! Referencia: {pago.Referencia}",
            PagoId = pago.Id,
            CitaId = cita.Id
        }));
    }

    [HttpGet("Confirmacion/{citaId}/{pagoId}")]
    public async Task<ActionResult<Response<object>>> Confirmacion(int citaId, int pagoId)
    {
        var cita = await _pagoService.GetCitaWithPagosAsync(citaId);
        var pago = await _pagoService.GetPagoByIdAsync(pagoId);

        if (cita == null || pago == null)
        {
            return NotFound(Response<object>.Fail("Cita o pago no encontrados."));
        }

        return Ok(Response<object>.Ok(new { Cita = cita, Pago = pago }));
    }

    [HttpGet("CompletarPago/{citaId}")]
    public async Task<ActionResult<Response<object>>> CompletarPago(int citaId)
    {
        var cita = await _pagoService.GetCitaForPagoAsync(citaId);

        if (cita == null)
        {
            return NotFound(Response<object>.Fail("Cita no encontrada."));
        }

        if (!await UsuarioPuedeGestionarPagoAsync(cita))
        {
            return Forbid();
        }

        if (cita.EstadoPago != "Parcial")
        {
            var msg = cita.EstadoPago == "Pagado" ? "Esta cita ya está pagada completamente." : "Esta cita no tiene pagos previos.";
            return BadRequest(Response<object>.Fail(msg));
        }

        if (cita.Estado != "Completada")
        {
            return BadRequest(Response<object>.Fail("El pago restante se habilitará cuando la cita sea atendida."));
        }

        var montoRestante = cita.MontoTotal - cita.MontoPagado;
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
            TieneTarjetaGuardada = tarjetaGuardada != null,
            TarjetaGuardadaUltimosDigitos = tarjetaGuardada?.UltimosDigitos,
            UsarTarjetaGuardada = tarjetaGuardada != null,
            NombreTarjeta = tarjetaGuardada != null ? DesencriptarSimple(tarjetaGuardada.NombreTitular) : null,
            NumeroTarjeta = tarjetaGuardada != null ? DesencriptarSimple(tarjetaGuardada.NumeroTarjetaEncriptado) : null,
            FechaVencimiento = tarjetaGuardada?.FechaExpiracion,
            CVV = tarjetaGuardada != null ? DesencriptarSimple(tarjetaGuardada.CVVEncriptado) : null
        };

        return Ok(Response<object>.Ok(viewModel));
    }

    [HttpPost("ProcesarPagoRestante")]
    public async Task<ActionResult<Response<object>>> ProcesarPagoRestante([FromBody] CompletarPagoViewModel model)
    {
        var cita = await _pagoService.GetCitaForPagoAsync(model.CitaId);

        if (cita == null)
        {
            return NotFound(Response<object>.Fail("Cita no encontrada."));
        }

        if (!await UsuarioPuedeGestionarPagoAsync(cita))
        {
            return Forbid();
        }

        if (cita.Estado != "Completada")
        {
            return BadRequest(Response<object>.Fail("El pago restante se habilitará cuando la cita sea atendida."));
        }

        if (cita.EstadoPago != "Parcial")
        {
            var msg = cita.EstadoPago == "Pagado" ? "Esta cita ya está pagada completamente." : "Esta cita no tiene pagos previos.";
            return BadRequest(Response<object>.Fail(msg));
        }

        var montoRestante = cita.MontoTotal - cita.MontoPagado;

        if (model.MetodoPago == "Tarjeta")
        {
            if (string.IsNullOrEmpty(model.NumeroTarjeta) || model.NumeroTarjeta.Length != 16 ||
                string.IsNullOrEmpty(model.CVV) || model.CVV.Length != 3 ||
                string.IsNullOrEmpty(model.FechaVencimiento))
            {
                return BadRequest(Response<object>.Fail("Los datos de la tarjeta son inválidos."));
            }

            var pago = await _pagoService.ProcesarPagoRestanteTarjetaAsync(cita.Id, model.NumeroTarjeta);
            return Ok(Response<object>.Ok(new
            {
                Message = $"¡Pago completado exitosamente! Referencia: {pago.Referencia}",
                PagoId = pago.Id,
                CitaId = cita.Id
            }));
        }
        else
        {
            var voucherReferencia = $"VOU-{DateTime.Now:yyyyMMdd}-{cita.Id:D4}-{new Random().Next(1000, 9999)}";
            return Ok(Response<object>.Ok(new
            {
                Message = "Se ha generado su voucher de pago. Acérquese a caja para completar su pago.",
                VoucherReferencia = voucherReferencia,
                CitaId = cita.Id,
                MontoRestante = montoRestante
            }));
        }
    }

    [HttpGet("VoucherPagoEfectivo/{citaId}")]
    public async Task<ActionResult<Response<object>>> VoucherPagoEfectivo(int citaId, [FromQuery] decimal montoRestante, [FromQuery] string referencia)
    {
        var cita = await _pagoService.GetCitaForPagoAsync(citaId);

        if (cita == null)
        {
            return NotFound(Response<object>.Fail("Cita no encontrada."));
        }

        return Ok(Response<object>.Ok(new
        {
            Cita = cita,
            MontoRestante = montoRestante,
            MontoPagado = cita.MontoPagado,
            MontoTotal = cita.MontoTotal,
            Referencia = referencia
        }));
    }

    [HttpGet("DescargarVoucherEfectivo")]
    public async Task<ActionResult<Response<object>>> DescargarVoucherEfectivo([FromQuery] int citaId, [FromQuery] decimal montoRestante, [FromQuery] decimal montoPagado, [FromQuery] decimal montoTotal, [FromQuery] string referencia)
    {
        var cita = await _pagoService.GetCitaForPagoAsync(citaId);

        if (cita == null)
        {
            return NotFound(Response<object>.Fail("Cita no encontrada."));
        }

        var pdfBytes = _pdfService.GenerarVoucherPagoEfectivo(cita, montoPagado, montoRestante, montoTotal, referencia);
        var base64 = Convert.ToBase64String(pdfBytes);
        return Ok(Response<object>.Ok(new { FileBase64 = base64, FileName = $"Voucher_Pago_{referencia}.pdf", ContentType = "application/pdf" }));
    }

    [HttpGet("DescargarComprobante/{pagoId}")]
    public async Task<ActionResult<Response<object>>> DescargarComprobante(int pagoId)
    {
        var pago = await _pagoService.GetPagoByIdAsync(pagoId);

        if (pago == null)
        {
            return NotFound(Response<object>.Fail("Pago no encontrado."));
        }

        var cita = await _pagoService.GetCitaForPagoAsync(pago.CitaId);
        if (cita == null)
        {
            return NotFound(Response<object>.Fail("Cita no encontrada."));
        }

        if (!await UsuarioPuedeGestionarPagoAsync(cita))
        {
            return Forbid();
        }

        pago.Cita = cita;

        var pdfBytes = _pdfService.GenerarComprobantePago(pago.Cita, pago);
        var base64 = Convert.ToBase64String(pdfBytes);
        return Ok(Response<object>.Ok(new { FileBase64 = base64, FileName = $"Comprobante_Pago_{pago.Referencia}.pdf", ContentType = "application/pdf" }));
    }

    [HttpGet("DescargarFicha/{citaId}")]
    public async Task<ActionResult<Response<object>>> DescargarFicha(int citaId)
    {
        var cita = await _pagoService.GetCitaForPagoAsync(citaId);

        if (cita == null)
        {
            return NotFound(Response<object>.Fail("Cita no encontrada."));
        }

        var pdfBytes = _pdfService.GenerarFichaCita(cita);
        var base64 = Convert.ToBase64String(pdfBytes);
        return Ok(Response<object>.Ok(new { FileBase64 = base64, FileName = $"Ficha_Cita_{cita.Id:D6}.pdf", ContentType = "application/pdf" }));
    }

    #region Métodos auxiliares de encriptación simple

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
