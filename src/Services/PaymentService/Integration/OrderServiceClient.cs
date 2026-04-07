using System.Net.Http.Json;
using PaymentService.Contracts;

namespace PaymentService.Integration;

public interface IOrderServiceClient
{
    Task<bool> UpdateStatusAsync(Guid orderId, string status, CancellationToken cancellationToken = default);
}

public sealed class OrderServiceClient(HttpClient httpClient) : IOrderServiceClient
{
    public async Task<bool> UpdateStatusAsync(Guid orderId, string status, CancellationToken cancellationToken = default)
    {
        using var response = await httpClient.PutAsJsonAsync($"{orderId}/status", new UpdateOrderStatusRequest(status), cancellationToken);
        return response.IsSuccessStatusCode;
    }
}

