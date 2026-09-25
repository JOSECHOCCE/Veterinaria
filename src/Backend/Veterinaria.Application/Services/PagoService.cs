using System.Collections.Generic;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class PagoService : IPagoService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditoriaService _auditoriaService;

    public PagoService(IUnitOfWork unitOfWork, IAuditoriaService auditoriaService)
    {
        _unitOfWork = unitOfWork;
        _auditoriaService = auditoriaService;
    }

    public async Task<(List<Pago> Pagos, decimal TotalTarjeta, decimal TotalEfectivo, int TotalPagos)> GetPagosFiltradosAsync(string? tipoPago, string? metodoPago, DateTime? fechaDesde, DateTime? fechaHasta)
    {
        var query = _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
                .ThenInclude(c => c.Mascota)
                    .ThenInclude(m => m.Usuario)
            .Include(p => p.Cita)
                .ThenInclude(c => c.Veterinario)
            .Include(p => p.Cita)
                .ThenInclude(c => c.Servicio)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(tipoPago))
            query = query.Where(p => p.TipoPago == tipoPago);

        if (!string.IsNullOrWhiteSpace(metodoPago))
            query = query.Where(p => p.MetodoPago == metodoPago);

        if (fechaDesde.HasValue)
            query = query.Where(p => p.FechaPago.Date >= fechaDesde.Value.Date);

        if (fechaHasta.HasValue)
            query = query.Where(p => p.FechaPago.Date <= fechaHasta.Value.Date);

        var pagos = await query.OrderByDescending(p => p.FechaPago).ToListAsync();

        var totalTarjeta = pagos.Where(p => p.MetodoPago == "Tarjeta").Sum(p => p.Monto);
        var totalEfectivo = pagos.Where(p => p.MetodoPago == "Efectivo").Sum(p => p.Monto);
        var totalPagos = pagos.Count;

        return (pagos, totalTarjeta, totalEfectivo, totalPagos);
    }

    public async Task<Pago?> GetPagoDetailsAsync(int id)
    {
        var pago = await _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
                .ThenInclude(c => c.Mascota)
                    .ThenInclude(m => m.Usuario)
            .Include(p => p.Cita)
                .ThenInclude(c => c.Veterinario)
            .Include(p => p.Cita)
                .ThenInclude(c => c.Servicio)
            .FirstOrDefaultAsync(p => p.Id == id);

        return pago;
    }

    public async Task<Cita?> GetCitaWithPagosAsync(int citaId)
    {
        return await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
                .ThenInclude(m => m.Usuario)
            .Include(c => c.Veterinario)
            .Include(c => c.Servicio)
            .Include(c => c.Pagos)
            .FirstOrDefaultAsync(c => c.Id == citaId);
    }

    public async Task<ReportePagosDto> GetReportePagosAsync(DateTime fechaDesde, DateTime fechaHasta)
    {
        var query = _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
                .ThenInclude(c => c.Servicio)
            .Where(p => p.FechaPago.Date >= fechaDesde.Date &&
                       p.FechaPago.Date <= fechaHasta.Date);

        var pagos = await query.ToListAsync();

        var reporte = new ReportePagosDto
        {
            TotalRecaudado = pagos.Sum(p => p.Monto),
            TotalPagos = pagos.Count,
            TotalTarjeta = pagos.Where(p => p.MetodoPago == "Tarjeta").Sum(p => p.Monto),
            TotalEfectivo = pagos.Where(p => p.MetodoPago == "Efectivo").Sum(p => p.Monto),
            TotalCompletos = pagos.Where(p => p.TipoPago == "Completo").Sum(p => p.Monto),
            TotalParciales = pagos.Where(p => p.TipoPago == "Parcial").Sum(p => p.Monto),
            TotalRestantes = pagos.Where(p => p.TipoPago == "Restante").Sum(p => p.Monto),
            PagosPorDia = pagos.GroupBy(p => p.FechaPago.Date)
                .Select(g => new PagoPorDiaDto
                {
                    Fecha = g.Key.ToString("yyyy-MM-dd"),
                    Total = g.Sum(p => p.Monto)
                })
                .OrderBy(x => x.Fecha)
                .ToList(),
            PagosPorServicio = pagos.Where(p => p.Cita?.Servicio != null)
                .GroupBy(p => p.Cita!.Servicio!.Nombre)
                .Select(g => new PagoPorServicioDto
                {
                    Servicio = g.Key,
                    Total = g.Sum(p => p.Monto),
                    Cantidad = g.Count()
                })
                .OrderByDescending(x => x.Total)
                .ToList()
        };

        return reporte;
    }

    public async Task<List<Cita>> GetCitasPendientesPagoAsync()
    {
        return await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
                .ThenInclude(m => m.Usuario)
            .Include(c => c.Servicio)
            .Include(c => c.Veterinario)
            .Where(c => c.EstadoPago != "Pagado" && c.Estado == "Completada")
            .OrderBy(c => c.FechaHora)
            .ToListAsync();
    }

    public async Task<Cita?> GetCitaForPagoAsync(int citaId)
    {
        return await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota).ThenInclude(m => m.Usuario)
            .Include(c => c.Servicio)
            .Include(c => c.Veterinario)
            .FirstOrDefaultAsync(c => c.Id == citaId);
    }

    public async Task<TarjetaGuardada?> GetTarjetaGuardadaAsync(int usuarioId)
    {
        return await _unitOfWork.TarjetasGuardadas.GetAll()
            .Where(t => t.UsuarioId == usuarioId && t.Activa)
            .OrderByDescending(t => t.FechaRegistro)
            .FirstOrDefaultAsync();
    }

    public async Task<Pago> ProcesarPagoTarjetaAsync(int citaId, decimal montoTotal, decimal montoPagar, string tipoPago, string numeroTarjeta, bool guardarTarjeta, string nombreTitular, string fechaVencimiento, string cvv, int? usuarioId)
    {
        var referencia = $"PAG-{DateTime.Now:yyyyMMdd}-{citaId:D4}-{new Random().Next(1000, 9999)}";

        var pago = new Pago
        {
            CitaId = citaId,
            Monto = montoPagar,
            MetodoPago = "Tarjeta",
            TipoPago = tipoPago,
            Referencia = referencia,
            UltimosDigitosTarjeta = numeroTarjeta.Substring(numeroTarjeta.Length - 4),
            FechaPago = DateTime.Now
        };

        await _unitOfWork.Pagos.AddAsync(pago);

        var cita = await _unitOfWork.Citas.GetByIdAsync(citaId);
        if (cita != null)
        {
            cita.MontoTotal = montoTotal;
            cita.MontoPagado += montoPagar; // Acumular en vez de sobreescribir
            cita.TipoPago = tipoPago;
            cita.EstadoPago = cita.MontoPagado >= cita.MontoTotal ? "Pagado" : "Parcial";
            if (cita.Estado != "Completada")
            {
                cita.Estado = "Confirmada";
            }
            _unitOfWork.Citas.Update(cita);
        }

        if (guardarTarjeta && usuarioId.HasValue)
        {
            var tarjetaExistente = await _unitOfWork.TarjetasGuardadas.GetAll()
                .Where(t => t.UsuarioId == usuarioId.Value && t.Activa)
                .FirstOrDefaultAsync();

            if (tarjetaExistente != null)
            {
                tarjetaExistente.NombreTitular = EncriptarDatos(nombreTitular);
                tarjetaExistente.NumeroTarjetaEncriptado = EncriptarDatos(numeroTarjeta);
                tarjetaExistente.UltimosDigitos = numeroTarjeta.Substring(numeroTarjeta.Length - 4);
                tarjetaExistente.FechaExpiracion = fechaVencimiento;
                tarjetaExistente.CVVEncriptado = string.Empty; // CVV nunca se almacena (PCI-DSS)
                tarjetaExistente.FechaRegistro = DateTime.UtcNow;
                _unitOfWork.TarjetasGuardadas.Update(tarjetaExistente);
            }
            else
            {
                var nuevaTarjeta = new TarjetaGuardada
                {
                    UsuarioId = usuarioId.Value,
                    NombreTitular = EncriptarDatos(nombreTitular),
                    NumeroTarjetaEncriptado = EncriptarDatos(numeroTarjeta),
                    UltimosDigitos = numeroTarjeta.Substring(numeroTarjeta.Length - 4),
                    FechaExpiracion = fechaVencimiento,
                    CVVEncriptado = string.Empty, // CVV nunca se almacena (PCI-DSS)
                    Activa = true
                };
                await _unitOfWork.TarjetasGuardadas.AddAsync(nuevaTarjeta);
            }
        }

        await _unitOfWork.CommitAsync();

        return pago;
    }

    public async Task<Pago> ProcesarPagoRestanteTarjetaAsync(int citaId, string numeroTarjeta)
    {
        var cita = await _unitOfWork.Citas.GetByIdAsync(citaId)
            ?? throw new InvalidOperationException($"Cita {citaId} no encontrada.");
        var montoRestante = cita.MontoTotal - cita.MontoPagado;
        var referencia = $"PAG-{DateTime.Now:yyyyMMdd}-{citaId:D4}-{new Random().Next(1000, 9999)}";

        var pago = new Pago
        {
            CitaId = citaId,
            Monto = montoRestante,
            MetodoPago = "Tarjeta",
            TipoPago = "Restante",
            Referencia = referencia,
            UltimosDigitosTarjeta = numeroTarjeta.Substring(12),
            FechaPago = DateTime.Now
        };

        await _unitOfWork.Pagos.AddAsync(pago);

        cita.MontoPagado = cita.MontoTotal;
        cita.EstadoPago = "Pagado";

        _unitOfWork.Citas.Update(cita);
        await _unitOfWork.CommitAsync();

        return pago;
    }

    public async Task<Pago?> GetPagoByIdAsync(int pagoId)
    {
        return await _unitOfWork.Pagos.GetByIdAsync(pagoId);
    }

    public async Task<(bool Success, string Message)> AnularPagoAsync(int pagoId, string motivo)
    {
        var pago = await _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
            .FirstOrDefaultAsync(p => p.Id == pagoId);

        if (pago == null)
            return (false, "Pago no encontrado.");

        if (pago.TipoPago == "Anulado")
            return (false, "Este pago ya fue anulado.");

        // Restar monto del pago a la cita
        var cita = pago.Cita;
        if (cita != null)
        {
            cita.MontoPagado -= pago.Monto;
            if (cita.MontoPagado < 0) cita.MontoPagado = 0;
            cita.EstadoPago = cita.MontoPagado <= 0 ? "Pendiente" : "Parcial";
            _unitOfWork.Citas.Update(cita);
        }

        pago.TipoPago = "Anulado";
        pago.Referencia = $"{pago.Referencia} [ANULADO: {motivo}]";
        _unitOfWork.Pagos.Update(pago);

        await _unitOfWork.CommitAsync();

        // Registrar acción en la auditoría (RNF-09)
        await _auditoriaService.RegistrarAccionAsync(
            "Anular Pago",
            "Pago",
            pago.Id.ToString(),
            $"Pago de S/. {pago.Monto} anulado. Motivo: {motivo}. Cita asociada ID: {pago.CitaId}"
        );

        return (true, $"Pago #{pago.Id} anulado correctamente.");
    }

    public async Task<List<Pago>> GetPagosPorUsuarioAsync(int usuarioId)
    {
        return await _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
                .ThenInclude(c => c.Servicio)
            .Include(p => p.Cita)
                .ThenInclude(c => c.Veterinario)
            .Include(p => p.Cita)
                .ThenInclude(c => c.Mascota)
            .Where(p => p.Cita.Mascota.UsuarioId == usuarioId)
            .OrderByDescending(p => p.FechaPago)
            .ToListAsync();
    }

    public async Task<(bool Success, Pago? Pago, string? Error)> RegistrarCobroManualAsync(int citaId, decimal montoTotalAjustado, decimal montoAbonado, string metodoPago, string? referencia, string? observacion, string usuarioOperador)
    {
        if (montoAbonado <= 0)
            return (false, null, "El monto abonado no puede ser cero o negativo.");

        if (montoTotalAjustado <= 0)
            return (false, null, "El monto total ajustado no puede ser cero o negativo.");

        var metodosValidos = new[] { "Efectivo", "Tarjeta", "Transferencia", "Yape", "Plin" };
        if (!metodosValidos.Contains(metodoPago))
            return (false, null, "El método de pago no es válido.");

        var cita = await _unitOfWork.Citas.GetByIdAsync(citaId);
        if (cita == null)
            return (false, null, "Cita no encontrada.");

        if (cita.Estado != "Completada")
            return (false, null, "Solo se pueden registrar cobros en citas en estado 'Completada'.");

        if (cita.EstadoPago == "Pagado")
            return (false, null, "La cita ya se encuentra totalmente pagada.");

        // Regla 4: Precio final diferente debe justificarse
        var montoOriginal = cita.Servicio?.Precio ?? cita.MontoTotal;
        if (montoTotalAjustado != montoOriginal && string.IsNullOrWhiteSpace(observacion))
            return (false, null, "Debe ingresar una observación justificando el cambio de precio total.");

        // Calcular nuevo monto total
        cita.MontoTotal = montoTotalAjustado;

        var tipoPago = "Completo";
        if (cita.MontoPagado + montoAbonado < cita.MontoTotal)
            tipoPago = "Parcial";
        else if (cita.MontoPagado > 0)
            tipoPago = "Restante";

        var refGenerada = string.IsNullOrWhiteSpace(referencia)
            ? $"COB-{DateTime.Now:yyyyMMdd}-{citaId:D4}-{new Random().Next(1000, 9999)}"
            : referencia;

        var pago = new Pago
        {
            CitaId = citaId,
            Monto = montoAbonado,
            MetodoPago = metodoPago,
            TipoPago = tipoPago,
            Referencia = refGenerada,
            Observacion = observacion,
            FechaPago = DateTime.Now
        };

        await _unitOfWork.Pagos.AddAsync(pago);

        cita.MontoPagado += montoAbonado;
        cita.TipoPago = tipoPago;
        cita.EstadoPago = cita.MontoPagado >= cita.MontoTotal ? "Pagado" : "Parcial";

        _unitOfWork.Citas.Update(cita);
        await _unitOfWork.CommitAsync();

        await _auditoriaService.RegistrarAccionAsync(
            "Registrar Cobro Manual",
            "Pago",
            pago.Id.ToString(),
            $"Cobro manual de S/. {pago.Monto} registrado por {usuarioOperador}. Medio: {metodoPago}. Cita ID: {pago.CitaId}"
        );

        return (true, pago, null);
    }

    public async Task<OrdenCobro> CrearOrdenCobroDesdeConsultaAsync(int historialClinicoId)
    {
        var historial = await _unitOfWork.HistorialesClinicos.GetAll()
            .Include(h => h.Cita)
                .ThenInclude(c => c.Servicio)
            .Include(h => h.Cita)
                .ThenInclude(c => c.Mascota)
            .FirstOrDefaultAsync(h => h.Id == historialClinicoId)
            ?? throw new InvalidOperationException($"Historial clínico {historialClinicoId} no encontrado.");

        var cita = historial.Cita;
        var clienteId = cita.Mascota?.UsuarioId ?? 0;

        var orden = new OrdenCobro
        {
            CitaId = cita.Id,
            ClienteId = clienteId,
            MascotaId = cita.MascotaId,
            Fecha = DateTime.UtcNow,
            Estado = "Pendiente",
            Observaciones = $"Orden de cobro generada automáticamente desde consulta médica #{historialClinicoId}"
        };

        // Item 1: Consulta / Servicio médico
        if (cita.Servicio != null)
        {
            orden.Detalles.Add(new DetalleOrdenCobro
            {
                TipoItem = "Servicio",
                ServicioId = cita.ServicioId,
                Descripcion = cita.Servicio.Nombre,
                Cantidad = 1,
                PrecioUnitario = cita.Servicio.Precio,
                Subtotal = cita.Servicio.Precio
            });
        }
        else
        {
            orden.Detalles.Add(new DetalleOrdenCobro
            {
                TipoItem = "Servicio",
                Descripcion = "Consulta Médica General",
                Cantidad = 1,
                PrecioUnitario = cita.MontoTotal > 0 ? cita.MontoTotal : 50m,
                Subtotal = cita.MontoTotal > 0 ? cita.MontoTotal : 50m
            });
        }

        // Item 2: Medicamentos recetados de stock interno
        var receta = await _unitOfWork.Recetas.GetAll()
            .Include(r => r.Items)
                .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(r => r.HistorialClinicoId == historialClinicoId);

        if (receta != null)
        {
            foreach (var detalle in receta.Items.Where(d => d.EsStockInterno && d.Producto != null))
            {
                var subtotal = detalle.CantidadPrescrita * detalle.Producto!.Precio;
                orden.Detalles.Add(new DetalleOrdenCobro
                {
                    TipoItem = "Medicamento",
                    ProductoId = detalle.ProductoId,
                    Descripcion = detalle.Producto.Nombre,
                    Cantidad = detalle.CantidadPrescrita,
                    PrecioUnitario = detalle.Producto.Precio,
                    Subtotal = subtotal
                });
            }
        }

        orden.MontoTotal = orden.Detalles.Sum(d => d.Subtotal);
        await _unitOfWork.OrdenesCobro.AddAsync(orden);
        await _unitOfWork.CommitAsync();

        return orden;
    }

    public async Task<List<OrdenCobroDto>> GetOrdenesCobroPendientesAsync()
    {
        var ordenes = await _unitOfWork.OrdenesCobro.GetAll()
            .Include(o => o.Cliente)
            .Include(o => o.Mascota)
            .Include(o => o.Detalles)
            .Where(o => o.Estado == "Pendiente")
            .OrderByDescending(o => o.Fecha)
            .ToListAsync();

        return ordenes.Select(o => new OrdenCobroDto
        {
            Id = o.Id,
            CitaId = o.CitaId,
            ClienteId = o.ClienteId,
            NombreCliente = o.Cliente?.Nombre ?? "Desconocido",
            MascotaId = o.MascotaId,
            NombreMascota = o.Mascota?.Nombre,
            Fecha = o.Fecha,
            MontoTotal = o.MontoTotal,
            Estado = o.Estado,
            Observaciones = o.Observaciones,
            Detalles = o.Detalles.Select(d => new DetalleOrdenCobroDto
            {
                Id = d.Id,
                TipoItem = d.TipoItem,
                ProductoId = d.ProductoId,
                ServicioId = d.ServicioId,
                Descripcion = d.Descripcion,
                Cantidad = d.Cantidad,
                PrecioUnitario = d.PrecioUnitario,
                Subtotal = d.Subtotal
            }).ToList()
        }).ToList();
    }

    public async Task<(bool Success, Pago? Pago, string? Error)> ProcesarPagoMixtoAsync(ProcesarPagoMixtoDto dto, string usuarioOperador)
    {
        if (dto == null || dto.MetodosPago == null || !dto.MetodosPago.Any())
            return (false, null, "Debe especificar al menos un medio de pago.");

        // Validar Idempotencia
        if (!string.IsNullOrWhiteSpace(dto.ClaveIdempotencia))
        {
            var pagoExiste = await _unitOfWork.Pagos.GetAll()
                .AnyAsync(p => p.ClaveIdempotencia == dto.ClaveIdempotencia);
            if (pagoExiste)
                return (false, null, "El pago con esta clave de idempotencia ya fue procesado.");
        }

        var orden = await _unitOfWork.OrdenesCobro.GetAll()
            .AsTracking()
            .Include(o => o.Detalles)
            .FirstOrDefaultAsync(o => o.Id == dto.OrdenCobroId);

        if (orden == null)
            return (false, null, "Orden de cobro no encontrada.");

        if (orden.Estado != "Pendiente")
            return (false, null, "La orden de cobro ya fue pagada o anulada.");

        var totalSubPagos = dto.MetodosPago.Sum(p => p.Monto);
        if (totalSubPagos != orden.MontoTotal)
            return (false, null, $"La suma de los sub-pagos (S/. {totalSubPagos}) no coincide con el total de la orden (S/. {orden.MontoTotal}).");

        // T6 SHOULD: transacción atómica caja (todo o nada). No-op en provider no relacional.
        await _unitOfWork.BeginTransactionAsync();
        Pago pago;
        try
        {
            // Re-chequeo de idempotencia dentro de la transacción (cierra TOCTOU en relacional).
            if (!string.IsNullOrWhiteSpace(dto.ClaveIdempotencia))
            {
                var pagoDuplicado = await _unitOfWork.Pagos.GetAll()
                    .AnyAsync(p => p.ClaveIdempotencia == dto.ClaveIdempotencia);
                if (pagoDuplicado)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return (false, null, "El pago con esta clave de idempotencia ya fue procesado.");
                }
            }

            // Descuento de stock atómico
            foreach (var detalle in orden.Detalles.Where(d => d.ProductoId.HasValue))
            {
                var prod = await _unitOfWork.Productos.GetByIdAsync(detalle.ProductoId!.Value);
                if (prod != null)
                {
                    if (prod.Stock < detalle.Cantidad)
                    {
                        await _unitOfWork.RollbackTransactionAsync();
                        return (false, null, $"Stock insuficiente para '{prod.Nombre}'. Stock disponible: {prod.Stock}, solicitado: {detalle.Cantidad}.");
                    }

                    prod.Stock -= detalle.Cantidad;
                    _unitOfWork.Productos.Update(prod);

                    var movimiento = new MovimientoInventario
                    {
                        ProductoId = prod.Id,
                        TipoMovimiento = "SalidaVenta",
                        Cantidad = detalle.Cantidad,
                        Motivo = $"Venta en caja según Orden de Cobro #{orden.Id}",
                        RegistradoPor = usuarioOperador,
                        FechaRegistro = DateTime.UtcNow
                    };
                    await _unitOfWork.MovimientosInventario.AddAsync(movimiento);
                }
            }

            var metodoPrincipal = dto.MetodosPago.Count > 1 ? "Mixto" : dto.MetodosPago.First().MetodoPago;
            var estadoVerificacion = dto.MetodosPago.Any(p => p.EstadoVerificacion == "PendienteVerificacion")
                ? "PendienteVerificacion"
                : "Confirmado";

            var referencias = string.Join(", ", dto.MetodosPago
                .Where(p => !string.IsNullOrWhiteSpace(p.NumeroOperacion))
                .Select(p => $"{p.MetodoPago}: {p.NumeroOperacion}"));

            pago = new Pago
            {
                CitaId = orden.CitaId ?? 0,
                OrdenCobroId = orden.Id,
                Monto = orden.MontoTotal,
                MetodoPago = metodoPrincipal,
                TipoPago = "Completo",
                Referencia = string.IsNullOrWhiteSpace(referencias) ? null : referencias,
                EstadoVerificacion = estadoVerificacion,
                ClaveIdempotencia = dto.ClaveIdempotencia,
                NombreCajero = usuarioOperador,
                DesgloseMetodos = System.Text.Json.JsonSerializer.Serialize(dto.MetodosPago),
                Observacion = dto.Observacion,
                FechaPago = DateTime.Now
            };

            await _unitOfWork.Pagos.AddAsync(pago);

            orden.Estado = "Pagada";

            if (orden.CitaId.HasValue && orden.CitaId.Value > 0)
            {
                var cita = await _unitOfWork.Citas.GetByIdAsync(orden.CitaId.Value);
                if (cita != null)
                {
                    cita.MontoTotal = orden.MontoTotal;
                    cita.MontoPagado = orden.MontoTotal;
                    cita.EstadoPago = "Pagado";
                    cita.TipoPago = "Completo";
                    // RF-023: solo cerrar cita cuando el pago queda Confirmado.
                    // Si queda PendienteVerificacion, se cierra al verificar (CambiarEstadoVerificacionPagoAsync).
                    if (estadoVerificacion == "Confirmado")
                        cita.Estado = "Completada";
                    _unitOfWork.Citas.Update(cita);
                }
            }

            await _unitOfWork.CommitAsync();
            await _unitOfWork.CommitTransactionAsync();
        }
        catch (DbUpdateException ex) when (ex.Message.Contains("ClaveIdempotencia") || ex.InnerException?.Message.Contains("ClaveIdempotencia") == true)
        {
            await _unitOfWork.RollbackTransactionAsync();
            return (false, null, "El pago con esta clave de idempotencia ya fue procesado.");
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }

        await _auditoriaService.RegistrarAccionAsync(
            "Cobro Mixto Caja",
            "Pago",
            pago.Id.ToString(),
            $"Pago de S/. {pago.Monto} procesado en caja por {usuarioOperador}. Métodos: {pago.MetodoPago}."
        );

        return (true, pago, null);
    }

    public async Task<List<Pago>> GetPagosPendientesVerificacionAsync()
    {
        return await _unitOfWork.Pagos.GetAll()
            .Include(p => p.Cita)
                .ThenInclude(c => c.Mascota)
            .Where(p => p.EstadoVerificacion == "PendienteVerificacion")
            .OrderByDescending(p => p.FechaPago)
            .ToListAsync();
    }

    public async Task<(bool Success, string Message)> CambiarEstadoVerificacionPagoAsync(int pagoId, string nuevoEstado, string usuarioAdmin)
    {
        var pago = await _unitOfWork.Pagos.GetByIdAsync(pagoId);
        if (pago == null)
            return (false, "Pago no encontrado.");

        pago.EstadoVerificacion = nuevoEstado;
        _unitOfWork.Pagos.Update(pago);

        // RF-023: al confirmar verificación, cerrar la cita vinculada.
        var esConfirmado = string.Equals(nuevoEstado, "Confirmado", StringComparison.OrdinalIgnoreCase)
            || string.Equals(nuevoEstado, "Verificado", StringComparison.OrdinalIgnoreCase);
        if (esConfirmado && pago.CitaId > 0)
        {
            var cita = await _unitOfWork.Citas.GetByIdAsync(pago.CitaId);
            if (cita != null)
            {
                cita.Estado = "Completada";
                cita.EstadoPago = "Pagado";
                if (cita.MontoPagado <= 0)
                    cita.MontoPagado = pago.Monto;
                _unitOfWork.Citas.Update(cita);
            }
        }

        await _unitOfWork.CommitAsync();

        await _auditoriaService.RegistrarAccionAsync(
            "Verificacion Pago Digital",
            "Pago",
            pago.Id.ToString(),
            $"Estado de verificación del Pago #{pago.Id} cambiado a '{nuevoEstado}' por {usuarioAdmin}."
        );

        return (true, $"Pago #{pago.Id} actualizado a estado '{nuevoEstado}'.");
    }

    public async Task<CierreCajaDto> GetCierreCajaDiarioAsync(DateTime fecha, int? cajeroId = null)
    {
        var query = _unitOfWork.Pagos.GetAll()
            .Where(p => p.FechaPago.Date == fecha.Date);

        if (cajeroId.HasValue)
            query = query.Where(p => p.CajeroId == cajeroId.Value);

        var pagos = await query.ToListAsync();

        var totalGeneral = pagos.Sum(p => p.Monto);
        decimal totalEfectivo = 0;
        decimal totalTarjeta = 0;
        decimal totalYape = 0;
        decimal totalPlin = 0;
        decimal totalTransferencia = 0;

        foreach (var p in pagos)
        {
            if (p.MetodoPago == "Mixto" && !string.IsNullOrWhiteSpace(p.DesgloseMetodos))
            {
                try
                {
                    var subPagos = System.Text.Json.JsonSerializer.Deserialize<List<DetallePagoMetodoDto>>(p.DesgloseMetodos);
                    if (subPagos != null)
                    {
                        foreach (var sub in subPagos)
                        {
                            switch (sub.MetodoPago?.ToLower())
                            {
                                case "efectivo": totalEfectivo += sub.Monto; break;
                                case "tarjeta": totalTarjeta += sub.Monto; break;
                                case "yape": totalYape += sub.Monto; break;
                                case "plin": totalPlin += sub.Monto; break;
                                case "transferencia": totalTransferencia += sub.Monto; break;
                                default: totalEfectivo += sub.Monto; break;
                            }
                        }
                    }
                }
                catch
                {
                    totalEfectivo += p.Monto;
                }
            }
            else
            {
                switch (p.MetodoPago?.ToLower())
                {
                    case "efectivo": totalEfectivo += p.Monto; break;
                    case "tarjeta": totalTarjeta += p.Monto; break;
                    case "yape": totalYape += p.Monto; break;
                    case "plin": totalPlin += p.Monto; break;
                    case "transferencia": totalTransferencia += p.Monto; break;
                    default: totalTarjeta += p.Monto; break;
                }
            }
        }

        var pendientesCount = pagos.Count(p => p.EstadoVerificacion == "PendienteVerificacion");

        var porCajero = pagos
            .GroupBy(p => p.NombreCajero ?? "Cajero General")
            .Select(g => new CierreCajaPorCajeroDto
            {
                NombreCajero = g.Key,
                Total = g.Sum(p => p.Monto),
                CantidadPagos = g.Count()
            }).ToList();

        return new CierreCajaDto
        {
            Fecha = fecha.ToString("yyyy-MM-dd"),
            TotalGeneral = totalGeneral,
            TotalEfectivo = totalEfectivo,
            TotalTarjeta = totalTarjeta,
            TotalYape = totalYape,
            TotalPlin = totalPlin,
            TotalTransferencia = totalTransferencia,
            PagosPendientesVerificacionCount = pendientesCount,
            TotalesPorCajero = porCajero
        };
    }

    private static string EncriptarDatos(string texto)
    {
        if (string.IsNullOrEmpty(texto)) return string.Empty;
        // Hash SHA256 — no reversible, adecuado para datos sensibles que no necesitan ser leídos de vuelta
        var bytes = System.Text.Encoding.UTF8.GetBytes(texto);
        var hash = SHA256.HashData(bytes);
        return Convert.ToBase64String(hash);
    }
}

