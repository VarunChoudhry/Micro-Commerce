namespace CartService.Contracts;

public sealed record CartItemDto(int ProductId, string ProductName, int Quantity, decimal UnitPrice);

public sealed record CartDto(Guid UserId, IReadOnlyCollection<CartItemDto> Items)
{
    public decimal Total => Items.Sum(item => item.UnitPrice * item.Quantity);
}

public sealed record AddCartItemRequest(Guid UserId, int ProductId, string ProductName, int Quantity, decimal UnitPrice);

public sealed record UpdateCartItemQuantityRequest(Guid UserId, int Quantity);
