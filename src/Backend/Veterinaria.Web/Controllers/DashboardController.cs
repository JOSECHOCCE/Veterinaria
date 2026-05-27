using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Web.Models;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin,Recepcionista,Veterinario")]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<ActionResult<Response<object>>> Index()
    {
        var dto = await _dashboardService.GetDashboardDataAsync();

        var viewModel = new DashboardViewModel
        {
            CitasHoyTotal = dto.CitasHoyTotal,
            CitasHoyPendientes = dto.CitasHoyPendientes,
            CitasHoyConfirmadas = dto.CitasHoyConfirmadas,
            CitasHoyEnProceso = dto.CitasHoyEnProceso,
            CitasHoyCompletadas = dto.CitasHoyCompletadas,
            CitasHoyCanceladas = dto.CitasHoyCanceladas,

            CitasSemanaTotal = dto.CitasSemanaTotal,
            CitasSemanaCompletadas = dto.CitasSemanaCompletadas,
            CitasSemanaPendientes = dto.CitasSemanaPendientes,

            ServiciosMasSolicitados = dto.ServiciosMasSolicitados.Select(s => new ServicioEstadistica
            {
                Nombre = s.Nombre,
                CantidadCitas = s.CantidadCitas,
                Ingresos = s.Ingresos
            }).ToList(),

            IngresosMes = dto.IngresosMes,
            PagosConfirmadosMes = dto.PagosConfirmadosMes,

            VeterinariosMasOcupados = dto.VeterinariosMasOcupados.Select(v => new VeterinarioEstadistica
            {
                Nombre = v.Nombre,
                Especialidad = v.Especialidad,
                CitasSemana = v.CitasSemana,
                CitasMes = v.CitasMes
            }).ToList(),

            MascotasPorEspecie = dto.MascotasPorEspecie.Select(m => new EspecieEstadistica
            {
                Especie = m.Especie,
                Cantidad = m.Cantidad
            }).ToList(),

            ProximasCitas = dto.ProximasCitas.Select(c => new CitaProxima
            {
                Id = c.Id,
                FechaHora = c.FechaHora,
                MascotaNombre = c.MascotaNombre,
                PropietarioNombre = c.PropietarioNombre,
                VeterinarioNombre = c.VeterinarioNombre,
                ServicioNombre = c.ServicioNombre,
                Estado = c.Estado
            }).ToList(),

            PagosPendientesCount = dto.PagosPendientesCount,
            PagosPendientesTotal = dto.PagosPendientesTotal,

            TotalMascotas = dto.TotalMascotas,
            TotalVeterinarios = dto.TotalVeterinarios,
            TotalUsuarios = dto.TotalUsuarios,
            TotalServicios = dto.TotalServicios
        };

        return Ok(Response<object>.Ok(viewModel));
    }
}
