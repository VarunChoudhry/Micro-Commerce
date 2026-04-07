using OrderService.Contracts;

namespace OrderService.Services;

public interface IOrderService
{
    Task<IReadOnlyCollection<OrderDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<OrderDto>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<OrderDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<OrderDto> CreateAsync(CreateOrderRequest request, CancellationToken cancellationToken = default);
    Task<OrderDto?> UpdateStatusAsync(Guid id, UpdateOrderStatusRequest request, CancellationToken cancellationToken = default);
}

