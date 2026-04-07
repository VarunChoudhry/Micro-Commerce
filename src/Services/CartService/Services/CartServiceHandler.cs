using CartService.Contracts;
using CartService.Models;
using CartService.Repositories;

namespace CartService.Services;

public sealed class CartServiceHandler(ICartRepository cartRepository) : ICartService
{
    public async Task<CartDto> GetAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var cart = await cartRepository.GetByUserIdAsync(userId, cancellationToken);
        return ToDto(cart ?? new Cart { UserId = userId });
    }

    public async Task<CartDto> AddItemAsync(AddCartItemRequest request, CancellationToken cancellationToken = default)
    {
        var cart = await cartRepository.GetByUserIdAsync(request.UserId, cancellationToken);
        if (cart is null)
        {
            cart = new Cart { UserId = request.UserId };
            await cartRepository.AddAsync(cart, cancellationToken);
            await cartRepository.SaveChangesAsync(cancellationToken);
        }

        var existing = cart.Items.FirstOrDefault(item => item.ProductId == request.ProductId);
        if (existing is null)
        {
            await cartRepository.AddItemAsync(new CartItem
            {
                CartId = cart.Id,
                Cart = cart,
                ProductId = request.ProductId,
                ProductName = request.ProductName,
                Quantity = request.Quantity,
                UnitPrice = request.UnitPrice
            }, cancellationToken);
        }
        else
        {
            existing.Quantity += request.Quantity;
        }

        await cartRepository.SaveChangesAsync(cancellationToken);
        return ToDto(cart);
    }

    public async Task<CartDto?> UpdateItemAsync(Guid userId, int productId, UpdateCartItemQuantityRequest request, CancellationToken cancellationToken = default)
    {
        var cart = await cartRepository.GetByUserIdAsync(userId, cancellationToken);
        var item = cart?.Items.FirstOrDefault(entry => entry.ProductId == productId);
        if (item is null)
        {
            return null;
        }

        item.Quantity = request.Quantity;
        await cartRepository.SaveChangesAsync(cancellationToken);
        return ToDto(cart!);
    }

    public async Task<CartDto?> RemoveItemAsync(Guid userId, int productId, CancellationToken cancellationToken = default)
    {
        var cart = await cartRepository.GetByUserIdAsync(userId, cancellationToken);
        var item = cart?.Items.FirstOrDefault(entry => entry.ProductId == productId);
        if (item is null)
        {
            return null;
        }

        cart!.Items.Remove(item);
        await cartRepository.SaveChangesAsync(cancellationToken);
        return ToDto(cart);
    }

    public async Task<bool> ClearAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var cart = await cartRepository.GetByUserIdAsync(userId, cancellationToken);
        if (cart is null)
        {
            return false;
        }

        cartRepository.Remove(cart);
        await cartRepository.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static CartDto ToDto(Cart cart) =>
        new(cart.UserId, cart.Items.Select(item => new CartItemDto(item.ProductId, item.ProductName, item.Quantity, item.UnitPrice)).ToList());
}

