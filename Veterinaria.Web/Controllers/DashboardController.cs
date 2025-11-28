using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Domain.Contracts;
using Veterinaria.Web.Models;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin")]
public class DashboardController : Controller
{
    private readonly IUnitOfWork _unitOfWork;

    public DashboardController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IActionResult> Index()
    {
        var hoy = DateTime.Today;
        var inicioSemana = hoy.AddDays(-(int)hoy.DayOfWeek + (int)DayOfWeek.Monday);
        if (hoy.DayOfWeek == DayOfWeek.Sunday)
            inicioSemana = inicioSemana.AddDays(-7);
        var finSemana = inicioSemana.AddDays(6);
        var inicioMes = new DateTime(hoy.Year, hoy.Month, 1);
        var finMes = inicioMes.AddMonths(1).AddDays(-1);
        var proximosTresDias = hoy.AddDays(3);

        var viewModel = new DashboardViewModel();

        // 1. Citas de hoy
        var citasHoy = await _unitOfWork.Citas.GetAll()
            .Where(c => c.FechaHora.Date == hoy)
            .ToListAsync();

        viewModel.CitasHoyTotal = citasHoy.Count;
        viewModel.CitasHoyPendientes = citasHoy.Count(c => c.Estado == "Pendiente");
        viewModel.CitasHoyConfirmadas = citasHoy.Count(c => c.Estado == "Confirmada");
        viewModel.CitasHoyEnProceso = citasHoy.Count(c => c.Estado == "EnProceso");
        viewModel.CitasHoyCompletadas = citasHoy.Count(c => c.Estado == "Completada");
        viewModel.CitasHoyCanceladas = citasHoy.Count(c => c.Estado == "Cancelada");

        // 2. Citas de la semana
        var citasSemana = await _unitOfWork.Citas.GetAll()
            .Where(c => c.FechaHora.Date >= inicioSemana && c.FechaHora.Date <= finSemana)
            .ToListAsync();

        viewModel.CitasSemanaTotal = citasSemana.Count;
        viewModel.CitasSemanaCompletadas = citasSemana.Count(c => c.Estado == "Completada");
        viewModel.CitasSemanaPendientes = citasSemana.Count(c => c.Estado == "Pendiente" || c.Estado == "Confirmada");

        // 3. Servicios más solicitados (top 5) - del mes actual
        var serviciosMasSolicitados = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Servicio)
            .Where(c => c.FechaHora.Date >= inicioMes && c.FechaHora.Date <= finMes)
            .Where(c => c.Estado != "Cancelada")
            .GroupBy(c => new { c.ServicioId, c.Servicio.Nombre, c.Servicio.Precio })
            .Select(g => new ServicioEstadistica
            {
                Nombre = g.Key.Nombre,
                CantidadCitas = g.Count(),
                Ingresos = g.Count() * g.Key.Precio
            })
            .OrderByDescending(s => s.CantidadCitas)
            .Take(5)
            .ToListAsync();

        viewModel.ServiciosMasSolicitados = serviciosMasSolicitados;

        // 4. Ingresos del mes
        var pagosMes = await _unitOfWork.Pagos.GetAll()
            .Where(p => p.FechaPago.Month == hoy.Month && 
                   p.FechaPago.Year == hoy.Year)
            .ToListAsync();

        viewModel.IngresosMes = pagosMes.Sum(p => p.Monto);
        viewModel.PagosConfirmadosMes = pagosMes.Count;

        // 5. Veterinarios más ocupados
        var veterinariosOcupados = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Veterinario)
            .Where(c => c.FechaHora.Date >= inicioMes && c.FechaHora.Date <= finMes)
            .Where(c => c.Estado != "Cancelada")
            .GroupBy(c => new { c.VeterinarioId, c.Veterinario.Nombre, c.Veterinario.Especialidad })
            .Select(g => new
            {
                g.Key.VeterinarioId,
                g.Key.Nombre,
                g.Key.Especialidad,
                CitasMes = g.Count()
            })
            .OrderByDescending(v => v.CitasMes)
            .Take(5)
            .ToListAsync();

        // Calcular citas de la semana para cada veterinario
        var citasSemanaVets = await _unitOfWork.Citas.GetAll()
            .Where(c => c.FechaHora.Date >= inicioSemana && c.FechaHora.Date <= finSemana)
            .Where(c => c.Estado != "Cancelada")
            .GroupBy(c => c.VeterinarioId)
            .Select(g => new { VeterinarioId = g.Key, CitasSemana = g.Count() })
            .ToListAsync();

        viewModel.VeterinariosMasOcupados = veterinariosOcupados.Select(v => new VeterinarioEstadistica
        {
            Nombre = v.Nombre,
            Especialidad = v.Especialidad,
            CitasMes = v.CitasMes,
            CitasSemana = citasSemanaVets.FirstOrDefault(cs => cs.VeterinarioId == v.VeterinarioId)?.CitasSemana ?? 0
        }).ToList();

        // 6. Mascotas atendidas por especie (del mes)
        var mascotasPorEspecie = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
            .Where(c => c.FechaHora.Date >= inicioMes && c.FechaHora.Date <= finMes)
            .Where(c => c.Estado == "Completada")
            .GroupBy(c => c.Mascota.Especie)
            .Select(g => new EspecieEstadistica
            {
                Especie = g.Key,
                Cantidad = g.Select(c => c.MascotaId).Distinct().Count()
            })
            .OrderByDescending(e => e.Cantidad)
            .ToListAsync();

        viewModel.MascotasPorEspecie = mascotasPorEspecie;

        // 7. Próximas citas (siguientes 3 días)
        var proximasCitas = await _unitOfWork.Citas.GetAll()
            .Include(c => c.Mascota)
                .ThenInclude(m => m.Usuario)
            .Include(c => c.Veterinario)
            .Include(c => c.Servicio)
            .Where(c => c.FechaHora.Date >= hoy && c.FechaHora.Date <= proximosTresDias)
            .Where(c => c.Estado == "Pendiente" || c.Estado == "Confirmada")
            .OrderBy(c => c.FechaHora)
            .Take(10)
            .ToListAsync();

        viewModel.ProximasCitas = proximasCitas.Select(c => new CitaProxima
        {
            Id = c.Id,
            FechaHora = c.FechaHora,
            MascotaNombre = c.Mascota.Nombre,
            PropietarioNombre = c.Mascota.Usuario?.Nombre ?? "N/A",
            VeterinarioNombre = c.Veterinario.Nombre,
            ServicioNombre = c.Servicio.Nombre,
            Estado = c.Estado
        }).ToList();

        // 8. Citas con pagos pendientes (parciales)
        var citasPagosPendientes = await _unitOfWork.Citas.GetAll()
            .Where(c => c.EstadoPago == "Parcial" && c.Estado == "Completada")
            .ToListAsync();

        viewModel.PagosPendientesCount = citasPagosPendientes.Count;
        viewModel.PagosPendientesTotal = citasPagosPendientes.Sum(c => c.MontoTotal - c.MontoPagado);

        // Datos adicionales de contexto
        viewModel.TotalMascotas = await _unitOfWork.Mascotas.GetAll().CountAsync();
        viewModel.TotalVeterinarios = await _unitOfWork.Veterinarios.GetAll().Where(v => v.Activo).CountAsync();
        viewModel.TotalUsuarios = await _unitOfWork.Usuarios.GetAll().Where(u => u.Activo).CountAsync();
        viewModel.TotalServicios = await _unitOfWork.Servicios.GetAll().Where(s => s.Activo).CountAsync();

        return View(viewModel);
    }
}
