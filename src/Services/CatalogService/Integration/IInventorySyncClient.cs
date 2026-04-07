namespace CatalogService.Integration;

public interface IInventorySyncClient
{
    Task UpsertAsync(int productId, string productName, int availableStock, CancellationToken cancellationToken = default);
}
