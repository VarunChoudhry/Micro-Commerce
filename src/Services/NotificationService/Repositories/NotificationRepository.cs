using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.Models;

namespace NotificationService.Repositories;

public sealed class NotificationRepository(NotificationDbContext dbContext) : INotificationRepository
{
    public Task<List<NotificationLog>> GetAllAsync(CancellationToken cancellationToken = default) =>
        dbContext.Notifications.OrderByDescending(notification => notification.SentAt).ToListAsync(cancellationToken);

    public Task AddAsync(NotificationLog notification, CancellationToken cancellationToken = default) => dbContext.Notifications.AddAsync(notification, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => dbContext.SaveChangesAsync(cancellationToken);
}
