using NotificationService.Contracts;

namespace NotificationService.Services;

public interface INotificationService
{
    Task<IReadOnlyCollection<NotificationMessageDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<NotificationMessageDto> SendAsync(NotificationMessageDto request, CancellationToken cancellationToken = default);
}

