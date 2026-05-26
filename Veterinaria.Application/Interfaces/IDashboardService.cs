using Veterinaria.Application.DTOs;

namespace Veterinaria.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardDataAsync();
}
