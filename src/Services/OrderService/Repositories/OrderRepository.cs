using Microsoft.EntityFrameworkCore;
using OrderService.Data;
using OrderService.Models;

namespace OrderService.Repositories;

public sealed class OrderRepository(OrderDbContext dbContext) : IOrderRepository
{
    public Task<List<Order>> GetAllAsync(CancellationToken cancellationToken = default) =>
        dbContext.Orders.Include(order => order.Items).OrderByDescending(order => order.CreatedAt).ToListAsync(cancellationToken);

    public Task<List<Order>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        dbContext.Orders.Include(order => order.Items).Where(order => order.UserId == userId).OrderByDescending(order => order.CreatedAt).ToListAsync(cancellationToken);

    public Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.Orders.Include(order => order.Items).FirstOrDefaultAsync(order => order.Id == id, cancellationToken);

    public Task AddAsync(Order order, CancellationToken cancellationToken = default) => dbContext.Orders.AddAsync(order, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => dbContext.SaveChangesAsync(cancellationToken);
}
