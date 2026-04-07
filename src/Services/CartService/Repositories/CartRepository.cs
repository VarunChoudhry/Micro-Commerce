using CartService.Data;
using CartService.Models;
using Microsoft.EntityFrameworkCore;

namespace CartService.Repositories;

public sealed class CartRepository(CartDbContext dbContext) : ICartRepository
{
    public Task<Cart?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        dbContext.Carts.Include(cart => cart.Items).FirstOrDefaultAsync(cart => cart.UserId == userId, cancellationToken);

    public Task AddAsync(Cart cart, CancellationToken cancellationToken = default) => dbContext.Carts.AddAsync(cart, cancellationToken).AsTask();

    public Task AddItemAsync(CartItem item, CancellationToken cancellationToken = default) => dbContext.CartItems.AddAsync(item, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => dbContext.SaveChangesAsync(cancellationToken);

    public void Remove(Cart cart) => dbContext.Carts.Remove(cart);
}
