namespace CatalogService.Contracts;

public sealed record CategoryDto(int Id, string Name);

public sealed record CreateCategoryRequest(string Name);

public sealed record UpdateCategoryRequest(string Name);

public sealed record ProductDto(
    int Id,
    string Name,
    string Description,
    decimal Price,
    int Stock,
    string? ImageBase64,
    int CategoryId,
    string CategoryName);

public sealed record CreateProductRequest(
    string Name,
    string Description,
    decimal Price,
    int Stock,
    string? ImageBase64,
    int CategoryId);

public sealed record UpdateProductRequest(
    string Name,
    string Description,
    decimal Price,
    int Stock,
    string? ImageBase64,
    int CategoryId);

public sealed record UpdateInventoryRequest(string ProductName, int AvailableStock);
