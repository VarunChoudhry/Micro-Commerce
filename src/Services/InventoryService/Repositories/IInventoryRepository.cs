using InventoryService.Models;

namespace InventoryService.Repositories;

public interface IInventoryRepository
{
    Task<List<InventoryRecord>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<InventoryRecord?> GetByProductIdAsync(int productId, CancellationToken cancellationToken = default);
    Task AddAsync(InventoryRecord record, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
