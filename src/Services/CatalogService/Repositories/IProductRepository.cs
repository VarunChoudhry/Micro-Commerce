using CatalogService.Models;

namespace CatalogService.Repositories;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync(int? categoryId, CancellationToken cancellationToken = default);
    Task<List<Product>> SearchAsync(string query, CancellationToken cancellationToken = default);
    Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task AddAsync(Product product, CancellationToken cancellationToken = default);
    void Update(Product product);
    void Remove(Product product);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
