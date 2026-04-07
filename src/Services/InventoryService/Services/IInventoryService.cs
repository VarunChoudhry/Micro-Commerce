using InventoryService.Contracts;

namespace InventoryService.Services;

public interface IInventoryService
{
    Task<IReadOnlyCollection<InventoryItemDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<InventoryItemDto?> GetByProductIdAsync(int productId, CancellationToken cancellationToken = default);
    Task<InventoryItemDto> UpsertAsync(int productId, UpdateInventoryRequest request, CancellationToken cancellationToken = default);
    Task<InventoryItemDto?> ReserveAsync(ReserveInventoryRequest request, CancellationToken cancellationToken = default);
}

