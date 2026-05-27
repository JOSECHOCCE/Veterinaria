using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;
using Veterinaria.Web.Models.Dto;
using Veterinaria.Web.Services;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin,Recepcionista")]
[ApiController]
[Route("api/[controller]")]
public class VentasController : ControllerBase
{
    private readonly IVentaService _ventaService;
    private readonly IMapper _mapper;
    private readonly PdfService _pdfService;

    public VentasController(IVentaService ventaService, IMapper mapper, PdfService pdfService)
    {
        _ventaService = ventaService;
        _mapper = mapper;
        _pdfService = pdfService;
    }

    [HttpGet]
    public async Task<ActionResult<Response<object>>> Index([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta, [FromQuery] int page = 1)
    {
        var query = _ventaService.GetVentasQuery();

        if (desde.HasValue)
        {
            query = query.Where(v => v.Fecha >= desde.Value);
        }

        if (hasta.HasValue)
        {
            var hastaFin = hasta.Value.AddDays(1).AddSeconds(-1);
            query = query.Where(v => v.Fecha <= hastaFin);
        }

        var total = await query.CountAsync();
        var ventas = await query.OrderByDescending(v => v.Fecha)
            .Skip((page - 1) * 15)
            .Take(15)
            .ToListAsync();

        var dtos = _mapper.Map<List<VentaDto>>(ventas);

        return Ok(Response<object>.Ok(new { Data = dtos, Total = total, Page = page, PageSize = 15 }));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Response<VentaDto>>> Details(int id)
    {
        var venta = await _ventaService.GetVentaByIdAsync(id);
        if (venta == null)
        {
            return NotFound(Response<VentaDto>.Fail("Venta no encontrada."));
        }

        var dto = _mapper.Map<VentaDto>(venta);
        return Ok(Response<VentaDto>.Ok(dto));
    }

    [HttpPost]
    public async Task<ActionResult<Response<VentaDto>>> Create([FromBody] VentaDto dto)
    {
        if (dto == null || dto.Detalles == null || !dto.Detalles.Any())
        {
            return BadRequest(Response<VentaDto>.Fail("La venta debe contener al menos un producto."));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(Response<VentaDto>.Fail("Modelo de venta inválido."));
        }

        try
        {
            var venta = _mapper.Map<Venta>(dto);
            
            // Registrar y procesar
            await _ventaService.RegistrarVentaAsync(venta);

            // Cargar datos del cliente y de los productos para la respuesta
            var ventaCompletada = await _ventaService.GetVentaByIdAsync(venta.Id);
            var resultDto = _mapper.Map<VentaDto>(ventaCompletada);

            return Ok(Response<VentaDto>.Ok(resultDto, "Venta registrada exitosamente."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(Response<VentaDto>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, Response<VentaDto>.Fail($"Error interno al registrar la venta: {ex.Message}"));
        }
    }

    [HttpPost("Cancel/{id}")]
    public async Task<ActionResult<Response<object>>> Cancel(int id)
    {
        var success = await _ventaService.CancelarVentaAsync(id);
        if (!success)
        {
            return BadRequest(Response<object>.Fail("No se pudo cancelar la venta. Puede que ya esté cancelada o no exista."));
        }

        return Ok(Response<object>.Ok("Venta cancelada exitosamente y stock restablecido."));
    }

    [HttpGet("Factura/{id}")]
    public async Task<IActionResult> GetFacturaPdf(int id)
    {
        var venta = await _ventaService.GetVentaByIdAsync(id);
        if (venta == null)
        {
            return NotFound(Response<object>.Fail("Venta no encontrada."));
        }

        var pdfBytes = _pdfService.GenerarFacturaVenta(venta);
        return File(pdfBytes, "application/pdf", $"Factura_FAC_{venta.Id:D6}.pdf");
    }
}
