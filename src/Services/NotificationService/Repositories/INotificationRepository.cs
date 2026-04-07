using NotificationService.Models;

namespace NotificationService.Repositories;

public interface INotificationRepository
{
    Task<List<NotificationLog>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(NotificationLog notification, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
