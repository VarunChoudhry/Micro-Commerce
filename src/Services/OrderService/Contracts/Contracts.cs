namespace OrderService.Contracts;

public sealed record CreateOrderRequest(Guid UserId, string ShippingAddress, IReadOnlyCollection<OrderItemDto> Items);

public sealed record OrderItemDto(int ProductId, string ProductName, int Quantity, decimal UnitPrice);

public sealed record OrderDto(
    Guid OrderId,
    Guid UserId,
    string ShippingAddress,
    string Status,
    string? ShippingCarrier,
    string? TrackingNumber,
    DateTimeOffset? ShippedAt,
    DateTimeOffset? DeliveredAt,
    IReadOnlyCollection<OrderItemDto> Items,
    decimal TotalAmount,
    DateTimeOffset CreatedAt);

public sealed record UpdateOrderStatusRequest(string Status, string? ShippingCarrier = null, string? TrackingNumber = null);
