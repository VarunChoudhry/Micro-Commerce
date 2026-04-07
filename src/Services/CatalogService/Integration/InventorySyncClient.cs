using System.Net.Http.Json;
using CatalogService.Contracts;

namespace CatalogService.Integration;

public sealed class InventorySyncClient(HttpClient httpClient) : IInventorySyncClient
{
    public async Task UpsertAsync(int productId, string productName, int availableStock, CancellationToken cancellationToken = default)
    {
        var request = new UpdateInventoryRequest(productName, availableStock);
        using var response = await httpClient.PutAsJsonAsync($"{productId}", request, cancellationToken);
        response.EnsureSuccessStatusCode();
    }
}

