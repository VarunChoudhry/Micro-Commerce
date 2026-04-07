namespace InventoryService.Models;

public sealed class InventoryRecord
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int AvailableStock { get; set; }
}
