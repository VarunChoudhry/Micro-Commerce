namespace InventoryService.Contracts;

public sealed record InventoryItemDto(int ProductId, string ProductName, int AvailableStock);

public sealed record UpdateInventoryRequest(string ProductName, int AvailableStock);

public sealed record ReserveInventoryRequest(int ProductId, int Quantity);
