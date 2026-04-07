using CatalogService.Contracts;

namespace CatalogService.Services;

public interface IProductService
{
    Task<IReadOnlyCollection<ProductDto>> GetAllAsync(int? categoryId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ProductDto>> SearchAsync(string query, CancellationToken cancellationToken = default);
    Task<ProductDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ProductDto> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default);
    Task<ProductDto?> UpdateAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
