namespace NotificationService.Contracts;

public sealed record NotificationMessageDto(Guid UserId, string Channel, string Subject, string Message, DateTimeOffset SentAt);
