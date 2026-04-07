using NotificationService.Contracts;
using Microsoft.AspNetCore.Mvc;
using NotificationService.Services;

namespace NotificationService.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class NotificationsController(INotificationService notificationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<NotificationMessageDto>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await notificationService.GetAllAsync(cancellationToken));

    [HttpPost("send")]
    public async Task<ActionResult<NotificationMessageDto>> Send([FromBody] NotificationMessageDto request, CancellationToken cancellationToken) =>
        Accepted("/api/notifications", await notificationService.SendAsync(request, cancellationToken));
}

