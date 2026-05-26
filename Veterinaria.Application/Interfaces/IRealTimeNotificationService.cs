using System.Threading.Tasks;

namespace Veterinaria.Application.Interfaces;

public interface IRealTimeNotificationService
{
    Task SendNotificationAsync(string applicationUserId, object notificationData);
}
