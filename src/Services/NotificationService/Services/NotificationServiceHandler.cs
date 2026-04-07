using NotificationService.Contracts;
using NotificationService.Models;
using NotificationService.Repositories;

namespace NotificationService.Services;

public sealed class NotificationServiceHandler(INotificationRepository notificationRepository) : INotificationService
{
    public async Task<IReadOnlyCollection<NotificationMessageDto>> GetAllAsync(CancellationToken cancellationToken = default) =>
        (await notificationRepository.GetAllAsync(cancellationToken))
        .Select(item => new NotificationMessageDto(item.UserId, item.Channel, item.Subject, item.Message, item.SentAt))
        .ToList();

    public async Task<NotificationMessageDto> SendAsync(NotificationMessageDto request, CancellationToken cancellationToken = default)
    {
        var notification = new NotificationLog
        {
            UserId = request.UserId,
            Channel = request.Channel,
            Subject = request.Subject,
            Message = request.Message,
            SentAt = request.SentAt == default ? DateTimeOffset.UtcNow : request.SentAt
        };

        await notificationRepository.AddAsync(notification, cancellationToken);
        await notificationRepository.SaveChangesAsync(cancellationToken);
        return new NotificationMessageDto(notification.UserId, notification.Channel, notification.Subject, notification.Message, notification.SentAt);
    }
}

