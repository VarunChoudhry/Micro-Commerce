namespace PaymentService.Contracts;

public sealed record PaymentRequest(Guid OrderId, Guid UserId, decimal Amount, string Method);

public sealed record PaymentResultDto(
    Guid PaymentId,
    Guid OrderId,
    Guid UserId,
    decimal Amount,
    string Method,
    string Status,
    DateTimeOffset ProcessedAt);

public sealed record StripeCheckoutLineItemRequest(
    string Name,
    string? Description,
    decimal UnitPrice,
    int Quantity);

public sealed record CreateStripeCheckoutSessionRequest(
    Guid OrderId,
    Guid UserId,
    decimal Amount,
    string Currency,
    string SuccessUrl,
    string CancelUrl,
    IReadOnlyCollection<StripeCheckoutLineItemRequest> Items);

public sealed record StripeCheckoutSessionResponse(
    string SessionId,
    string Url,
    string Status);

public sealed record ConfirmStripeCheckoutSessionRequest(string SessionId);

public sealed record UpdateOrderStatusRequest(string Status);
