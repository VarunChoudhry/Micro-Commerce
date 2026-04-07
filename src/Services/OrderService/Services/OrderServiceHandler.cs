using OrderService.Contracts;
using OrderService.Models;
using OrderService.Repositories;

namespace OrderService.Services;

public sealed class OrderServiceHandler(IOrderRepository orderRepository, KafkaProducer kafkaProducer) : IOrderService
{
    public async Task<IReadOnlyCollection<OrderDto>> GetAllAsync(CancellationToken cancellationToken = default) =>
        (await orderRepository.GetAllAsync(cancellationToken)).Select(ToDto).ToList();

    public async Task<IReadOnlyCollection<OrderDto>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default) =>
        (await orderRepository.GetByUserIdAsync(userId, cancellationToken)).Select(ToDto).ToList();

    public async Task<OrderDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await orderRepository.GetByIdAsync(id, cancellationToken);
        return order is null ? null : ToDto(order);
    }

    public async Task<OrderDto> CreateAsync(CreateOrderRequest request, CancellationToken cancellationToken = default)
    {
        var order = new Order
        {
            UserId = request.UserId,
            ShippingAddress = request.ShippingAddress,
            Status = "Pending",
            TotalAmount = request.Items.Sum(item => item.Quantity * item.UnitPrice),
            Items = request.Items.Select(item => new OrderItem
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            }).ToList()
        };

        await orderRepository.AddAsync(order, cancellationToken);
        await orderRepository.SaveChangesAsync(cancellationToken);
        await kafkaProducer.PublishAsync("order-events", new
        {
            Event = "OrderCreated",
            OrderId = order.Id,
            UserId = order.UserId
        });
        return ToDto(order);
    }

    public async Task<OrderDto?> UpdateStatusAsync(Guid id, UpdateOrderStatusRequest request, CancellationToken cancellationToken = default)
    {
        var order = await orderRepository.GetByIdAsync(id, cancellationToken);
        if (order is null)
        {
            return null;
        }

        var normalizedStatus = NormalizeStatus(request.Status);
        order.Status = normalizedStatus;

        if (!string.IsNullOrWhiteSpace(request.ShippingCarrier))
        {
            order.ShippingCarrier = request.ShippingCarrier.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.TrackingNumber))
        {
            order.TrackingNumber = request.TrackingNumber.Trim();
        }

        if (normalizedStatus == "Shipped")
        {
            order.ShippedAt ??= DateTimeOffset.UtcNow;
            order.ShippingCarrier ??= "Standard Delivery";
            order.TrackingNumber ??= GenerateTrackingNumber(order.Id);
        }

        if (normalizedStatus == "Delivered")
        {
            order.ShippedAt ??= DateTimeOffset.UtcNow;
            order.DeliveredAt ??= DateTimeOffset.UtcNow;
            order.ShippingCarrier ??= "Standard Delivery";
            order.TrackingNumber ??= GenerateTrackingNumber(order.Id);
        }

        await orderRepository.SaveChangesAsync(cancellationToken);
        return ToDto(order);
    }

    private static string NormalizeStatus(string? status)
    {
        var value = status?.Trim().ToLowerInvariant();
        return value switch
        {
            "pending" => "Pending",
            "paid" => "Paid",
            "processing" => "Processing",
            "shipped" => "Shipped",
            "delivered" => "Delivered",
            "cancelled" => "Cancelled",
            _ => "Pending"
        };
    }

    private static string GenerateTrackingNumber(Guid orderId) => $"MC-{orderId.ToString("N")[..10].ToUpperInvariant()}";

    private static OrderDto ToDto(Order order) =>
        new(
            order.Id,
            order.UserId,
            order.ShippingAddress,
            order.Status,
            order.ShippingCarrier,
            order.TrackingNumber,
            order.ShippedAt,
            order.DeliveredAt,
            order.Items.Select(item => new OrderItemDto(item.ProductId, item.ProductName, item.Quantity, item.UnitPrice)).ToList(),
            order.TotalAmount,
            order.CreatedAt);
}
