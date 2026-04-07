using InventoryService.Contracts;
using InventoryService.Models;
using InventoryService.Repositories;

namespace InventoryService.Services;

public sealed class InventoryServiceHandler(IInventoryRepository inventoryRepository) : IInventoryService
{
    public async Task<IReadOnlyCollection<InventoryItemDto>> GetAllAsync(CancellationToken cancellationToken = default) =>
        (await inventoryRepository.GetAllAsync(cancellationToken)).Select(Map).ToList();

    public async Task<InventoryItemDto?> GetByProductIdAsync(int productId, CancellationToken cancellationToken = default)
    {
        var record = await inventoryRepository.GetByProductIdAsync(productId, cancellationToken);
        return record is null ? null : Map(record);
    }

    public async Task<InventoryItemDto> UpsertAsync(int productId, UpdateInventoryRequest request, CancellationToken cancellationToken = default)
    {
        var record = await inventoryRepository.GetByProductIdAsync(productId, cancellationToken);
        if (record is null)
        {
            record = new InventoryRecord { ProductId = productId, ProductName = request.ProductName, AvailableStock = request.AvailableStock };
            await inventoryRepository.AddAsync(record, cancellationToken);
        }
        else
        {
            record.ProductName = request.ProductName;
            record.AvailableStock = request.AvailableStock;
        }

        await inventoryRepository.SaveChangesAsync(cancellationToken);
        return Map(record);
    }

    public async Task<InventoryItemDto?> ReserveAsync(ReserveInventoryRequest request, CancellationToken cancellationToken = default)
    {
        var record = await inventoryRepository.GetByProductIdAsync(request.ProductId, cancellationToken);
        if (record is null || record.AvailableStock < request.Quantity)
        {
            return null;
        }

        record.AvailableStock -= request.Quantity;
        await inventoryRepository.SaveChangesAsync(cancellationToken);
        return Map(record);
    }

    private static InventoryItemDto Map(InventoryRecord record) => new(record.ProductId, record.ProductName, record.AvailableStock);
}

