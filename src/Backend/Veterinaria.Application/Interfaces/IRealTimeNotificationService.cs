using System.Threading.Tasks;

namespace Veterinaria.Application.Interfaces;

public interface IRealTimeNotificationService
{
    Task SendNotificationAsync(string applicationUserId, object notificationData);

    /// <summary>
    /// Broadcasts a triage queue update to all connected clients (RNF-007: latencia < 3s).
    /// </summary>
    Task SendTriageQueueUpdatedAsync();
}
