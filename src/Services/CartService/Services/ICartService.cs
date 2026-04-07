using CartService.Contracts;

namespace CartService.Services;

public interface ICartService
{
    Task<CartDto> GetAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<CartDto> AddItemAsync(AddCartItemRequest request, CancellationToken cancellationToken = default);
    Task<CartDto?> UpdateItemAsync(Guid userId, int productId, UpdateCartItemQuantityRequest request, CancellationToken cancellationToken = default);
    Task<CartDto?> RemoveItemAsync(Guid userId, int productId, CancellationToken cancellationToken = default);
    Task<bool> ClearAsync(Guid userId, CancellationToken cancellationToken = default);
}

