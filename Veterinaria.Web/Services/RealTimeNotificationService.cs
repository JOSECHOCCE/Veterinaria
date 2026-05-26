using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using Veterinaria.Application.Interfaces;
using Veterinaria.Web.Hubs;

namespace Veterinaria.Web.Services;

public class RealTimeNotificationService : IRealTimeNotificationService
{
    private readonly IHubContext<NotificacionHub> _hubContext;

    public RealTimeNotificationService(IHubContext<NotificacionHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendNotificationAsync(string applicationUserId, object notificationData)
    {
        await _hubContext.Clients.Group($"User_{applicationUserId}")
            .SendAsync("RecibirNotificacion", notificationData);
    }
}
