using InventoryService.Data;
using InventoryService.Models;
using Microsoft.EntityFrameworkCore;

namespace InventoryService.Repositories;

public sealed class InventoryRepository(InventoryDbContext dbContext) : IInventoryRepository
{
    public Task<List<InventoryRecord>> GetAllAsync(CancellationToken cancellationToken = default) =>
        dbContext.Inventory.OrderBy(record => record.ProductName).ToListAsync(cancellationToken);

    public Task<InventoryRecord?> GetByProductIdAsync(int productId, CancellationToken cancellationToken = default) =>
        dbContext.Inventory.FirstOrDefaultAsync(record => record.ProductId == productId, cancellationToken);

    public Task AddAsync(InventoryRecord record, CancellationToken cancellationToken = default) => dbContext.Inventory.AddAsync(record, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => dbContext.SaveChangesAsync(cancellationToken);
}
